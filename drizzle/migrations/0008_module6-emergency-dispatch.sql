-- Module 6: Emergency Dispatch & AI Check-In
CREATE TABLE IF NOT EXISTS booking_checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    lead_hours INTEGER NOT NULL, -- hours before appointment (24, 12, 6, 4, 2)
    provider_confirmed BOOLEAN,
    checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    response_at TIMESTAMPTZ,
    escalated BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_checkins_booking ON booking_checkins(booking_id);

CREATE TABLE IF NOT EXISTS emergency_reroutes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    original_provider_id UUID,
    replacement_provider_id UUID,
    reason TEXT NOT NULL, -- 'provider_no_response', 'provider_cancelled', 'provider_emergency'
    rerouted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    customer_notified BOOLEAN NOT NULL DEFAULT FALSE,
    admin_escalated BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_reroutes_booking ON emergency_reroutes(booking_id);
