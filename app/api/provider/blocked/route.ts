// filepath: app/api/provider/blocked/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/blocked - Get provider's blocked times
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const providerId = searchParams.get('provider_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!providerId) {
      return NextResponse.json({ error: 'Provider ID required' }, { status: 400 });
    }

    let query = supabase
      .from('provider_blocked_times')
      .select('*')
      .eq('provider_id', providerId)
      .order('blocked_date');

    if (startDate) {
      query = query.gte('blocked_date', startDate);
    }
    if (endDate) {
      query = query.lte('blocked_date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ blocked: data || [] });
  } catch (error) {
    console.error('Error fetching blocked times:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/provider/blocked - Create blocked time
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { providerId, blockedDate, startTime, endTime, reason } = body;

    if (!providerId || !blockedDate) {
      return NextResponse.json({ error: 'Provider ID and blocked date required' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('provider_blocked_times')
      .insert({
        provider_id: providerId,
        blocked_date: blockedDate,
        start_time: startTime,
        end_time: endTime,
        reason: reason || 'personal',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, blocked: data });
  } catch (error) {
    console.error('Error creating blocked time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/provider/blocked - Delete blocked time
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const blockedId = searchParams.get('id');

    if (!blockedId) {
      return NextResponse.json({ error: 'Blocked time ID required' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('provider_blocked_times')
      .delete()
      .eq('id', blockedId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting blocked time:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}