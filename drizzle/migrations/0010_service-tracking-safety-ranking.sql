-- Migration 0010: Service Tracking, Safety, Provider Ranking, Government Agencies
-- SilverConnect Global — Non-Profit Elder Care Platform

-- ═══ 1. SERVICE PHOTO EVIDENCE (Before/After) ═══════════════
CREATE TABLE IF NOT EXISTS service_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  photo_type VARCHAR(10) NOT NULL CHECK (photo_type IN ('before', 'after')),
  photo_url TEXT NOT NULL,
  caption TEXT,
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  taken_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verified_by_customer BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ
);
CREATE INDEX idx_service_photos_booking ON service_photos(booking_id);

-- ═══ 2. SAFETY CHECK-IN/CHECK-OUT ════════════════════════════
CREATE TABLE IF NOT EXISTS safety_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  checkin_type VARCHAR(10) NOT NULL CHECK (checkin_type IN ('arrival', 'departure')),
  gps_lat DECIMAL(10,7),
  gps_lng DECIMAL(10,7),
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  customer_confirmed BOOLEAN DEFAULT FALSE,
  duress_flag BOOLEAN DEFAULT FALSE,
  notes TEXT
);
CREATE INDEX idx_safety_checkins_booking ON safety_checkins(booking_id);

-- ═══ 3. PROVIDER SECURITY VERIFICATION ═══════════════════════
CREATE TABLE IF NOT EXISTS provider_security_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  check_type VARCHAR(30) NOT NULL CHECK (check_type IN (
    'police_check', 'wwc', 'ndis_worker_screening',
    'first_aid', 'identity_100pt', 'right_to_work',
    'professional_registration', 'insurance'
  )),
  document_url TEXT,
  issuing_authority TEXT,
  certificate_number TEXT,
  issued_date DATE,
  expiry_date DATE,
  status VARCHAR(15) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','verified','expired','rejected')),
  verified_by TEXT,
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_security_checks_provider ON provider_security_checks(provider_id);
CREATE INDEX idx_security_checks_expiry ON provider_security_checks(expiry_date) WHERE status = 'verified';

-- ═══ 4. PROVIDER FEEDBACK & RANKING ══════════════════════════
CREATE TABLE IF NOT EXISTS service_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  provider_id UUID NOT NULL,
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  quality_rating INTEGER CHECK (quality_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
  comment TEXT,
  photo_evidence_score INTEGER DEFAULT 0 CHECK (photo_evidence_score BETWEEN 0 AND 5),
  would_recommend BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(booking_id, customer_id)
);

CREATE TABLE IF NOT EXISTS provider_rankings (
  provider_id UUID PRIMARY KEY,
  postcode VARCHAR(10) NOT NULL,
  composite_score DECIMAL(4,2) NOT NULL DEFAULT 0,
  total_reviews INTEGER NOT NULL DEFAULT 0,
  avg_rating DECIMAL(3,2) NOT NULL DEFAULT 0,
  punctuality_avg DECIMAL(3,2) DEFAULT 0,
  quality_avg DECIMAL(3,2) DEFAULT 0,
  communication_avg DECIMAL(3,2) DEFAULT 0,
  safety_avg DECIMAL(3,2) DEFAULT 0,
  photo_compliance_pct DECIMAL(5,2) DEFAULT 0,
  cancellation_rate DECIMAL(5,2) DEFAULT 0,
  emergency_response_rate DECIMAL(5,2) DEFAULT 0,
  rank_in_postcode INTEGER,
  tier VARCHAR(10) DEFAULT 'standard' CHECK (tier IN ('bronze','silver','gold','platinum')),
  last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_provider_rankings_postcode ON provider_rankings(postcode, composite_score DESC);

-- ═══ 5. SMART PRICING (time-of-day, affordability, govt rates) ═══
CREATE TABLE IF NOT EXISTS pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(5) NOT NULL,
  rule_name TEXT NOT NULL,
  day_type VARCHAR(20) NOT NULL CHECK (day_type IN ('weekday','saturday','sunday','public_holiday')),
  time_bracket VARCHAR(20) NOT NULL CHECK (time_bracket IN ('standard','early_morning','evening','overnight')),
  multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.00,
  provider_floor_rate DECIMAL(8,2),
  platform_fee_pct DECIMAL(5,2) NOT NULL DEFAULT 15.00,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affordability_caps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  funding_source VARCHAR(30) NOT NULL CHECK (funding_source IN (
    'self_funded','ndis','tac','worksafe','dva','home_care_package','chsp','other_govt'
  )),
  plan_number TEXT,
  max_hourly_rate DECIMAL(8,2),
  weekly_budget DECIMAL(10,2),
  monthly_budget DECIMAL(10,2),
  remaining_budget DECIMAL(10,2),
  plan_start_date DATE,
  plan_end_date DATE,
  verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_affordability_customer ON affordability_caps(customer_id);

-- ═══ 6. GOVERNMENT AGENCY INTEGRATION ════════════════════════
CREATE TABLE IF NOT EXISTS govt_agency_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agency VARCHAR(30) NOT NULL CHECK (agency IN ('ndis','tac','worksafe','dva','chsp','home_care_package')),
  service_tier VARCHAR(20) NOT NULL,
  service_type VARCHAR(50) NOT NULL,
  day_type VARCHAR(20) NOT NULL,
  time_bracket VARCHAR(20) NOT NULL,
  max_rate DECIMAL(8,2) NOT NULL,
  provider_min_rate DECIMAL(8,2) NOT NULL,
  effective_from DATE NOT NULL,
  effective_to DATE,
  notes TEXT
);
CREATE INDEX idx_govt_rates_lookup ON govt_agency_rates(agency, service_tier, day_type, time_bracket);

