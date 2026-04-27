// filepath: app/api/ai/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// GET /api/ai/sessions - Get user's chatbot sessions
export async function GET() {
  const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: sessions, error } = await (await import('@/lib/supabase')).supabase
    .from('chatbot_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('started_at', { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ sessions: sessions || [] });
}

// POST /api/ai/sessions - Start new chatbot session
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { initialIntent } = body;

    const { data, error } = await supabaseAdmin
      .from('chatbot_sessions')
      .insert({
        user_id: user.id,
        initial_intent: initialIntent,
        messages_count: 0,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/ai/sessions - Update session (end session, add feedback)
export async function PUT(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, endedAt, finalIntent, messagesCount, escalatedToHuman, satisfactionScore, feedbackText } = body;

    if (!id) return NextResponse.json({ error: "Session ID required" }, { status: 400 });

    // Verify ownership
    const { data: existing } = await (await import('@/lib/supabase')).supabase
      .from('chatbot_sessions')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing || existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const updates: any = {};
    if (endedAt !== undefined) updates.ended_at = endedAt;
    if (finalIntent !== undefined) updates.final_intent = finalIntent;
    if (messagesCount !== undefined) updates.messages_count = messagesCount;
    if (escalatedToHuman !== undefined) updates.escalated_to_human = escalatedToHuman;
    if (satisfactionScore !== undefined) updates.satisfaction_score = satisfactionScore;
    if (feedbackText !== undefined) updates.feedback_text = feedbackText;

    const { data, error } = await supabaseAdmin
      .from('chatbot_sessions')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, session: data });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}