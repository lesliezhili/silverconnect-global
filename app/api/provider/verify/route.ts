// filepath: app/api/provider/verify/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase, supabaseAdmin } from '@/lib/supabase';

// POST /api/provider/verify - Submit provider for verification
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { documents } = body;

    const { data: provider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

    // Update verification status
    const { data, error } = await supabaseAdmin
      .from('service_providers')
      .update({
        verification_status: 'pending',
        background_check_status: 'pending',
      })
      .eq('id', provider.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, provider: data, message: "Verification submitted" });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET /api/provider/verify - Get verification status
export async function GET() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: provider, error } = await supabase
    .from('service_providers')
    .select('verification_status, background_check_status, approved_at, rejection_reason')
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ verification: provider });
}