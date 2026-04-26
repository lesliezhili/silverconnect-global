-- Migration: Add missing tables and columns for Modules 5 & 6
-- Run this to update your existing database schema

-- 1. Update disputes table with additional fields
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES service_providers(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS dispute_type TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS evidence_urls TEXT[];
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS requested_action TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_amount DECIMAL(10,2);

-- 2. Create safety_flags table
CREATE TABLE IF NOT EXISTS safety_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id),
  flag_type TEXT NOT NULL, -- safety_concern, no_show, inappropriate_behavior, property_damage, medical_emergency, other
  description TEXT NOT NULL,
  severity TEXT DEFAULT 'medium', -- low, medium, high, critical
  reported_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending_review', -- pending_review, investigating, resolved, dismissed
  resolution_notes TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Update customer_feedback with additional ratings
ALTER TABLE customer_feedback ADD COLUMN IF NOT EXISTS punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5);
ALTER TABLE customer_feedback ADD COLUMN IF NOT EXISTS professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5);
ALTER TABLE customer_feedback ADD COLUMN IF NOT EXISTS quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5);
ALTER TABLE customer_feedback ADD COLUMN IF NOT EXISTS would_rebook BOOLEAN DEFAULT true;

-- 4. Enable RLS on safety_flags
ALTER TABLE safety_flags ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for safety_flags
CREATE POLICY "Users can view safety flags for their bookings" ON safety_flags FOR SELECT USING (
  auth.uid() = reported_by 
  OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = safety_flags.booking_id AND bookings.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = safety_flags.provider_id AND auth.uid() = service_providers.user_id)
);

CREATE POLICY "Users can create safety flags for their bookings" ON safety_flags FOR INSERT WITH CHECK (
  auth.uid() = reported_by 
  OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = safety_flags.booking_id AND bookings.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = safety_flags.provider_id AND auth.uid() = service_providers.user_id)
);

-- 6. RLS Policies for disputes (update existing or add if missing)
DROP POLICY IF EXISTS "Users can view their own disputes" ON disputes;
CREATE POLICY "Users can view their own disputes" ON disputes FOR SELECT USING (
  auth.uid() = customer_id 
  OR auth.uid() = provider_id
  OR EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

DROP POLICY IF EXISTS "Users can create disputes for their bookings" ON disputes;
CREATE POLICY "Users can create disputes for their bookings" ON disputes FOR INSERT WITH CHECK (
  auth.uid() = customer_id 
  OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = disputes.provider_id AND auth.uid() = service_providers.user_id)
);

