// filepath: app/api/disputes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/disputes/[id] - Get single dispute
export async function GET(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: dispute, error } = await (await import('@/lib/supabase')).supabase
    .from('disputes')
    .select(`
      *,
      bookings (
        id,
        booking_date,
        booking_time,
        total_price,
        address,
        services (name),
        service_providers (full_name)
      ),
      dispute_evidence (*),
      dispute_messages (*, users (full_name))
    `)
    .eq('id', id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 404 });

  // Check access
  const isCustomer = dispute.customer_id === user.id;
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isProvider = provider && dispute.provider_id === provider.id;

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ dispute });
}

// PUT /api/disputes/[id] - Update dispute (add evidence, messages)
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { action, ...data } = body;

  // Get dispute
  const { data: dispute, error: fetchError } = await (await import('@/lib/supabase')).supabase
    .from('disputes')
    .select('*')
    .eq('id', id)
    .single();

  if (fetchError || !dispute) {
    return NextResponse.json({ error: "Dispute not found" }, { status: 404 });
  }

  // Check access
  const isCustomer = dispute.customer_id === user.id;
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();
  const isProvider = provider && dispute.provider_id === provider.id;

  if (!isCustomer && !isProvider) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (action === 'add_evidence') {
    // Add evidence
    const { fileUrl, fileType, description } = data;
    if (!fileUrl) return NextResponse.json({ error: "File URL required" }, { status: 400 });

    const { data: evidence, error } = await supabaseAdmin
      .from('dispute_evidence')
      .insert({
        dispute_id: id,
        uploaded_by: user.id,
        file_url: fileUrl,
        file_type: fileType,
        description,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, evidence });
  }

  if (action === 'add_message') {
    // Add message
    const { message, isInternal } = data;
    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    const { data: msg, error } = await supabaseAdmin
      .from('dispute_messages')
      .insert({
        dispute_id: id,
        user_id: user.id,
        message,
        is_internal: isInternal || false,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, message: msg });
  }

  if (action === 'accept_resolution') {
    // Accept resolution
    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateField = isCustomer ? 'customer_agreed' : 'provider_agreed';

    const { data: updated, error } = await supabaseAdmin
      .from('disputes')
      .update({ [updateField]: true })
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, dispute: updated });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}