-- ═══ 7. CANCELLATION POLICY ══════════════════════════════════
CREATE TABLE IF NOT EXISTS cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country VARCHAR(5) NOT NULL,
  notice_hours INTEGER NOT NULL,
  refund_pct DECIMAL(5,2) NOT NULL,
  provider_compensation_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  description TEXT,
  applies_to VARCHAR(20) DEFAULT 'all' CHECK (applies_to IN ('all','govt_funded','self_funded'))
);

-- Seed AU cancellation policy (NDIS-aligned)
INSERT INTO cancellation_policies (country, notice_hours, refund_pct, provider_compensation_pct, description, applies_to) VALUES
  ('AU', 168, 100.00, 0, '7+ days notice: full refund, no provider fee', 'all'),
  ('AU', 48, 100.00, 0, '48h-7d notice: full refund, no provider fee', 'all'),
  ('AU', 24, 50.00, 50.00, '24-48h notice: 50% refund, provider gets 50% of booking value', 'all'),
  ('AU', 0, 0.00, 90.00, 'Under 24h / no-show: no refund, provider gets 90%', 'all'),
  ('CN', 48, 100.00, 0, '48h+ notice: full refund', 'all'),
  ('CN', 24, 50.00, 50.00, '24-48h notice: 50% refund', 'all'),
  ('CN', 0, 0.00, 80.00, 'Under 24h: no refund', 'all'),
  ('CA', 48, 100.00, 0, '48h+ notice: full refund', 'all'),
  ('CA', 24, 50.00, 50.00, '24-48h notice: 50% refund', 'all'),
  ('CA', 0, 0.00, 90.00, 'Under 24h: no refund', 'all');

-- Seed AU pricing rules (NDIS Price Guide 2025-26 aligned)
INSERT INTO pricing_rules (country, rule_name, day_type, time_bracket, multiplier, provider_floor_rate, platform_fee_pct) VALUES
  ('AU', 'Weekday Standard', 'weekday', 'standard', 1.00, 38.00, 15.00),
  ('AU', 'Weekday Evening (after 8pm)', 'weekday', 'evening', 1.15, 43.70, 15.00),
  ('AU', 'Saturday', 'saturday', 'standard', 1.50, 57.00, 12.00),
  ('AU', 'Sunday', 'sunday', 'standard', 2.00, 76.00, 12.00),
  ('AU', 'Public Holiday', 'public_holiday', 'standard', 2.50, 95.00, 10.00),
  ('AU', 'Weekday Early (before 7am)', 'weekday', 'early_morning', 1.20, 45.60, 15.00),
  ('AU', 'Overnight', 'weekday', 'overnight', 1.25, 47.50, 12.00);

-- Seed government agency rate caps (NDIS 2025-26 aligned)
INSERT INTO govt_agency_rates (agency, service_tier, service_type, day_type, time_bracket, max_rate, provider_min_rate, effective_from) VALUES
  ('ndis', 'basic', 'personal_care', 'weekday', 'standard', 67.56, 38.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'saturday', 'standard', 94.62, 57.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'sunday', 'standard', 121.67, 76.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'public_holiday', 'standard', 148.73, 95.00, '2025-07-01'),
  ('ndis', 'basic', 'personal_care', 'weekday', 'evening', 74.48, 43.70, '2025-07-01'),
  ('ndis', 'certified', 'community_nursing', 'weekday', 'standard', 100.14, 55.00, '2025-07-01'),
  ('ndis', 'clinical', 'clinical_care', 'weekday', 'standard', 134.52, 75.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'weekday', 'standard', 72.00, 40.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'saturday', 'standard', 100.80, 60.00, '2025-07-01'),
  ('tac', 'basic', 'attendant_care', 'sunday', 'standard', 129.60, 76.00, '2025-07-01'),
  ('worksafe', 'basic', 'personal_care', 'weekday', 'standard', 69.50, 39.00, '2025-07-01'),
  ('worksafe', 'basic', 'personal_care', 'saturday', 'standard', 97.30, 58.00, '2025-07-01'),
  ('worksafe', 'certified', 'nursing', 'weekday', 'standard', 105.00, 60.00, '2025-07-01');
