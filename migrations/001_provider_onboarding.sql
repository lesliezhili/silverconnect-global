-- =====================================================
-- MODULE 1: Provider Onboarding & Availability
-- =====================================================

-- Provider availability already exists in schema
-- provider_availability table with day_of_week, start_time, end_time, is_available

-- Add provider verification fields
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'pending';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS verification_documents TEXT[];
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS background_check_status TEXT DEFAULT 'pending';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP;
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Provider documents table
CREATE TABLE IF NOT EXISTS provider_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- 'id', 'certification', 'insurance', 'background_check'
  file_url TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  uploaded_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP,
  reviewed_by UUID REFERENCES users(id)
);

-- Provider working zones (areas they serve)
CREATE TABLE IF NOT EXISTS provider_zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  city TEXT,
  postal_code_start TEXT,
  postal_code_end TEXT,
  max_travel_radius_km INTEGER DEFAULT 20,
  created_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies for provider tables
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_zones ENABLE ROW LEVEL SECURITY;

-- Providers can read their own profile
CREATE POLICY "Providers can view own profile" ON service_providers
  FOR SELECT USING (user_id = auth.uid());

-- Providers can update their own profile
CREATE POLICY "Providers can update own profile" ON service_providers
  FOR UPDATE USING (user_id = auth.uid());

-- Providers can manage their availability
CREATE POLICY "Providers can manage own availability" ON provider_availability
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Public can view verified providers
CREATE POLICY "Public can view verified providers" ON service_providers
  FOR SELECT USING (verification_status = 'approved');

-- Providers can manage their documents
CREATE POLICY "Providers can manage own documents" ON provider_documents
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Providers can manage their zones
CREATE POLICY "Providers can manage own zones" ON provider_zones
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );