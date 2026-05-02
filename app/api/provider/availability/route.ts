import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';

async function getProviderId(userId: string) {
  const { data, error } = await supabaseAdmin!
    .from('service_providers')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (error) throw error;
  return data.id;
}

export async function GET(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providerId = await getProviderId(user.id);

    const { data, error } = await supabaseAdmin!
      .from('provider_availability')
      .select('*')
      .eq('provider_id', providerId)
      .order('day_of_week')
      .order('start_time');

    if (error) throw error;

    return NextResponse.json({ availability: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providerId = await getProviderId(user.id);
    const body = await request.json();

    const payload = {
      provider_id: providerId,
      day_of_week: body.day_of_week,
      start_time: body.start_time,
      end_time: body.end_time,
      is_available: body.is_available ?? true,
    };

    const { data, error } = await supabaseAdmin!
      .from('provider_availability')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ availability: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providerId = await getProviderId(user.id);
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin!
      .from('provider_availability')
      .update(updates)
      .eq('id', id)
      .eq('provider_id', providerId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ availability: data });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const user = await getServerUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const providerId = await getProviderId(user.id);
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    const { error } = await supabaseAdmin!
      .from('provider_availability')
      .delete()
      .eq('id', id)
      .eq('provider_id', providerId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
