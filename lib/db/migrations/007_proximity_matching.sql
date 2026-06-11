-- Migration: Add postcode/proximity matching support
-- SilverConnect Global

-- 1. Add postcode, coordinates, and base rate to provider_profiles
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS suburb VARCHAR(100);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS base_hourly_rate DECIMAL(8, 2) DEFAULT 49.00;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS available_today BOOLEAN DEFAULT false;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS service_radius_km INTEGER DEFAULT 15;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS travel_mode VARCHAR(20) DEFAULT 'driving'; -- walking, cycling, driving, public_transit
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS has_own_transport BOOLEAN DEFAULT true;

-- 2. Add postcode to customer addresses
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS postcode VARCHAR(10);
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 7);
ALTER TABLE customer_addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(10, 7);

-- 3. Create provider_tools table (what tools/equipment each provider owns)
CREATE TABLE IF NOT EXISTS provider_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES provider_profiles(id),
  category_slug VARCHAR(50) NOT NULL,
  tool_name VARCHAR(200) NOT NULL,
  owns_tool BOOLEAN DEFAULT true,
  tool_condition VARCHAR(20) DEFAULT 'good', -- new, good, fair
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create booking_pricing_factors table (records exactly how price was calculated)
CREATE TABLE IF NOT EXISTS booking_pricing_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  base_rate DECIMAL(8, 2) NOT NULL,
  distance_km DECIMAL(6, 2),
  distance_tier VARCHAR(20), -- walking, cycling, driving, far, remote
  distance_adjustment DECIMAL(8, 2) DEFAULT 0,
  tool_provision VARCHAR(30) DEFAULT 'provider_brings', -- customer_provides, provider_brings, platform_supplies
  tool_adjustment DECIMAL(8, 2) DEFAULT 0,
  loyalty_discount DECIMAL(8, 2) DEFAULT 0,
  demand_adjustment DECIMAL(8, 2) DEFAULT 0,
  time_adjustment DECIMAL(8, 2) DEFAULT 0,
  weekend_surcharge DECIMAL(8, 2) DEFAULT 0,
  final_hourly_rate DECIMAL(8, 2) NOT NULL,
  platform_fee DECIMAL(8, 2) NOT NULL,
  provider_earnings DECIMAL(8, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Indexes for fast postcode lookups
CREATE INDEX IF NOT EXISTS idx_provider_postcode ON provider_profiles(postcode);
CREATE INDEX IF NOT EXISTS idx_provider_active_verified ON provider_profiles(is_active, is_verified) WHERE is_active = true AND is_verified = true;
CREATE INDEX IF NOT EXISTS idx_provider_available ON provider_profiles(available_today) WHERE available_today = true;
CREATE INDEX IF NOT EXISTS idx_customer_addr_postcode ON customer_addresses(postcode);
CREATE INDEX IF NOT EXISTS idx_booking_pricing ON booking_pricing_factors(booking_id);

-- 6. Add tool_provision to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS tool_provision VARCHAR(30) DEFAULT 'provider_brings';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS distance_km DECIMAL(6, 2);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS distance_tier VARCHAR(20);
