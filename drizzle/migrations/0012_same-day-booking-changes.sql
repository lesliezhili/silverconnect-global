-- Migration 0012: Same-day booking changes
CREATE TABLE IF NOT EXISTS booking_change_requests (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  change_type TEXT NOT NULL CHECK (change_type IN ('reschedule', 'provider_swap', 'service_change', 'address_change')),
  reason TEXT,
  penalty_amount DECIMAL(10,2) DEFAULT 0,
  admin_fee DECIMAL(10,2) DEFAULT 0,
  surge_premium DECIMAL(10,2) DEFAULT 0,
  repeat_surcharge DECIMAL(10,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS provider_incentive_ledger (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  provider_id TEXT NOT NULL REFERENCES users(id),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  change_request_id TEXT REFERENCES booking_change_requests(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  tier TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_change_requests_booking ON booking_change_requests(booking_id);
CREATE INDEX idx_incentive_provider ON provider_incentive_ledger(provider_id);
