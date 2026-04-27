-- =====================================================
-- MODULE 3: Booking Engine & Scheduling
-- =====================================================

-- Booking status history (audit trail)
CREATE TABLE IF NOT EXISTS booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking modifications
CREATE TABLE IF NOT EXISTS booking_modifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  modification_type TEXT NOT NULL, -- reschedule, cancel, extend, reduce
  old_value TEXT,
  new_value TEXT,
  requested_by UUID REFERENCES users(id),
  approved_by UUID REFERENCES users(id),
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP DEFAULT NOW()
);

-- Recurring bookings
CREATE TABLE IF NOT EXISTS recurring_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES service_providers(id),
  service_id UUID REFERENCES services(id),
  frequency TEXT NOT NULL, -- weekly, biweekly, monthly
  day_of_week INTEGER,
  time_of_day TIME,
  address TEXT,
  special_instructions TEXT,
  start_date DATE NOT NULL,
  end_date DATE,
  occurrences INTEGER, -- null = unlimited
  next_booking_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking reminders
CREATE TABLE IF NOT EXISTS booking_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  reminder_type TEXT NOT NULL, -- day_before, hour_before, custom
  reminder_datetime TIMESTAMP NOT NULL,
  sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider block times (vacation, sick days, etc.)
CREATE TABLE IF NOT EXISTS provider_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  start_datetime TIMESTAMP NOT NULL,
  end_datetime TIMESTAMP NOT NULL,
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_modifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_blocked_times ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (
    user_id = auth.uid() OR 
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Users can create bookings
CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own bookings
CREATE POLICY "Users can update own bookings" ON bookings
  FOR UPDATE USING (
    user_id = auth.uid() OR 
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Providers can manage their booking status
CREATE POLICY "Providers can manage booking status" ON booking_status_history
  FOR ALL USING (
    booking_id IN (
      SELECT id FROM bookings WHERE 
      provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
    )
  );

-- Users can manage their recurring bookings
CREATE POLICY "Users can manage own recurring bookings" ON recurring_bookings
  FOR ALL USING (user_id = auth.uid());

-- Providers can manage their blocked times
CREATE POLICY "Providers can manage own blocked times" ON provider_blocked_times
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Function to update booking status
CREATE OR REPLACE FUNCTION update_booking_status(
  p_booking_id UUID,
  p_status TEXT,
  p_changed_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE bookings SET status = p_status WHERE id = p_booking_id;
  
  INSERT INTO booking_status_history (booking_id, status, changed_by, reason)
  VALUES (p_booking_id, p_status, p_changed_by, p_reason);
END;
$$ LANGUAGE plpgsql;