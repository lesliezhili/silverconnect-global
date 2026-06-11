-- Migration 0013: Feedback evidence and disputes
CREATE TABLE IF NOT EXISTS feedback_evidence (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feedback_id TEXT NOT NULL REFERENCES service_feedback(id),
  type TEXT NOT NULL CHECK (type IN ('photo', 'video', 'voice', 'screenshot', 'text')),
  url TEXT,
  description TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_disputes (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  feedback_id TEXT NOT NULL REFERENCES service_feedback(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  reason TEXT NOT NULL,
  counter_evidence_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'upheld', 'dismissed', 'removed')),
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

CREATE INDEX idx_evidence_feedback ON feedback_evidence(feedback_id);
CREATE INDEX idx_disputes_feedback ON feedback_disputes(feedback_id);
CREATE INDEX idx_disputes_provider ON feedback_disputes(provider_id);
