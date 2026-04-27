// filepath: app/api/provider/wallet/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/wallet - Get provider wallet
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

  const { data: wallet, error } = await (await import('@/lib/supabase')).supabase
    .from('provider_wallets')
    .select('*')
    .eq('provider_id', provider.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get recent transactions
  const { data: transactions } = await (await import('@/lib/supabase')).supabase
    .from('payment_transactions')
    .select('id, amount, status, escrow_status, created_at')
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return NextResponse.json({ wallet, recentTransactions: transactions || [] });
}

// POST /api/provider/wallet - Initialize wallet (first time provider)
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get provider ID
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    // Check if wallet already exists
    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('provider_wallets')
      .select('id')
      .eq('provider_id', provider.id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Wallet already exists" }, { status: 400 });
    }

    // Create wallet
    const { data: wallet, error } = await supabaseAdmin
      .from('provider_wallets')
      .insert({
        provider_id: provider.id,
        balance: 0,
        pending_balance: 0,
        total_earned: 0,
        total_paid_out: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, wallet });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}