// filepath: app/api/customer/payment-methods/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/customer/payment-methods - Get payment methods
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: paymentMethods, error } = await supabase
    .from('customer_payment_methods')
    .select('*')
    .eq('user_id', user.id)
    .order('is_default', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ paymentMethods: paymentMethods || [] });
}

// POST /api/customer/payment-methods - Add payment method
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { stripePaymentMethodId, cardBrand, cardLast4, cardExpMonth, cardExpYear, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('customer_payment_methods')
      .insert({
        user_id: user.id,
        stripe_payment_method_id: stripePaymentMethodId,
        card_brand: cardBrand,
        card_last4: cardLast4,
        card_exp_month: cardExpMonth,
        card_exp_year: cardExpYear,
        is_default: isDefault || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, paymentMethod: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/customer/payment-methods - Update payment method
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { paymentMethodId, isDefault } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabaseAdmin
        .from('customer_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id);
    }

    const { data, error } = await supabaseAdmin
      .from('customer_payment_methods')
      .update({ is_default: isDefault })
      .eq('id', paymentMethodId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, paymentMethod: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/customer/payment-methods - Delete payment method
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const paymentMethodId = searchParams.get('id');

    if (!paymentMethodId) return NextResponse.json({ error: "Payment method ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('customer_payment_methods')
      .delete()
      .eq('id', paymentMethodId)
      .eq('user_id', user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}