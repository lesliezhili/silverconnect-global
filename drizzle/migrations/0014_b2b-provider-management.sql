-- Migration 0014: B2B Provider Management tables
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('agency', 'facility', 'community')),
  abn TEXT,
  ndis_registration_number TEXT,
  insurance_policy TEXT,
  insurance_expiry DATE,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address TEXT,
  country TEXT NOT NULL DEFAULT 'AU',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS org_memberships (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL CHECK (role IN ('org_admin', 'roster_manager', 'finance_officer', 'team_lead', 'carer')),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roster_entries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  provider_id TEXT NOT NULL REFERENCES users(id),
  booking_id TEXT REFERENCES bookings(id),
  client_id TEXT NOT NULL REFERENCES users(id),
  service_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS funding_claims (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  booking_id TEXT NOT NULL REFERENCES bookings(id),
  participant_number TEXT NOT NULL,
  support_item_number TEXT NOT NULL,
  service_date DATE NOT NULL,
  quantity DECIMAL(6,2) NOT NULL,
  unit_price DECIMAL(8,2) NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  evidence_type TEXT CHECK (evidence_type IN ('gps_checkin', 'client_confirm', 'both')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'validated', 'submitted', 'accepted', 'rejected', 'paid')),
  batch_reference TEXT,
  rejection_reason TEXT,
  submitted_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_batches (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  batch_reference TEXT NOT NULL UNIQUE,
  total_claims INTEGER NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  accepted INTEGER DEFAULT 0,
  rejected INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'partially_accepted', 'accepted', 'rejected')),
  submitted_at TIMESTAMPTZ,
  response_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_snapshots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  organization_id TEXT NOT NULL REFERENCES organizations(id),
  period TEXT NOT NULL,
  utilization_rate DECIMAL(5,4),
  booked_hours DECIMAL(8,2),
  available_hours DECIMAL(8,2),
  compliance_rate DECIMAL(5,4),
  revenue DECIMAL(12,2),
  costs DECIMAL(12,2),
  avg_rating DECIMAL(3,2),
  punctuality_rate DECIMAL(5,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_org_memberships_org ON org_memberships(organization_id);
CREATE INDEX idx_org_memberships_user ON org_memberships(user_id);
CREATE INDEX idx_roster_org_date ON roster_entries(organization_id, service_date);
CREATE INDEX idx_roster_provider ON roster_entries(provider_id, service_date);
CREATE INDEX idx_claims_org ON funding_claims(organization_id);
CREATE INDEX idx_claims_status ON funding_claims(status);
CREATE INDEX idx_claims_batch ON funding_claims(batch_reference);
CREATE INDEX idx_snapshots_org ON workforce_snapshots(organization_id, period);
