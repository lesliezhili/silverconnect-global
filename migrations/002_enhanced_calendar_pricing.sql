-- ============================================================
-- SilverConnect Global - Enhanced Calendar & Pricing Migration
-- ============================================================
-- This migration adds support for:
-- - Full 24-hour availability ranges per day
-- - Multiple availability windows per day
-- - Weekday, weekend, and public holiday pricing
-- - Time-of-day pricing multipliers
-- - Service-specific and provider-specific price overrides
-- - Automatic AU public holiday detection
-- ============================================================

-- ============================================================
-- PUBLIC HOLIDAYS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  holiday_date DATE NOT NULL,
  holiday_name TEXT NOT NULL,
  is_national BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_code, holiday_date)
);

-- Index for fast holiday lookups
CREATE INDEX IF NOT EXISTS idx_public_holidays_date ON public_holidays(country_code, holiday_date);

-- ============================================================
-- ENHANCED PROVIDER AVAILABILITY
-- Supports multiple windows per day and full 24-hour ranges
-- ============================================================
DROP TABLE IF EXISTS provider_availability CASCADE;
CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  is_recurring BOOLEAN DEFAULT true, -- If true, repeats every week
  specific_date DATE, -- If set, this is a one-time availability for a specific date
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Multiple availability windows per provider per day
CREATE UNIQUE INDEX IF NOT EXISTS idx_provider_availability_unique 
  ON provider_availability(provider_id, day_of_week, start_time, end_time) 
  WHERE is_recurring = true;

-- ============================================================
-- BLOCKED TIMES (when provider is NOT available)
-- ============================================================
CREATE TABLE IF NOT EXISTS provider_blocked_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME, -- If null, blocks entire day
  reason TEXT, -- 'vacation', 'sick', 'personal', 'public_holiday'
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_blocked_dates 
  ON provider_blocked_times(provider_id, blocked_date);

-- ============================================================
-- PRICING TIERS
-- Base pricing with time-of-day and day-of-week multipliers
-- ============================================================
CREATE TABLE IF NOT EXISTS pricing_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL,
  tier_name TEXT NOT NULL, -- 'weekday', 'weekend', 'public_holiday'
  day_type TEXT NOT NULL, -- 'weekday', 'saturday', 'sunday', 'public_holiday'
  time_slot_start TIME NOT NULL,
  time_slot_end TIME NOT NULL,
  price_multiplier DECIMAL(4,2) DEFAULT 1.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(country_code, tier_name, time_slot_start, time_slot_end)
);

-- Default AU pricing tiers
INSERT INTO pricing_tiers (country_code, tier_name, day_type, time_slot_start, time_slot_end, price_multiplier) VALUES
-- Weekday pricing
('AU', 'weekday_morning', 'weekday', '06:00:00', '12:00:00', 1.00),
('AU', 'weekday_afternoon', 'weekday', '12:00:00', '17:00:00', 1.00),
('AU', 'weekday_evening', 'weekday', '17:00:00', '21:00:00', 1.15),
('AU', 'weekday_night', 'weekday', '21:00:00', '23:59:59', 1.25),
('AU', 'weekday_early', 'weekday', '00:00:00', '06:00:00', 1.10),
-- Saturday pricing
('AU', 'saturday_morning', 'saturday', '06:00:00', '12:00:00', 1.10),
('AU', 'saturday_afternoon', 'saturday', '12:00:00', '17:00:00', 1.15),
('AU', 'saturday_evening', 'saturday', '17:00:00', '21:00:00', 1.25),
('AU', 'saturday_night', 'saturday', '21:00:00', '23:59:59', 1.35),
('AU', 'saturday_early', 'saturday', '00:00:00', '06:00:00', 1.20),
-- Sunday pricing
('AU', 'sunday_morning', 'sunday', '06:00:00', '12:00:00', 1.20),
('AU', 'sunday_afternoon', 'sunday', '12:00:00', '17:00:00', 1.25),
('AU', 'sunday_evening', 'sunday', '17:00:00', '21:00:00', 1.35),
('AU', 'sunday_night', 'sunday', '21:00:00', '23:59:59', 1.50),
('AU', 'sunday_early', 'sunday', '00:00:00', '06:00:00', 1.30);

