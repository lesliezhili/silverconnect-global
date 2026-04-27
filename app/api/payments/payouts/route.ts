// filepath: app/api/payments/payouts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/payments/payouts - Get provider payouts
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Get provider ID
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .single();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const { data: payouts, error } = await (await import('@/lib/supabase')).supabase
    .from('payouts')
    .select(`
      *,
      bookings (booking_date, services (name)),
      payment_transactions (stripe_payment_id, amount)
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ payouts: payouts || [] });
}

// POST /api/payments/payouts - Request payout (or trigger via Stripe)
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get provider ID and wallet
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data: wallet, error: walletError } = await (await import('@/lib/supabase')).supabase
      .from('provider_wallets')
      .select('*')
      .eq('provider_id', provider.id)
      .single();

    if (walletError || !wallet) {
      return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
    }

    const body = await req.json();
    const { amount } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (wallet.balance < amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
    }

    // In production, create Stripe transfer
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const transfer = await stripe.transfers.create({
    //   amount: Math.round(amount * 100),
    //   currency: 'aud',
    //   destination: provider.stripe_account_id,
    // });

    const stripeTransferId = `tr_simulated_${Date.now()}`;

    // Create payout record
    const { data: payout, error } = await supabaseAdmin
      .from('payouts')
      .insert({
        provider_id: provider.id,
        amount: amount,
        currency: 'AUD',
        status: 'completed',
        stripe_transfer_id: stripeTransferId,
        processed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update wallet balance
    await supabaseAdmin
      .from('provider_wallets')
      .update({
        balance: wallet.balance - amount,
        total_paid_out: wallet.total_paid_out + amount,
        updated_at: new Date().toISOString(),
      })
      .eq('provider_id', provider.id);

    return NextResponse.json({ success: true, payout });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}