-- 7. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_safety_flags_provider_id ON safety_flags(provider_id);
CREATE INDEX IF NOT EXISTS idx_safety_flags_status ON safety_flags(status);
CREATE INDEX IF NOT EXISTS idx_safety_flags_booking_id ON safety_flags(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_customer_id ON disputes(customer_id);
CREATE INDEX IF NOT EXISTS idx_disputes_provider_id ON disputes(provider_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_booking_id ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_provider_id ON customer_feedback(provider_id);
CREATE INDEX IF NOT EXISTS idx_customer_feedback_booking_id ON customer_feedback(booking_id);

-- 8. Add indexes for existing tables
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON bookings(booking_date);

-- 9. Create function to update provider average rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_providers
  SET 
    rating = (
      SELECT COALESCE(AVG(rating), 5.0)
      FROM customer_feedback
      WHERE provider_id = NEW.provider_id
    ),
    total_ratings = (
      SELECT COUNT(*)
      FROM customer_feedback
      WHERE provider_id = NEW.provider_id
    )
  WHERE id = NEW.provider_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 10. Create trigger to update provider rating on new feedback
DROP TRIGGER IF EXISTS update_provider_rating_trigger ON customer_feedback;
CREATE TRIGGER update_provider_rating_trigger
AFTER INSERT OR UPDATE ON customer_feedback
FOR EACH ROW
EXECUTE FUNCTION update_provider_rating();

-- 11. Create function to update booking status history
CREATE OR REPLACE FUNCTION update_booking_status_history()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO booking_status_history (booking_id, old_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Create trigger for booking status history
DROP TRIGGER IF EXISTS booking_status_history_trigger ON bookings;
CREATE TRIGGER booking_status_history_trigger
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_booking_status_history();

-- 13. Add full_text_search column for services (for better search)
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- 14. Create trigger to update search vector
CREATE OR REPLACE FUNCTION services_search_vector_trigger()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_vector(COALESCE(NEW.name, '')), 'A') ||
    setweight(to_vector(COALESCE(NEW.category, '')), 'B') ||
    setweight(to_vector(COALESCE(NEW.description, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS services_search_trigger ON services;
CREATE TRIGGER services_search_trigger
BEFORE INSERT OR UPDATE ON services
FOR EACH ROW
EXECUTE FUNCTION services_search_vector_trigger();

-- 15. Update existing services with search vectors
UPDATE services SET search_vector = 
  setweight(to_vector(COALESCE(name, '')), 'A') ||
  setweight(to_vector(COALESCE(category, '')), 'B') ||
  setweight(to_vector(COALESCE(description, '')), 'C')
WHERE search_vector IS NULL;

-- 16. Create index for full-text search
CREATE INDEX IF NOT EXISTS idx_services_search ON services USING GIN(search_vector);

-- 17. Add user preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  language TEXT DEFAULT 'en',
  notification_email BOOLEAN DEFAULT true,
  notification_sms BOOLEAN DEFAULT false,
  notification_push BOOLEAN DEFAULT true,
  preferred_contact_method TEXT DEFAULT 'email',
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 18. Enable RLS on user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- 19. RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 20. Add emergency contacts table
CREATE TABLE IF NOT EXISTS emergency_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 21. Enable RLS on emergency_contacts
ALTER TABLE emergency_contacts ENABLE ROW LEVEL SECURITY;

-- 22. RLS Policies for emergency_contacts
CREATE POLICY "Users can view their own emergency contacts" ON emergency_contacts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own emergency contacts" ON emergency_contacts FOR ALL USING (auth.uid() = user_id);

-- 23. Add medical info table
CREATE TABLE IF NOT EXISTS medical_info (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  blood_type TEXT,
  allergies TEXT,
  medical_conditions TEXT,
  medications TEXT,
  mobility_limitations TEXT,
  emergency_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 24. Enable RLS on medical_info
ALTER TABLE medical_info ENABLE ROW LEVEL SECURITY;

-- 25. RLS Policies for medical_info
CREATE POLICY "Users can view their own medical info" ON medical_info FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own medical info" ON medical_info FOR ALL USING (auth.uid() = user_id);

-- 26. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_contacts_user_id ON emergency_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_medical_info_user_id ON medical_info(user_id);

-- 27. Add provider documents table
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- id_verification, background_check, certification, insurance
  file_url TEXT NOT NULL,
  file_name TEXT,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 28. Enable RLS on provider_documents
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;

-- 29. RLS Policies for provider_documents
CREATE POLICY "Providers can view their own documents" ON provider_documents FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);
CREATE POLICY "Providers can manage their own documents" ON provider_documents FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);

-- 30. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_documents_provider_id ON provider_documents(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_documents_status ON provider_documents(status);

-- 31. Add provider analytics table
CREATE TABLE IF NOT EXISTS provider_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  total_revenue DECIMAL(10,2) DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  response_time_avg_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, period_start, period_end)
);

-- 32. Enable RLS on provider_analytics
ALTER TABLE provider_analytics ENABLE ROW LEVEL SECURITY;

-- 33. RLS Policies for provider_analytics
CREATE POLICY "Providers can view their own analytics" ON provider_analytics FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);

-- 34. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_analytics_provider_id ON provider_analytics(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_analytics_period ON provider_analytics(period_start, period_end);

-- 35. Create view for provider dashboard
CREATE OR REPLACE VIEW provider_dashboard_view AS
SELECT 
  sp.id as provider_id,
  sp.full_name,
  sp.rating,
  sp.total_ratings,
  sp.is_verified,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
  COALESCE(SUM(b.total_price), 0) as total_revenue,
  MAX(b.booking_date) as last_booking_date
FROM service_providers sp
LEFT JOIN bookings b ON sp.id = b.provider_id
GROUP BY sp.id, sp.full_name, sp.rating, sp.total_ratings, sp.is_verified;

-- 36. Create view for customer dashboard
CREATE OR REPLACE VIEW customer_dashboard_view AS
SELECT 
  u.id as user_id,
  u.full_name,
  u.email,
  COUNT(b.id) as total_bookings,
  COUNT(CASE WHEN b.status = 'COMPLETED' THEN 1 END) as completed_bookings,
  COUNT(CASE WHEN b.status = 'PENDING' THEN 1 END) as pending_bookings,
  COUNT(CASE WHEN b.status = 'CANCELLED' THEN 1 END) as cancelled_bookings,
  COALESCE(SUM(b.total_price), 0) as total_spent,
  MAX(b.booking_date) as last_booking_date
FROM users u
LEFT JOIN bookings b ON u.id = b.user_id
WHERE u.user_type = 'customer'
GROUP BY u.id, u.full_name, u.email;

-- 37. Create function to get available time slots
CREATE OR REPLACE FUNCTION get_available_slots(
  p_provider_id UUID,
  p_date DATE,
  p_service_duration INTEGER DEFAULT 60
)
RETURNS TABLE(available_time TIME) AS $$
DECLARE
  v_day_of_week INTEGER;
  v_start_time TIME;
  v_end_time TIME;
  v_slot_time TIME;
  v_existing_booking TIME;
BEGIN
  -- Get provider's availability for the day
  SELECT EXTRACT(DOW FROM p_date)::INTEGER INTO v_day_of_week;
  
  SELECT pa.start_time, pa.end_time INTO v_start_time, v_end_time
  FROM provider_availability pa
  WHERE pa.provider_id = p_provider_id
    AND pa.day_of_week = v_day_of_week
    AND pa.is_available = true;

  -- If no availability, return empty
  IF v_start_time IS NULL OR v_end_time IS NULL THEN
    RETURN;
  END IF;

  -- Get existing bookings for the date
  FOR v_existing_booking IN
    SELECT b.booking_time FROM bookings b
    WHERE b.provider_id = p_provider_id
      AND b.booking_date = p_date
      AND b.status NOT IN ('CANCELLED')
  LOOP
    -- Generate available slots excluding existing bookings
    v_slot_time := v_start_time;
    WHILE v_slot_time < v_end_time LOOP
      IF v_slot_time != v_existing_booking THEN
        RETURN NEXT;
      END IF;
      v_slot_time := v_slot_time + (p_service_duration || ' minutes')::INTERVAL;
    END LOOP;
  END LOOP;

  -- If no existing bookings, return all slots
  v_slot_time := v_start_time;
  WHILE v_slot_time < v_end_time LOOP
    RETURN NEXT v_slot_time;
    v_slot_time := v_slot_time + (p_service_duration || ' minutes')::INTERVAL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 38. Grant execute on functions
GRANT EXECUTE ON FUNCTION update_provider_rating() TO authenticated;
GRANT EXECUTE ON FUNCTION update_booking_status_history() TO authenticated;
GRANT EXECUTE ON FUNCTION services_search_vector_trigger() TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots(UUID, DATE, INTEGER) TO authenticated;

-- 39. Grant permissions
GRANT SELECT ON provider_dashboard_view TO authenticated;
GRANT SELECT ON customer_dashboard_view TO authenticated;

-- 40. Add audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 41. Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 42. RLS Policies for audit_logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.user_type = 'admin')
);

-- 43. Create function to log actions
CREATE OR REPLACE FUNCTION log_action(
  p_action TEXT,
  p_table_name TEXT,
  p_record_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO audit_logs (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_action(TEXT, TEXT, UUID, JSONB, JSONB) TO authenticated;

-- 44. Add notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  booking_confirmation BOOLEAN DEFAULT true,
  booking_reminder BOOLEAN DEFAULT true,
  reminder_hours_before INTEGER DEFAULT 24,
  booking_cancellation BOOLEAN DEFAULT true,
  payment_receipt BOOLEAN DEFAULT true,
  provider_response BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 45. Enable RLS on notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- 46. RLS Policies for notification_preferences
CREATE POLICY "Users can view their own notification preferences" ON notification_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notification preferences" ON notification_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own notification preferences" ON notification_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 47. Add indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- 48. Add provider schedule exceptions (holidays, time off)
CREATE TABLE IF NOT EXISTS provider_schedule_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  exception_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_unavailable BOOLEAN DEFAULT true,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 49. Enable RLS on provider_schedule_exceptions
ALTER TABLE provider_schedule_exceptions ENABLE ROW LEVEL SECURITY;

-- 50. RLS Policies for provider_schedule_exceptions
CREATE POLICY "Providers can manage their own schedule exceptions" ON provider_schedule_exceptions FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);

CREATE POLICY "Customers can view provider schedule exceptions" ON provider_schedule_exceptions FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.provider_id = provider_id AND bookings.user_id = auth.uid())
);

