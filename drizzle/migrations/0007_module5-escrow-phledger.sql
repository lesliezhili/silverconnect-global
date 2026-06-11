-- Module 5: Trust Escrow & PHledger
CREATE TABLE IF NOT EXISTS escrow_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    status TEXT NOT NULL DEFAULT 'pending', -- pending, held, released, refunded
    held_at TIMESTAMPTZ,
    released_at TIMESTAMPTZ,
    provider_payout DECIMAL(10,2),
    platform_fee DECIMAL(10,2),
    charity_surplus DECIMAL(10,2),
    stripe_payment_intent_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_escrow_booking ON escrow_accounts(booking_id);

-- PHledger: Immutable append-only audit/transparency ledger
CREATE TABLE IF NOT EXISTS phledger_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    block_number BIGSERIAL,
    transaction_type TEXT NOT NULL, -- ESCROW_LOCK, ESCROW_RELEASE, REFUND, CHARITY_DISBURSEMENT
    booking_id UUID REFERENCES bookings(id),
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'AUD',
    metadata JSONB,
    previous_block_hash TEXT,
    block_hash TEXT NOT NULL,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phledger_booking ON phledger_blocks(booking_id);
CREATE INDEX IF NOT EXISTS idx_phledger_type ON phledger_blocks(transaction_type);
