-- Module 3: Customer Onboarding — GPS, preferences, rep linking
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS latitude DECIMAL(9,6);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS longitude DECIMAL(9,6);
ALTER TABLE addresses ADD COLUMN IF NOT EXISTS gps_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- Customer onboarding status tracking
CREATE TYPE customer_onboarding_status AS ENUM (
    'not_started', 'profile_pending', 'address_pending', 'emergency_pending', 'ready_to_book'
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS customer_onboarding_status TEXT NOT NULL DEFAULT 'not_started';