-- 51. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_schedule_exceptions_provider_id ON provider_schedule_exceptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_schedule_exceptions_date ON provider_schedule_exceptions(exception_date);

-- 52. Add service categories table
CREATE TABLE IF NOT EXISTS service_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 53. Insert default categories
INSERT INTO service_categories (name, slug, description, icon, display_order) VALUES
  ('Cleaning', 'cleaning', 'Home cleaning and maintenance services', '🧹', 1),
  ('Cooking', 'cooking', 'Meal preparation and cooking services', '🍳', 2),
  ('Gardening', 'gardening', 'Garden maintenance and landscaping', '🌱', 3),
  ('Personal Care', 'personal', 'Personal assistance and companionship', '💕', 4),
  ('Home Maintenance', 'maintenance', 'Home repairs and handyman services', '🔧', 5)
ON CONFLICT (slug) DO NOTHING;

-- 54. Enable RLS on service_categories
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;

-- 55. RLS Policies for service_categories
CREATE POLICY "Anyone can view active service categories" ON service_categories FOR SELECT USING (is_active = true);

-- 56. Add provider working zones (service areas)
CREATE TABLE IF NOT EXISTS provider_service_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  city TEXT,
  postal_code TEXT,
  radius_km INTEGER DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 57. Enable RLS on provider_service_areas
