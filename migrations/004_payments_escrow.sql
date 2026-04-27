-- =====================================================
-- MODULE 4: Payments, Escrow & Payouts
-- =====================================================

-- Payment transactions already exist
-- Add escrow and payout related fields

ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'held'; -- held, released, refunded
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS escrow_released_at TIMESTAMP;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0;
ALTER TABLE payment_transactions ADD COLUMN IF NOT EXISTS provider_payout DECIMAL(10,2) DEFAULT 0;

-- Payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id),
  booking_id UUID REFERENCES bookings(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'AUD',
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  stripe_transfer_id TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  processed_at TIMESTAMP
);

-- Refund requests
CREATE TABLE IF NOT EXISTS refund_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  requested_by UUID REFERENCES users(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, processed
  processed_by UUID REFERENCES users(id),
  processed_at TIMESTAMP,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Payment disputes
CREATE TABLE IF NOT EXISTS payment_disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id),
  payment_transaction_id UUID REFERENCES payment_transactions(id),
  customer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES service_providers(id),
  amount DECIMAL(10,2) NOT NULL,
  reason TEXT NOT NULL,
  evidence JSONB,
  status TEXT DEFAULT 'open', -- open, under_review, resolved_customer, resolved_provider, closed
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);

-- Provider wallet/earnings
CREATE TABLE IF NOT EXISTS provider_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) UNIQUE,
  balance DECIMAL(10,2) DEFAULT 0,
  pending_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  total_paid_out DECIMAL(10,2) DEFAULT 0,
  stripe_balance_id TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_wallets ENABLE ROW LEVEL SECURITY;

-- Providers can view their payouts
CREATE POLICY "Providers can view own payouts" ON payouts
  FOR SELECT USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Users can view their refund requests
CREATE POLICY "Users can view own refund requests" ON refund_requests
  FOR SELECT USING (requested_by = auth.uid());

-- Providers can view their wallet
CREATE POLICY "Providers can view own wallet" ON provider_wallets
  FOR SELECT USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Function to calculate platform fee (e.g., 15%)
CREATE OR REPLACE FUNCTION calculate_platform_fee(amount DECIMAL(10,2))
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN ROUND(amount * 0.15, 2);
END;
$$ LANGUAGE plpgsql;

-- Function to release escrow after booking completion
CREATE OR REPLACE FUNCTION release_escrow(p_booking_id UUID)
RETURNS VOID AS $$
DECLARE
  v_transaction payment_transactions%ROWTYPE;
  v_fee DECIMAL(10,2);
  v_provider_payout DECIMAL(10,2);
  v_provider_id UUID;
BEGIN
  SELECT * INTO v_transaction FROM payment_transactions WHERE booking_id = p_booking_id;
  
  IF v_transaction IS NULL OR v_transaction.escrow_status != 'held' THEN
    RAISE EXCEPTION 'No held escrow found for this booking';
  END IF;

  v_fee := calculate_platform_fee(v_transaction.amount);
  v_provider_payout := v_transaction.amount - v_fee;

  UPDATE payment_transactions 
  SET escrow_status = 'released', 
      escrow_released_at = NOW(),
      platform_fee = v_fee,
      provider_payout = v_provider_payout
  WHERE id = v_transaction.id;

  SELECT provider_id INTO v_provider_id FROM bookings WHERE id = p_booking_id;

  INSERT INTO payouts (provider_id, booking_id, payment_transaction_id, amount, status)
  VALUES (v_provider_id, p_booking_id, v_transaction.id, v_provider_payout, 'pending');

  UPDATE provider_wallets 
  SET balance = balance + v_provider_payout,
      pending_balance = pending_balance - v_provider_payout,
      total_earned = total_earned + v_provider_payout,
      updated_at = NOW()
  WHERE provider_id = v_provider_id;
END;
$$ LANGUAGE plpgsql;