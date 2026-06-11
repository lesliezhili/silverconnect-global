-- Module 7: AI Service & Biography Engine
-- Token quota system for biography sessions
CREATE TABLE IF NOT EXISTS biography_quotas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type TEXT NOT NULL DEFAULT 'standard', -- 'standard', 'premium', 'enterprise'
    max_allowed_tokens BIGINT NOT NULL DEFAULT 500000, -- ~250 pages
    tokens_consumed BIGINT NOT NULL DEFAULT 0,
    sessions_completed INTEGER NOT NULL DEFAULT 0,
    activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(customer_id)
);

-- Biography chapters (generated output)
CREATE TABLE IF NOT EXISTS biography_chapters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    chapter_number INTEGER NOT NULL,
    title TEXT,
    content TEXT NOT NULL,
    transcript_source TEXT, -- original transcript
    tokens_used INTEGER NOT NULL DEFAULT 0,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    edited_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'draft' -- draft, reviewed, published
);
CREATE INDEX IF NOT EXISTS idx_biography_chapters_customer ON biography_chapters(customer_id, chapter_number);

-- AI intent classification log
CREATE TABLE IF NOT EXISTS ai_intent_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    message_text TEXT NOT NULL,
    classified_intent TEXT NOT NULL, -- 'general_inquiry', 'booking_help', 'emergency_safety', 'dispute', 'biography'
    confidence DECIMAL(4,3),
    handed_off BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intent_log_user ON ai_intent_log(user_id, created_at DESC);
