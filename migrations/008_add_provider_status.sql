-- Add status and verified columns to service_providers table
-- This is needed because the provider registration API tries to set status='pending' and verified=false

ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE service_providers ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;