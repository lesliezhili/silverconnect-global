-- =====================================================
-- MODULE 2: Customer Onboarding & Profile
-- =====================================================

-- Customer profile fields already exist in users table
-- Add additional customer-specific fields

ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_since TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_bookings INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS loyalty_tier TEXT DEFAULT 'bronze'; -- bronze, silver, gold, platinum
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS accessibility_needs TEXT[];
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'email'; -- email, sms, phone

-- Customer addresses (multiple saved addresses)
CREATE TABLE IF NOT EXISTS customer_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  label TEXT DEFAULT 'Home', -- Home, Work, Other
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country_code TEXT REFERENCES countries(code),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer payment methods
CREATE TABLE IF NOT EXISTS customer_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_payment_method_id TEXT NOT NULL,
  card_brand TEXT,
  card_last4 TEXT,
  card_exp_month INTEGER,
  card_exp_year INTEGER,
  is_default BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer favorites (saved providers)
CREATE TABLE IF NOT EXISTS customer_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, provider_id)
);

-- RLS Policies
ALTER TABLE customer_addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorites ENABLE ROW LEVEL SECURITY;

-- Customers can manage their addresses
CREATE POLICY "Customers can manage own addresses" ON customer_addresses
  FOR ALL USING (user_id = auth.uid());

-- Customers can manage their payment methods
CREATE POLICY "Customers can manage own payment methods" ON customer_payment_methods
  FOR ALL USING (user_id = auth.uid());

-- Customers can manage their favorites
CREATE POLICY "Customers can manage own favorites" ON customer_favorites
  FOR ALL USING (user_id = auth.uid());

-- Function to generate referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  NEW.referral_code := UPPER(SUBSTRING(MD5(NEW.id::TEXT) FROM 1 FOR 8));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate referral code on user creation
CREATE OR REPLACE TRIGGER set_referral_code
  AFTER INSERT ON users
  FOR EACH ROW
  WHEN (NEW.referral_code IS NULL)
  EXECUTE FUNCTION generate_referral_code();