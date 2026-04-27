// filepath: app/api/provider/blocked-times/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/blocked-times - Get provider's blocked times
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

  const { data: blockedTimes, error } = await (await import('@/lib/supabase')).supabase
    .from('provider_blocked_times')
    .select('*')
    .eq('provider_id', provider.id)
    .gte('end_datetime', new Date().toISOString())
    .order('start_datetime', { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ blockedTimes: blockedTimes || [] });
}

// POST /api/provider/blocked-times - Create blocked time
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

    const body = await req.json();
    const { startDatetime, endDatetime, reason } = body;

    if (!startDatetime || !endDatetime) {
      return NextResponse.json({ error: "Start and end datetime required" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('provider_blocked_times')
      .insert({
        provider_id: provider.id,
        start_datetime: startDatetime,
        end_datetime: endDatetime,
        reason,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, blockedTime: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/provider/blocked-times - Update blocked time
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, startDatetime, endDatetime, reason } = body;

    if (!id) return NextResponse.json({ error: "Blocked time ID required" }, { status: 400 });

    // Verify ownership
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('provider_blocked_times')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (!existing || existing.provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updateData: any = {};
    if (startDatetime) updateData.start_datetime = startDatetime;
    if (endDatetime) updateData.end_datetime = endDatetime;
    if (reason !== undefined) updateData.reason = reason;

    const { data, error } = await supabaseAdmin
      .from('provider_blocked_times')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, blockedTime: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/provider/blocked-times - Delete blocked time
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Blocked time ID required" }, { status: 400 });

    // Verify ownership
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('provider_blocked_times')
      .select('provider_id')
      .eq('id', id)
      .single();

    if (!existing || existing.provider_id !== provider.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('provider_blocked_times')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}