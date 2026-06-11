-- Module 2: Provider Onboarding & Availability Expansion
-- Adds ABN tracking, background check status, emergency opt-in, surge pricing

-- Add missing provider profile fields
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn TEXT;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS abn_verified_at TIMESTAMPTZ;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS background_check_status TEXT NOT NULL DEFAULT 'not_started';
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS background_check_cleared_at TIMESTAMPTZ;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS emergency_opt_in BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS base_hourly_rate DECIMAL(10,2);
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS coverage_postcodes TEXT[];
ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS service_tier TEXT NOT NULL DEFAULT 'level_1';

-- Background check results tracking
CREATE TABLE IF NOT EXISTS provider_background_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
    check_type TEXT NOT NULL, -- 'police_check', 'wwc', 'identity'
    external_reference_id TEXT, -- ID from third-party screening API
    status TEXT NOT NULL DEFAULT 'pending', -- pending, cleared, flagged, expired
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_bg_checks_provider ON provider_background_checks(provider_id);

-- Surge pricing configuration (holiday/weekend rates)
CREATE TABLE IF NOT EXISTS pricing_surcharge_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    country TEXT NOT NULL, -- AU, CN, CA
    rule_type TEXT NOT NULL, -- 'public_holiday', 'weekend', 'peak_hour'
    multiplier DECIMAL(4,2) NOT NULL DEFAULT 1.0, -- e.g. 2.0 for holiday
    description TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default surcharge rules
INSERT INTO pricing_surcharge_rules (country, rule_type, multiplier, description) VALUES
    ('AU', 'public_holiday', 2.0, 'Australian public holiday double rate'),
    ('AU', 'weekend', 1.5, 'Weekend loading 50%'),
    ('AU', 'peak_hour', 1.2, 'Peak hour 6-8am/5-7pm surcharge'),
    ('CN', 'public_holiday', 2.0, 'Chinese public holiday double rate'),
    ('CN', 'weekend', 1.5, 'Weekend loading 50%'),
    ('CA', 'public_holiday', 2.0, 'Canadian public holiday double rate'),
    ('CA', 'weekend', 1.5, 'Weekend loading 50%')
ON CONFLICT DO NOTHING;