ALTER TABLE provider_service_areas ENABLE ROW LEVEL SECURITY;

-- 58. RLS Policies for provider_service_areas
CREATE POLICY "Providers can manage their own service areas" ON provider_service_areas FOR ALL USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);

-- 59. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_service_areas_provider_id ON provider_service_areas(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_service_areas_location ON provider_service_areas(country_code, city);

-- 60. Add waitlist table for fully booked providers
CREATE TABLE IF NOT EXISTS provider_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES service_providers(id),
  preferred_date DATE,
  preferred_time TIME,
  notes TEXT,
  notified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 61. Enable RLS on provider_waitlist
ALTER TABLE provider_waitlist ENABLE ROW LEVEL SECURITY;

-- 62. RLS Policies for provider_waitlist
CREATE POLICY "Users can manage their own waitlist entries" ON provider_waitlist FOR ALL USING (auth.uid() = user_id);

-- 63. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_waitlist_provider_id ON provider_waitlist(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_waitlist_user_id ON provider_waitlist(user_id);

-- 64. Add referral system tables
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES users(id),
  referee_id UUID REFERENCES users(id),
  referral_code TEXT NOT NULL UNIQUE,
  status TEXT DEFAULT 'pending', -- pending, completed, expired
  reward_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 65. Enable RLS on referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

-- 66. RLS Policies for referrals
CREATE POLICY "Users can view their own referrals" ON referrals FOR SELECT USING (
  auth.uid() = referrer_id OR auth.uid() = referee_id
);

-- 67. Add indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer_id ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referee_id ON referrals(referee_id);
CREATE INDEX IF NOT EXISTS idx_referrals_code ON referrals(referral_code);

-- 68. Add promo codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL, -- percentage, fixed
  discount_value DECIMAL(10,2) NOT NULL,
  min_booking_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  valid_from DATE,
  valid_until DATE,
  applicable_services TEXT[], -- service IDs or NULL for all
  applicable_countries TEXT[], -- country codes or NULL for all
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 69. Enable RLS on promo_codes
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;

-- 70. RLS Policies for promo_codes
CREATE POLICY "Anyone can view active promo codes" ON promo_codes FOR SELECT USING (is_active = true);

-- 71. Add indexes
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_validity ON promo_codes(valid_from, valid_until);

-- 72. Add booking modifications table
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL, -- reschedule, cancel, extend
  old_value TEXT,
  new_value TEXT,
  reason TEXT,
  requested_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 73. Enable RLS on booking_modifications
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;

-- 74. RLS Policies for booking_modifications
CREATE POLICY "Users can view modifications for their bookings" ON booking_modifications FOR SELECT USING (
  auth.uid() = requested_by
  OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_modifications.booking_id AND bookings.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = (SELECT provider_id FROM bookings WHERE id = booking_modifications.booking_id) AND auth.uid() = service_providers.user_id)
);

CREATE POLICY "Users can create modifications for their bookings" ON booking_modifications FOR INSERT WITH CHECK (
  auth.uid() = requested_by
  OR EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_modifications.booking_id AND bookings.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = (SELECT provider_id FROM bookings WHERE id = booking_modifications.booking_id) AND auth.uid() = service_providers.user_id)
);

