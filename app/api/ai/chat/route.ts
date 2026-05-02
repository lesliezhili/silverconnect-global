import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, getServerUserFromRequest } from '@/lib/supabase';
import { getPricingExplanation } from '@/lib/ai/pricingTemplates';

export async function POST(req: NextRequest) {
  const user = await getServerUserFromRequest(req);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { message, country_code, is_weekend, is_holiday, time_of_day, language } = body;

  if (!message) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }

  // Stub AI response
  let response = 'Thank you for your message. This is a stub response.';

  // If message contains pricing, provide explanation
  if (message.toLowerCase().includes('pricing') || message.toLowerCase().includes('price')) {
    if (country_code && language) {
      response = getPricingExplanation(country_code as 'AU' | 'CA' | 'US' | 'CN', is_weekend, is_holiday, time_of_day, language);
    }
  }

  // Save to conversations
  const { data: conversation, error } = await supabaseAdmin!
    .from('ai_conversations')
    .insert({
      session_id: body.session_id || 'default',
      message,
      response,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ response, conversation });
}
    await supabaseAdmin
      .from('ai_knowledge_base')
      .update({ view_count: (kbResults[0].view_count || 0) + 1 })
      .eq('id', kbResults[0].id)
  } else {
    const { data: fallback } = await supabaseAdmin
      .from('ai_response_templates')
      .select('template_text')
      .eq('template_key', 'fallback')
      .eq('language', language)
      .maybeSingle()

    responseText = fallback?.template_text || "I'm not sure I understood that. Could you please rephrase?"
  }

  const shouldEscalate = ['speak to human', '人工客服', '投诉', 'urgent', 'emergency'].some((term) =>
    lowerMessage.includes(term)
  )

  const messages = [...(conversation.messages || [])]
  messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() })
  messages.push({ role: 'assistant', content: responseText, timestamp: new Date().toISOString(), intent: detectedIntent?.intent_name, confidence })

  const { error } = await supabaseAdmin
    .from('ai_conversations')
    .update({ messages, updated_at: new Date().toISOString() })
    .eq('id', conversation.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    response: {
      message: responseText,
      intent: detectedIntent?.intent_name,
      confidence,
      shouldEscalate,
      knowledgeBaseResults: kbResults || []
    },
    conversationId: conversation.id
  })
}
