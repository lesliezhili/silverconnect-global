-- =====================================================
-- SILVERCONNECT GLOBAL DATABASE SCHEMA
-- Complete schema with all columns added before policies
-- =====================================================

-- =====================================================
-- 1. COUNTRIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add Chinese name column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'countries' AND column_name = 'name_zh') THEN
    ALTER TABLE countries ADD COLUMN name_zh TEXT;
  END IF;
END $$;

-- Insert countries
INSERT INTO countries (code, name, name_zh, currency_code, currency_symbol, tax_rate) VALUES
('AU', 'Australia', '澳大利亚', 'AUD', '$', 10.00),
('US', 'United States', '美国', 'USD', '$', 8.00),
('CA', 'Canada', '加拿大', 'CAD', '$', 13.00)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- 2. SERVICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  requires_material BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add Chinese columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'name_zh') THEN
    ALTER TABLE services ADD COLUMN name_zh TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'services' AND column_name = 'description_zh') THEN
    ALTER TABLE services ADD COLUMN description_zh TEXT;
  END IF;
END $$;

-- Insert services
INSERT INTO services (category, name, name_zh, description, description_zh, duration_minutes) VALUES
('cleaning', 'Standard Home Cleaning', '标准家庭清洁', 'Complete home cleaning including dusting, vacuuming, mopping all rooms', '完整的家庭清洁，包括除尘、吸尘、拖地', 120),
('cleaning', 'Deep Cleaning', '深度清洁', 'Thorough deep clean including appliances and windows', '深度清洁，包括电器和窗户', 240),
('cleaning', 'Window Cleaning', '窗户清洁', 'Professional interior and exterior window cleaning', '专业的室内外窗户清洁', 90),
('cooking', 'Weekly Meal Prep', '每周备餐', '5 days of healthy, pre-portioned meals', '5天健康分份餐食', 180),
('cooking', 'Daily Home Cooking', '每日家常烹饪', 'Fresh daily meals prepared in your kitchen', '在您的厨房准备新鲜家常餐食', 60),
('gardening', 'Lawn Mowing & Edging', '草坪修剪', 'Professional lawn care including mowing and edging', '专业的草坪护理，包括修剪和修边', 60),
('gardening', 'Complete Garden Tidy', '花园整理', 'Weeding, pruning, leaf removal, and general maintenance', '除草、修剪、清理树叶和一般花园维护', 120),
('personal', 'Shopping Assistant', '购物助手', 'Grocery shopping, errands, and delivery', '杂货购物、跑腿和送货', 60),
('personal', 'Companionship Visit', '陪伴探访', 'Social visit, conversation, and wellness check', '社交拜访、交谈和健康检查', 120),
('personal', 'Transport to Appointments', '交通服务', 'Safe transport to appointments and outings', '安全接送至医疗预约和社交活动', 60),
('maintenance', 'Handyman Services', '杂工服务', 'Small home repairs: leaks, hanging pictures, assembly', '小型家居维修：修复漏水、挂画、组装家具', 60),
('maintenance', 'Gutter Cleaning', '排水沟清洁', 'Gutter cleaning and downspout check', '排水沟清洁和落水管检查', 90)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. SERVICE PRICES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  base_price DECIMAL(10,2) NOT NULL,
  price_with_tax DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, country_code)
);

-- =====================================================
-- 4. USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT DEFAULT 'customer',
  country_code TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  birth_date DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,
  preferred_language TEXT DEFAULT 'EN',
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 5. SERVICE PROVIDERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  country_code TEXT,
  city TEXT,
  address TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  specialties TEXT[],
  bio TEXT,
  years_experience INTEGER,
  certifications TEXT[],
  profile_image TEXT,
  rating DECIMAL(3,1) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  is_christian BOOLEAN DEFAULT false,
  faith_background TEXT,
  verification_date TIMESTAMP,
  stripe_connect_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 6. PROVIDER AVAILABILITY
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  slot_name TEXT,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_duration_minutes INTEGER DEFAULT 15,
  max_concurrent_bookings INTEGER DEFAULT 1,
  is_available BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT true,
  specific_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (start_time < end_time)
);

-- =====================================================
-- 7. BOOKINGS TABLE - MAKE SURE customer_id EXISTS
-- =====================================================
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_number TEXT UNIQUE NOT NULL,
  provider_id UUID REFERENCES service_providers(id),
  customer_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  country_code TEXT,
  booking_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  special_instructions TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  time_multiplier DECIMAL(3,2) DEFAULT 1.0,
  day_multiplier DECIMAL(3,2) DEFAULT 1.0,
  travel_fee DECIMAL(10,2) DEFAULT 0,
  total_price DECIMAL(10,2) NOT NULL,
  platform_fee_percentage DECIMAL(5,2) DEFAULT 15.0,
  platform_fee_amount DECIMAL(10,2),
  provider_payout_amount DECIMAL(10,2),
  status TEXT DEFAULT 'PENDING',
  payment_status TEXT DEFAULT 'UNPAID',
  payment_intent_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verify customer_id exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bookings' AND column_name = 'customer_id') THEN
    ALTER TABLE bookings ADD COLUMN customer_id UUID REFERENCES users(id);
  END IF;