-- ============================================================
-- SERVICE-SPECIFIC PRICE OVERRIDES
-- Override base prices for specific services
-- ============================================================
DROP TABLE IF EXISTS service_price_overrides;
CREATE TABLE service_price_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT NOT NULL,
  day_type TEXT, -- 'weekday', 'saturday', 'sunday', 'public_holiday', or NULL for all
  time_slot_start TIME,
  time_slot_end TIME,
  override_price DECIMAL(10,2),
  price_multiplier DECIMAL(4,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, country_code, day_type, time_slot_start, time_slot_end)
);

-- ============================================================
-- PROVIDER-SPECIFIC PRICE OVERRIDES
-- Providers can set their own prices
-- ============================================================
DROP TABLE IF EXISTS provider_pricing;
CREATE TABLE provider_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE NOT NULL,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE NOT NULL,
  country_code TEXT NOT NULL,
  day_type TEXT, -- 'weekday', 'saturday', 'sunday', 'public_holiday', or NULL for all
  time_slot_start TIME,
  time_slot_end TIME,
  custom_price DECIMAL(10,2),
  price_multiplier DECIMAL(4,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, service_id, country_code, day_type, time_slot_start, time_slot_end)
);

-- ============================================================
-- BOOKING PRICING HISTORY
-- Track calculated prices for audit
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  base_price DECIMAL(10,2) NOT NULL,
  day_type_multiplier DECIMAL(4,2) DEFAULT 1.00,
  time_slot_multiplier DECIMAL(4,2) DEFAULT 1.00,
  service_override DECIMAL(10,2),
  provider_override DECIMAL(10,2),
  final_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  calculated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================
-- RLS POLICIES FOR NEW TABLES
-- ============================================================
ALTER TABLE public_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_blocked_times ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_price_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_pricing ENABLE ROW LEVEL SECURITY;

-- Public holidays - anyone can read
CREATE POLICY "Anyone can view public holidays" ON public_holidays FOR SELECT USING (true);

-- Provider availability - providers manage their own
CREATE POLICY "Anyone can view provider availability" ON provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can manage own availability" ON provider_availability FOR ALL USING (
  EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = provider_availability.provider_id AND auth.uid() = service_providers.user_id)
);

-- Blocked times - providers manage their own
CREATE POLICY "Providers can manage own blocked times" ON provider_blocked_times FOR ALL USING (
  EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = provider_blocked_times.provider_id AND auth.uid() = service_providers.user_id)
);

-- Pricing tiers - anyone can read
CREATE POLICY "Anyone can view pricing tiers" ON pricing_tiers FOR SELECT USING (true);

-- Service price overrides - anyone can read
CREATE POLICY "Anyone can view service price overrides" ON service_price_overrides FOR SELECT USING (true);

-- Provider pricing - providers manage their own
CREATE POLICY "Anyone can view provider pricing" ON provider_pricing FOR SELECT USING (true);
CREATE POLICY "Providers can manage own pricing" ON provider_pricing FOR ALL USING (
  EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = provider_pricing.provider_id AND auth.uid() = service_providers.user_id)
);

-- Booking pricing - booking parties can view
CREATE POLICY "Booking parties can view pricing" ON booking_pricing FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_pricing.booking_id AND auth.uid() = bookings.user_id)
);

