// filepath: app/api/incidents/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/incidents - Get incident reports
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const bookingId = searchParams.get('bookingId');
  
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Check if user is a provider
  const { data: provider } = await (await import('@/lib/supabase')).supabase
    .from('service_providers')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  let query = (await import('@/lib/supabase')).supabase
    .from('incident_reports')
    .select(`
      *,
      bookings (
        id,
        booking_date,
        address,
        services (name),
        service_providers (full_name)
      )
    `)
    .order('created_at', { ascending: false });

  if (provider) {
    query = query.eq('bookings.provider_id', provider.id);
  } else {
    query = query.eq('reporter_id', user.id);
  }

  if (status) query = query.eq('status', status);
  if (bookingId) query = query.eq('booking_id', bookingId);

  const { data: incidents, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ incidents: incidents || [] });
}

// POST /api/incidents - Report incident
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { bookingId, incidentType, description, severity, location, witnesses, evidenceUrls } = body;

    if (!bookingId || !incidentType || !description || !severity) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify booking access
    const { data: booking, error: bookingError } = await (await import('@/lib/supabase')).supabase
      .from('bookings')
      .select('id, user_id')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }

    const isCustomer = booking.user_id === user.id;
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();
    const isProvider = provider && booking.provider_id === provider.id;

    if (!isCustomer && !isProvider) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseAdmin
      .from('incident_reports')
      .insert({
        booking_id: bookingId,
        reporter_id: user.id,
        incident_type: incidentType,
        description,
        severity,
        location,
        witnesses,
        evidence_urls: evidenceUrls,
        status: 'open',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, incident: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}