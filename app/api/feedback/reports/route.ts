// filepath: app/api/feedback/reports/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/feedback/reports - Get user's rating reports
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: reports, error } = await (await import('@/lib/supabase')).supabase
    .from('rating_reports')
    .select(`
      *,
      ratings (rating, comment, provider_id, bookings (services (name)))
    `)
    .eq('reported_by', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ reports: reports || [] });
}

// POST /api/feedback/reports - Report a rating
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { ratingId, reason, description } = body;

    if (!ratingId || !reason) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify rating exists
    const { data: rating } = await (await import('@/lib/supabase')).supabase
      .from('ratings')
      .select('id')
      .eq('id', ratingId)
      .single();

    if (!rating) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('rating_reports')
      .insert({
        rating_id: ratingId,
        reported_by: user.id,
        reason,
        description,
        status: 'pending',
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, report: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}