-- ============================================================
-- AU PUBLIC HOLIDAYS (2026-2028)
-- ============================================================
INSERT INTO public_holidays (country_code, holiday_date, holiday_name) VALUES
-- 2026
('AU', '2026-01-01', 'New Year''s Day'),
('AU', '2026-01-26', 'Australia Day'),
('AU', '2026-03-09', 'Labour Day (WA)'),
('AU', '2026-03-09', 'Adelaide Cup (SA)'),
('AU', '2026-03-09', 'Canberra Day (ACT)'),
('AU', '2026-04-03', 'Good Friday'),
('AU', '2026-04-04', 'Saturday'),
('AU', '2026-04-05', 'Easter Sunday'),
('AU', '2026-04-06', 'Easter Monday'),
('AU', '2026-04-25', 'Anzac Day'),
('AU', '2026-05-04', 'May Day (NT)'),
('AU', '2026-05-11', 'Reconciliation Day (ACT)'),
('AU', '2026-06-01', 'Queen''s Birthday (WA)'),
('AU', '2026-06-08', 'King''s Birthday (VIC, TAS, SA, ACT, NSW, QLD)'),
('AU', '2026-06-08', 'Picnic Day (NT)'),
('AU', '2026-08-03', 'Bank Holiday (NSW)'),
('AU', '2026-09-07', 'Father''s Day'),
('AU', '2026-09-28', 'King''s Birthday (WA)'),
('AU', '2026-10-05', 'Labour Day (VIC, TAS)'),
('AU', '2026-10-05', 'Queen's Birthday (QLD)'),
('AU', '2026-10-05', 'Friday before the October long weekend (SA)'),
('AU', '2026-10-26', 'Daylight Saving starts (VIC, TAS, NSW, ACT, SA)'),
('AU', '2026-12-25', 'Christmas Day'),
('AU', '2026-12-26', 'Boxing Day'),
('AU', '2026-12-28', 'Public holiday (NSW, VIC, SA)'),
-- 2027
('AU', '2027-01-01', 'New Year''s Day'),
('AU', '2027-01-26', 'Australia Day'),
('AU', '2027-03-01', 'Labour Day (WA)'),
('AU', '2027-03-01', 'Adelaide Cup (SA)'),
('AU', '2027-03-01', 'Canberra Day (ACT)'),
('AU', '2027-03-26', 'Good Friday'),
('AU', '2027-03-27', 'Saturday'),
('AU', '2027-03-28', 'Easter Sunday'),
('AU', '2027-03-29', 'Easter Monday'),
('AU', '2027-04-25', 'Anzac Day'),
('AU', '2027-05-03', 'May Day (NT)'),
('AU', '2027-05-10', 'Reconciliation Day (ACT)'),
('AU', '2027-06-01', 'Queen''s Birthday (WA)'),
('AU', '2027-06-14', 'King''s Birthday (VIC, TAS, SA, ACT, NSW, QLD)'),
('AU', '2026-06-14', 'Picnic Day (NT)'),
('AU', '2027-08-02', 'Bank Holiday (NSW)'),
('AU', '2027-09-05', 'Father''s Day'),
('AU', '2027-09-27', 'King''s Birthday (WA)'),
('AU', '2027-10-04', 'Labour Day (VIC, TAS)'),
('AU', '2027-10-04', 'Queen''s Birthday (QLD)'),
('AU', '2027-10-04', 'Friday before the October long weekend (SA)'),
('AU', '2027-10-03', 'Daylight Saving starts (VIC, TAS, NSW, ACT, SA)'),
('AU', '2027-12-25', 'Christmas Day'),
('AU', '2027-12-26', 'Boxing Day'),
('AU', '2027-12-27', 'Public holiday (NSW, VIC, SA)'),
-- 2028
('AU', '2028-01-01', 'New Year''s Day'),
('AU', '2028-01-26', 'Australia Day'),
('AU', '2028-02-29', 'Leap Day'),
('AU', '2028-03-06', 'Labour Day (WA)'),
('AU', '2028-03-06', 'Adelaide Cup (SA)'),
('AU', '2028-03-06', 'Canberra Day (ACT)'),
('AU', '2028-04-14', 'Good Friday'),
('AU', '2028-04-15', 'Saturday'),
('AU', '2028-04-16', 'Easter Sunday'),
('AU', '2028-04-17', 'Easter Monday'),
('AU', '2028-04-25', 'Anzac Day'),
('AU', '2028-05-01', 'May Day (NT)'),
('AU', '2028-05-08', 'Reconciliation Day (ACT)'),
('AU', '2028-06-01', 'King''s Birthday (WA)'),
('AU', '2028-06-12', 'King''s Birthday (VIC, TAS, SA, ACT, NSW, QLD)'),
('AU', '2028-06-12', 'Picnic Day (NT)'),
('AU', '2028-08-07', 'Bank Holiday (NSW)'),
('AU', '2028-09-03', 'Father''s Day'),
('AU', '2028-09-25', 'King''s Birthday (WA)'),
('AU', '2028-10-02', 'Labour Day (VIC, TAS)'),
('AU', '2028-10-02', 'Queen''s Birthday (QLD)'),
('AU', '2028-10-02', 'Friday before the October long weekend (SA)'),
('AU', '2028-10-01', 'Daylight Saving starts (VIC, TAS, NSW, ACT, SA)'),
('AU', '2028-12-25', 'Christmas Day'),
('AU', '2028-12-26', 'Boxing Day');

-- ============================================================
-- DATABASE FUNCTIONS
-- ============================================================

-- Function to get day type for a given date
CREATE OR REPLACE FUNCTION get_day_type(p_date DATE, p_country_code TEXT DEFAULT 'AU')
RETURNS TEXT AS $$
DECLARE
  v_dow INTEGER;
  v_is_holiday BOOLEAN;
BEGIN
  v_dow := EXTRACT(DOW FROM p_date)::INTEGER;
  
  -- Check if it's a public holiday
  SELECT EXISTS (
    SELECT 1 FROM public_holidays 
    WHERE country_code = p_country_code 
    AND holiday_date = p_date
  ) INTO v_is_holiday;
  
  IF v_is_holiday THEN
    RETURN 'public_holiday';
  ELSIF v_dow = 0 THEN
    RETURN 'sunday';
  ELSIF v_dow = 6 THEN
    RETURN 'saturday';
  ELSE
    RETURN 'weekday';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to calculate price with all multipliers
CREATE OR REPLACE FUNCTION calculate_booking_price(
  p_service_id UUID,
  p_provider_id UUID,
  p_country_code TEXT,
  p_booking_date DATE,
  p_booking_time TIME
)
RETURNS TABLE (
  base_price DECIMAL(10,2),
  day_type_multiplier DECIMAL(4,2),
  time_slot_multiplier DECIMAL(4,2),
  service_override DECIMAL(10,2),
  provider_override DECIMAL(10,2),
  final_price DECIMAL(10,2)
) AS $$
DECLARE
  v_day_type TEXT;
  v_base_price DECIMAL(10,2);
  v_day_multiplier DECIMAL(4,2) := 1.00;
  v_time_multiplier DECIMAL(4,2) := 1.00;
  v_service_override DECIMAL(10,2);
  v_provider_override DECIMAL(10,2);
  v_final_price DECIMAL(10,2);
BEGIN
  -- Get day type
  v_day_type := get_day_type(p_booking_date, p_country_code);
  
  -- Get base service price
  SELECT sp.base_price INTO v_base_price
  FROM service_prices sp
  WHERE sp.service_id = p_service_id AND sp.country_code = p_country_code;
  
  -- Get day type multiplier
  SELECT pt.price_multiplier INTO v_day_multiplier
  FROM pricing_tiers pt
  WHERE pt.country_code = p_country_code
    AND pt.day_type = v_day_type
    AND p_booking_time >= pt.time_slot_start
    AND p_booking_time <= pt.time_slot_end
  LIMIT 1;
  
  -- Get service-specific override
  SELECT spo.override_price INTO v_service_override
  FROM service_price_overrides spo
  WHERE spo.service_id = p_service_id
    AND spo.country_code = p_country_code
    AND (spo.day_type IS NULL OR spo.day_type = v_day_type)
    AND (spo.time_slot_start IS NULL OR p_booking_time >= spo.time_slot_start)
    AND (spo.time_slot_end IS NULL OR p_booking_time <= spo.time_slot_end)
    AND spo.is_active = true
  LIMIT 1;
  
  -- Get provider-specific override
  SELECT pp.custom_price INTO v_provider_override
  FROM provider_pricing pp
  WHERE pp.provider_id = p_provider_id
    AND pp.service_id = p_service_id
    AND pp.country_code = p_country_code
    AND (pp.day_type IS NULL OR pp.day_type = v_day_type)
    AND (pp.time_slot_start IS NULL OR p_booking_time >= pp.time_slot_start)
    AND (pp.time_slot_end IS NULL OR p_booking_time <= pp.time_slot_end)
    AND pp.is_active = true
  LIMIT 1;
  
  -- Calculate final price
  IF v_provider_override IS NOT NULL THEN
    v_final_price := v_provider_override;
  ELSIF v_service_override IS NOT NULL THEN
    v_final_price := v_service_override * v_day_multiplier;
  ELSE
    v_final_price := v_base_price * v_day_multiplier * COALESCE(v_time_multiplier, 1.00);
  END IF;
  
  RETURN QUERY SELECT 
    v_base_price,
    COALESCE(v_day_multiplier, 1.00),
    COALESCE(v_time_multiplier, 1.00),
    v_service_override,
    v_provider_override,
    v_final_price;
END;
$$ LANGUAGE plpgsql;

-- Function to check if provider is available at specific time
CREATE OR REPLACE FUNCTION is_provider_available(
  p_provider_id UUID,
  p_booking_date DATE,
  p_booking_time TIME
)
RETURNS BOOLEAN AS $$
DECLARE
  v_dow INTEGER;
  v_is_blocked BOOLEAN;
  v_has_availability BOOLEAN;
BEGIN
  v_dow := EXTRACT(DOW FROM p_booking_date)::INTEGER;
  
  -- Check if provider has blocked time for this date
  SELECT EXISTS (
    SELECT 1 FROM provider_blocked_times pbt
    WHERE pbt.provider_id = p_provider_id
      AND pbt.blocked_date = p_booking_date
      AND (pbt.start_time IS NULL OR p_booking_time >= pbt.start_time)
      AND (pbt.end_time IS NULL OR p_booking_time <= pbt.end_time)
  ) INTO v_is_blocked;
  
  IF v_is_blocked THEN
    RETURN FALSE;
  END IF;
  
  -- Check recurring availability
  SELECT EXISTS (
    SELECT 1 FROM provider_availability pa
    WHERE pa.provider_id = p_provider_id
      AND pa.day_of_week = v_dow
      AND pa.is_available = true
      AND pa.is_recurring = true
      AND p_booking_time >= pa.start_time
      AND p_booking_time <= pa.end_time
  ) INTO v_has_availability;
  
  IF NOT v_has_availability THEN
    -- Check one-time availability for specific date
    SELECT EXISTS (
      SELECT 1 FROM provider_availability pa
      WHERE pa.provider_id = p_provider_id
        AND pa.specific_date = p_booking_date
        AND pa.is_available = true
        AND p_booking_time >= pa.start_time
        AND p_booking_time <= pa.end_time
    ) INTO v_has_availability;
  END IF;
  
  RETURN v_has_availability;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Trigger to update provider_availability updated_at
CREATE OR REPLACE FUNCTION update_provider_availability_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_provider_availability_updated
  BEFORE UPDATE ON provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_availability_timestamp();

-- Trigger to update provider_pricing updated_at
CREATE OR REPLACE FUNCTION update_provider_pricing_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_provider_pricing_updated
  BEFORE UPDATE ON provider_pricing
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_pricing_timestamp();

-- ============================================================
-- SEED ADDITIONAL COUNTRIES PRICING
-- ============================================================

-- China pricing tiers (simpler - no weekend premium)
INSERT INTO pricing_tiers (country_code, tier_name, day_type, time_slot_start, time_slot_end, price_multiplier) VALUES
('CN', 'standard', 'weekday', '00:00:00', '23:59:59', 1.00),
('CN', 'standard', 'saturday', '00:00:00', '23:59:59', 1.00),
('CN', 'standard', 'sunday', '00:00:00', '23:59:59', 1.00),
('CN', 'standard', 'public_holiday', '00:00:00', '23:59:59', 1.20);

-- Canada pricing tiers
INSERT INTO pricing_tiers (country_code, tier_name, day_type, time_slot_start, time_slot_end, price_multiplier) VALUES
('CA', 'weekday_morning', 'weekday', '06:00:00', '12:00:00', 1.00),
('CA', 'weekday_afternoon', 'weekday', '12:00:00', '17:00:00', 1.00),
('CA', 'weekday_evening', 'weekday', '17:00:00', '21:00:00', 1.15),
('CA', 'weekday_night', 'weekday', '21:00:00', '23:59:59', 1.25),
('CA', 'saturday_all', 'saturday', '00:00:00', '23:59:59', 1.15),
('CA', 'sunday_all', 'sunday', '00:00:00', '23:59:59', 1.25),
('CA', 'public_holiday', 'public_holiday', '00:00:00', '23:59:59', 1.50);

-- Canada public holidays (sample)
INSERT INTO public_holidays (country_code, holiday_date, holiday_name) VALUES
('CA', '2026-01-01', 'New Year''s Day'),
('CA', '2026-02-16', 'Family Day'),
('CA', '2026-04-03', 'Good Friday'),
('CA', '2026-05-18', 'Victoria Day'),
('CA', '2026-07-01', 'Canada Day'),
('CA', '2026-08-03', 'Civic Holiday'),
('CA', '2026-09-07', 'Labour Day'),
('CA', '2026-10-12', 'Thanksgiving'),
('CA', '2026-11-11', 'Remembrance Day'),
('CA', '2026-12-25', 'Christmas Day'),
('CA', '2026-12-26', 'Boxing Day');

-- Add new columns to existing bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS day_type TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS time_slot TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS price_multiplier DECIMAL(4,2);