// filepath: app/api/provider/badges/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/provider/badges - Get provider badges
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

  const { data: badges, error } = await (await import('@/lib/supabase')).supabase
    .from('provider_badges')
    .select('*')
    .eq('provider_id', provider.id)
    .order('awarded_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ badges: badges || [] });
}

// POST /api/provider/badges - Award badge to provider (admin only)
export async function POST(req: NextRequest) {
  try {
    // In production, verify admin role
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { providerId, badgeType, badgeName, badgeDescription, expiresAt } = body;

    if (!providerId || !badgeType || !badgeName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify provider exists
    const { data: provider } = await (await import('@/lib/supabase')).supabase
      .from('service_providers')
      .select('id')
      .eq('id', providerId)
      .single();

    if (!provider) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from('provider_badges')
      .insert({
        provider_id: providerId,
        badge_type: badgeType,
        badge_name: badgeName,
        badge_description: badgeDescription,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, badge: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/provider/badges - Remove badge
export async function DELETE(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: "Badge ID required" }, { status: 400 });

    const { error } = await supabaseAdmin
      .from('provider_badges')
      .delete()
      .eq('id', id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}