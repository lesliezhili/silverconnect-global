// filepath: app/api/payments/refunds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/payments/refunds - Get refund requests
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: refunds, error } = await (await import('@/lib/supabase')).supabase
    .from('refund_requests')
    .select(`
      *,
      bookings (
        id,
        booking_date,
        booking_time,
        total_price,
        services (name),
        service_providers (full_name)
      ),
      payment_transactions (stripe_payment_id, amount)
    `)
    .eq('requested_by', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ refunds: refunds || [] });
}

// POST /api/payments/refunds - Request refund
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, amount, reason } = body;

    if (!bookingId || !amount || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify booking ownership and payment status
    const { data: booking, error: bookingError } = await (await import('@/lib/supabase')).supabase
      .from('bookings')
      .select('*, payment_transactions(*)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    if (booking.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (booking.payment_status !== 'PAID') {
      return NextResponse.json({ error: "Booking not paid" }, { status: 400 });
    }

    // Get payment transaction
    const paymentTx = booking.payment_transactions?.[0];
    if (!paymentTx) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    // Create refund request
    const { data: refund, error } = await supabaseAdmin
      .from('refund_requests')
      .insert({
        booking_id: bookingId,
        payment_transaction_id: paymentTx.id,
        requested_by: user.id,
        amount,
        reason,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, refund });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}