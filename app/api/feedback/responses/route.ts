// filepath: app/api/feedback/responses/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/feedback/responses - Get provider's responses
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

  const { data: responses, error } = await (await import('@/lib/supabase')).supabase
    .from('rating_responses')
    .select(`
      *,
      ratings (rating, comment, booking_id, bookings (services (name)))
    `)
    .eq('provider_id', provider.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ responses: responses || [] });
}

// POST /api/feedback/responses - Provider responds to a rating
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
    const { ratingId, responseText } = body;

    if (!ratingId || !responseText) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify rating belongs to this provider
    const { data: rating } = await (await import('@/lib/supabase')).supabase
      .from('ratings')
      .select('provider_id')
      .eq('id', ratingId)
      .single();

    if (!rating || rating.provider_id !== provider.id) {
      return NextResponse.json({ error: "Rating not found or forbidden" }, { status: 403 });
    }

    // Check if response already exists
    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('rating_responses')
      .select('id')
      .eq('rating_id', ratingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Response already exists" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('rating_responses')
      .insert({
        rating_id: ratingId,
        provider_id: provider.id,
        response_text: responseText,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Update rating with response
    await supabaseAdmin
      .from('ratings')
      .update({ response_text: responseText, response_at: new Date().toISOString() })
      .eq('id', ratingId);

    return NextResponse.json({ success: true, response: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}