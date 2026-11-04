-- Migration 0015: Release 1 — effort tiers, quality control, quotes, feedback aspects.
-- Idempotent; safe to re-run. Apply before deploying the Release 1 code.

-- Effort tier the booking was priced at (regular | medium | high).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS effort_tier TEXT;
-- Provider's completed checklist: { "<item key>": true, ... }
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qc_checklist JSONB;
-- Set by QC at completion (e.g. 'short_visit'); payout held for admin review while set.
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qc_flag TEXT;
-- Handyman job description chosen at booking (furniture, hanging, door, ...).
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS job_type TEXT;
CREATE INDEX IF NOT EXISTS bookings_qc_flag_idx ON bookings (provider_id) WHERE qc_flag IS NOT NULL;

-- booking_evidence.description holds the QC area key (kitchen, bathroom, front, job, ...).
CREATE INDEX IF NOT EXISTS booking_evidence_phase_idx ON booking_evidence (booking_id, phase);

-- Per-aspect ratings for two-way feedback, e.g.
-- customer→provider {"quality":5,"punctuality":4,"communication":5}
-- provider→customer {"access":5,"accurate_description":3,"respect":5}
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS aspects JSONB;
-- Rater's suggestion for the next visit's tier (feeds service selection).
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS suggested_tier TEXT;

-- Quotes for later visits after a first medium/high (or overrunning regular) job.
CREATE TABLE IF NOT EXISTS service_quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES provider_profiles(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  from_tier TEXT NOT NULL,
  tier TEXT NOT NULL,
  hours NUMERIC(4,1) NOT NULL,
  booked_min INTEGER NOT NULL,
  actual_min INTEGER,
  base_price NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','declined','expired','used')),
  expires_at TIMESTAMPTZ NOT NULL,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS service_quotes_booking_uq ON service_quotes (booking_id);
CREATE INDEX IF NOT EXISTS service_quotes_pair_idx ON service_quotes (customer_id, provider_id, category, status);

-- Cancellations: the code records provider compensation and these reasons;
-- the table was created by an admin route without them.
ALTER TABLE cancellations ADD COLUMN IF NOT EXISTS provider_compensation NUMERIC(10,2) DEFAULT 0;
ALTER TYPE cancellation_reason ADD VALUE IF NOT EXISTS 'provider_declined';
ALTER TYPE cancellation_reason ADD VALUE IF NOT EXISTS 'no_show';
ALTER TYPE cancellation_reason ADD VALUE IF NOT EXISTS 'weather';