END $$;

-- =====================================================
-- 8. CUSTOMER FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES service_providers(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  would_rebook BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 9. PROVIDER FEEDBACK TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id),
  customer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  customer_preparation_rating INTEGER CHECK (customer_preparation_rating >= 1 AND customer_preparation_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  would_service_again BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 10. PROVIDER PRICING TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  custom_price DECIMAL(10,2),
  custom_weekday_multiplier DECIMAL(3,2),
  custom_weekend_multiplier DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, service_id, country_code)
);

-- =====================================================
-- 11. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 12. PAYMENT TRANSACTIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending',
  customer_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 13. PROVIDER PAYOUTS
-- =====================================================
CREATE TABLE IF NOT EXISTS provider_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  platform_fee DECIMAL(10,2) NOT NULL,
  stripe_payout_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending',
  currency TEXT DEFAULT 'AUD',
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 14. DISPUTES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  initiated_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'open',
  resolution TEXT,
  resolved_by UUID REFERENCES users(id),
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 15. KNOWLEDGE BASE
-- =====================================================
CREATE TABLE IF NOT EXISTS knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT,
  question TEXT NOT NULL,
  question_zh TEXT,
  answer TEXT NOT NULL,
  answer_zh TEXT,
  keywords TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 16. PUBLIC HOLIDAYS
-- =====================================================
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_zh TEXT,
  is_nationwide BOOLEAN DEFAULT true,
  states_affected TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- 17. TIME OF DAY PRICING
-- =====================================================
CREATE TABLE IF NOT EXISTS time_of_day_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT REFERENCES countries(code),
  time_range_name TEXT,
  time_range_name_zh TEXT,
  start_time TIME,
  end_time TIME,
  multiplier DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  CHECK (start_time < end_time)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_provider_availability_provider_day ON provider_availability(provider_id, day_of_week);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_date ON bookings(provider_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_date ON bookings(customer_id, booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at);
CREATE INDEX IF NOT EXISTS idx_service_providers_postal ON service_providers(postal_code);
CREATE INDEX IF NOT EXISTS idx_service_providers_rating ON service_providers(rating DESC);

-- =====================================================
-- RLS POLICIES (After all columns exist)
-- =====================================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;

CREATE POLICY "users_insert_policy" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "users_select_policy" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_policy" ON users
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- SERVICE PROVIDERS POLICIES
DROP POLICY IF EXISTS "providers_insert_policy" ON service_providers;
DROP POLICY IF EXISTS "providers_select_policy" ON service_providers;
DROP POLICY IF EXISTS "providers_update_policy" ON service_providers;

CREATE POLICY "providers_insert_policy" ON service_providers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "providers_select_policy" ON service_providers
  FOR SELECT USING (auth.uid() = user_id OR is_verified = true);

CREATE POLICY "providers_update_policy" ON service_providers
  FOR UPDATE USING (auth.uid() = user_id);

-- PROVIDER AVAILABILITY POLICIES
DROP POLICY IF EXISTS "availability_select_policy" ON provider_availability;
DROP POLICY IF EXISTS "availability_manage_policy" ON provider_availability;

CREATE POLICY "availability_select_policy" ON provider_availability
  FOR SELECT USING (is_available = true);

CREATE POLICY "availability_manage_policy" ON provider_availability
  FOR ALL USING (auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id));

-- BOOKINGS POLICIES
DROP POLICY IF EXISTS "bookings_select_policy" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_policy" ON bookings;

CREATE POLICY "bookings_select_policy" ON bookings
  FOR SELECT USING (auth.uid() = customer_id OR auth.uid() IN (SELECT user_id FROM service_providers WHERE id = provider_id));

CREATE POLICY "bookings_insert_policy" ON bookings
  FOR INSERT WITH CHECK (auth.uid() = customer_id);

-- NOTIFICATIONS POLICIES
DROP POLICY IF EXISTS "notifications_select_policy" ON notifications;
DROP POLICY IF EXISTS "notifications_update_policy" ON notifications;

CREATE POLICY "notifications_select_policy" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_policy" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

CREATE OR REPLACE FUNCTION create_user_profile(
  p_user_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO users (id, email, full_name, phone, user_type, created_at)
  VALUES (p_user_id, p_email, p_full_name, p_phone, 'customer', NOW())
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone;
END;
$$;

GRANT EXECUTE ON FUNCTION create_user_profile TO authenticated, anon, service_role;

-- =====================================================
-- VERIFY
-- =====================================================
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname IN ('users', 'service_providers', 'bookings', 'provider_availability', 'notifications');

-- Show bookings columns to verify customer_id exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'bookings' 
ORDER BY ordinal_position;