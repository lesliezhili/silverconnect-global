-- Module 1: Auth & User Profiles - Schema Expansion
-- Adds language fallback, role switching, accessibility, and full_name enforcement

-- Expand locale enum to support all target languages
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'th';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'ko';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'ja';
ALTER TYPE locale ADD VALUE IF NOT EXISTS 'zh_tw';

-- Add missing user profile fields per spec
ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS large_text_mode BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language TEXT NOT NULL DEFAULT 'en';
ALTER TABLE users ADD COLUMN IF NOT EXISTS current_active_role TEXT NOT NULL DEFAULT 'customer';
ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;

-- Role history / switching audit
CREATE TABLE IF NOT EXISTS user_role_switches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_role TEXT NOT NULL,
    to_role TEXT NOT NULL,
    switched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_role_switches_user ON user_role_switches(user_id, switched_at DESC);

-- Representative / helper delegation table
CREATE TABLE IF NOT EXISTS user_representatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    elder_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    representative_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    authorization_doc_url TEXT,
    verified BOOLEAN NOT NULL DEFAULT FALSE,
    linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,
    UNIQUE(elder_user_id, representative_user_id)
);
CREATE INDEX IF NOT EXISTS idx_representatives_elder ON user_representatives(elder_user_id);
CREATE INDEX IF NOT EXISTS idx_representatives_rep ON user_representatives(representative_user_id);
