import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

const DAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

export async function POST(req: NextRequest) {
  try {
    // Check for Authorization header first (from frontend after profile creation)
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }
    
    // Fall back to cookie-based auth
    if (!user) {
      const { data } = await supabase.auth.getUser();
      user = data?.user;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { availability } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) {
      return NextResponse.json(
        { error: 'Provider profile missing' },
        { status: 400 }
      );
    }

    // Check supabaseAdmin is configured
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Admin access not configured' },
        { status: 500 }
      );
    }

    // Clear existing
    await supabaseAdmin
      .from('provider_availability')
      .delete()
      .eq('provider_id', provider.id);

    const rows = availability.map((day: string) => ({
      provider_id: provider.id,
      day_of_week: DAY_MAP[day],
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    }));

    const { error: insertError } = await supabaseAdmin
      .from('provider_availability')
      .insert(rows);

    if (insertError) {
      console.error('Availability insert error:', insertError);
      return NextResponse.json(
        { error: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API error:', err);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