-- 75. Add indexes
CREATE INDEX IF NOT EXISTS idx_booking_modifications_booking_id ON booking_modifications(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_modifications_status ON booking_modifications(status);

-- 76. Add provider response time tracking
CREATE TABLE IF NOT EXISTS provider_response_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  inquiry_received_at TIMESTAMP NOT NULL,
  first_response_at TIMESTAMP,
  response_time_minutes INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 77. Enable RLS on provider_response_times
ALTER TABLE provider_response_times ENABLE ROW LEVEL SECURITY;

-- 78. RLS Policies for provider_response_times
CREATE POLICY "Providers can view their own response times" ON provider_response_times FOR SELECT USING (
  auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id)
);

-- 79. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_response_times_provider_id ON provider_response_times(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_response_times_booking_id ON provider_response_times(booking_id);

-- 80. Add subscription plans table (for premium features)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  monthly_price DECIMAL(10,2) NOT NULL,
  yearly_price DECIMAL(10,2),
  features JSONB DEFAULT '[]',
  max_bookings_per_month INTEGER,
  priority_support BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 81. Insert default subscription plans
INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, features, max_bookings_per_month, priority_support) VALUES
  ('Free', 'Basic access to the platform', 0, 0, '["Basic booking", "Standard support", "Limited provider access"]', 5, false),
  ('Premium', 'Enhanced features for frequent users', 9.99, 99.99, '["Unlimited bookings", "Priority support", "All providers", "Exclusive deals"]', NULL, true),
  ('Family', 'Family plan for multiple members', 19.99, 199.99, '["Unlimited bookings", "Priority support", "All providers", "Family management", "Exclusive deals"]', NULL, true)
ON CONFLICT (name) DO NOTHING;

-- 82. Enable RLS on subscription_plans
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

