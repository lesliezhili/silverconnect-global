-- =====================================================
-- MODULE 6: Disputes, Safety & Compliance
-- =====================================================

-- Disputes table (already exists, adding more fields)
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'normal'; -- low, normal, high, urgent
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS resolution_amount DECIMAL(10,2);
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS customer_agreed BOOLEAN;
ALTER TABLE disputes ADD COLUMN IF NOT EXISTS provider_agreed BOOLEAN;

-- Dispute evidence
CREATE TABLE IF NOT EXISTS dispute_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),
  file_url TEXT NOT NULL,
  file_type TEXT, -- image, document, video
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Dispute messages/comments
CREATE TABLE IF NOT EXISTS dispute_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT false, -- internal admin notes
  created_at TIMESTAMP DEFAULT NOW()
);

-- Safety flags (already exists, adding more fields)
ALTER TABLE safety_flags ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id);
ALTER TABLE safety_flags ADD COLUMN IF NOT EXISTS investigation_notes TEXT;
ALTER TABLE safety_flags ADD COLUMN IF NOT EXISTS action_taken TEXT;
ALTER TABLE safety_flags ADD COLUMN IF NOT EXISTS resolved_by UUID REFERENCES users(id);

-- Incident reports (detailed safety incidents)
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  reporter_id UUID REFERENCES users(id),
  incident_type TEXT NOT NULL, -- injury, property_damage, harassment, theft, other
  description TEXT NOT NULL,
  severity TEXT NOT NULL, -- low, medium, high, critical
  location TEXT,
  witnesses JSONB,
  evidence_urls TEXT[],
  status TEXT DEFAULT 'open', -- open, under_review, resolved, closed
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Provider compliance documents
CREATE TABLE IF NOT EXISTS compliance_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL, -- insurance, license, background_check, tax, emergency_contact
  document_number TEXT,
  file_url TEXT NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'pending', -- pending, valid, expired, rejected
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance alerts
CREATE TABLE IF NOT EXISTS compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- expiring_soon, expired, missing
  message TEXT NOT NULL,
  is_resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- RLS Policies
ALTER TABLE dispute_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance_alerts ENABLE ROW LEVEL SECURITY;

-- Parties can view dispute
CREATE POLICY "Parties can view own disputes" ON disputes
  FOR SELECT USING (
    customer_id = auth.uid() OR 
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Parties can add evidence to disputes
CREATE POLICY "Parties can add dispute evidence" ON dispute_evidence
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() OR
    dispute_id IN (
      SELECT id FROM disputes WHERE 
      customer_id = auth.uid() OR 
      provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
    )
  );

-- Users can report incidents
CREATE POLICY "Users can report incidents" ON incident_reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

-- Providers can manage compliance
CREATE POLICY "Providers can manage compliance" ON compliance_documents
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Function to auto-close old disputes
CREATE OR REPLACE FUNCTION auto_close_disputes()
RETURNS VOID AS $$
BEGIN
  UPDATE disputes 
  SET status = 'closed'
  WHERE status = 'resolved' 
  AND resolved_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;