-- 83. RLS Policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans" ON subscription_plans FOR SELECT USING (is_active = true);

-- 84. Add user subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT DEFAULT 'active', -- active, cancelled, expired
  start_date DATE NOT NULL,
  end_date DATE,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 85. Enable RLS on user_subscriptions
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- 86. RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON user_subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage their own subscriptions" ON user_subscriptions FOR ALL USING (auth.uid() = user_id);

-- 87. Add indexes
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_status ON user_subscriptions(status);

-- 88. Add provider badges table
CREATE TABLE IF NOT EXISTS provider_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  criteria JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 89. Insert default badges
INSERT INTO provider_badges (name, description, icon, criteria) VALUES
  ('Top Rated', 'Achieved 4.8+ average rating', '⭐', '{"min_rating": 4.8}'),
  ('Quick Responder', 'Average response time under 30 minutes', '⚡', '{"max_response_time": 30}'),
  ('Verified', 'Completed all verification steps', '✅', '{"is_verified": true}'),
  ('Trusted', 'Completed 50+ bookings', '🏆', '{"min_bookings": 50}'),
  ('Newcomer', 'Recently joined the platform', '🌟', '{"days_since_join": 30}')
ON CONFLICT (name) DO NOTHING;

-- 90. Enable RLS on provider_badges
ALTER TABLE provider_badges ENABLE ROW LEVEL SECURITY;

-- 91. RLS Policies for provider_badges
CREATE POLICY "Anyone can view provider badges" ON provider_badges FOR SELECT USING (true);

-- 92. Add provider badges junction table
CREATE TABLE IF NOT EXISTS provider_badge_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES provider_badges(id),
  awarded_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, badge_id)
);

-- 93. Enable RLS on provider_badge_assignments
ALTER TABLE provider_badge_assignments ENABLE ROW LEVEL SECURITY;

-- 94. RLS Policies for provider_badge_assignments
CREATE POLICY "Anyone can view provider badges" ON provider_badge_assignments FOR SELECT USING (true);

-- 95. Add indexes
CREATE INDEX IF NOT EXISTS idx_provider_badge_assignments_provider_id ON provider_badge_assignments(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_badge_assignments_badge_id ON provider_badge_assignments(badge_id);

-- 96. Add FAQ table
CREATE TABLE IF NOT EXISTS faqs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 97. Insert default FAQs
INSERT INTO faqs (question, answer, category, display_order) VALUES
  ('How do I book a service?', 'Browse our providers, select a service, choose your preferred date and time, and complete payment.', 'Booking', 1),
  ('How do I cancel a booking?', 'Go to your bookings, select the booking you want to cancel, and click the cancel button. Note that cancellation policies may apply.', 'Booking', 2),
  ('How does payment work?', 'We use secure Stripe payment. Your payment is held in escrow until the service is completed.', 'Payments', 3),
  ('What if I have a dispute?', 'Contact our support team through the app or submit a dispute through the booking details page.', 'Support', 4),
  ('How do I become a provider?', 'Sign up as a provider, complete your profile, verify your identity, and start accepting bookings.', 'Providers', 5)
ON CONFLICT DO NOTHING;

-- 98. Enable RLS on faqs
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;

-- 99. RLS Policies for faqs
CREATE POLICY "Anyone can view active FAQs" ON faqs FOR SELECT USING (is_active = true);

-- 100. Add support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  subject TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT, -- billing, technical, booking, general
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'open', -- open, in_progress, resolved, closed
  assigned_to UUID REFERENCES users(id),
  resolution_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- 101. Enable RLS on support_tickets
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- 102. RLS Policies for support_tickets
CREATE POLICY "Users can view their own support tickets" ON support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create support tickets" ON support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own support tickets" ON support_tickets FOR UPDATE USING (auth.uid() = user_id AND status = 'open');

-- 103. Add indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_user_id ON support_tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);

-- 104. Final permissions - grant all necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Print completion message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
END $$;