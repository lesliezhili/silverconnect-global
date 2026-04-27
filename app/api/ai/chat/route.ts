// filepath: app/api/ai/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/ai/chat - Process AI chat message
export async function POST(req: NextRequest) {
  try {
    const { data: { user } } = await (await import('@/lib/supabase')).supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { message, conversationId, sessionId, language = 'en' } = body;

    if (!message) return NextResponse.json({ error: "Message required" }, { status: 400 });

    // Get or create conversation
    let conversation;
    if (conversationId) {
      const { data: existing } = await (await import('@/lib/supabase')).supabase
        .from('ai_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .single();
      conversation = existing;
    }

    if (!conversation && sessionId) {
      const { data: newConv } = await supabaseAdmin
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          messages: [],
          language,
          context: {},
        })
        .select()
        .single();
      conversation = newConv;
    }

    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Get user message history
    const messages = conversation.messages || [];
    messages.push({ role: 'user', content: message, timestamp: new Date().toISOString() });

    // Classify intent
    const { data: intents } = await (await import('@/lib/supabase')).supabase
      .from('ai_intents')
      .select('*')
      .eq('is_active', true);

    // Simple keyword-based intent classification
    let detectedIntent = null;
    let confidence = 0;
    
    const lowerMessage = message.toLowerCase();
    
    if (intents && intents.length > 0) {
      for (const intent of intents) {
        if (intent.intent_name === 'book_service' && (lowerMessage.includes('book') || lowerMessage.includes('预约') || lowerMessage.includes('schedule'))) {
          detectedIntent = intent;
          confidence = 0.8;
        } else if (intent.intent_name === 'cancel_booking' && (lowerMessage.includes('cancel') || lowerMessage.includes('取消') || lowerMessage.includes('refund'))) {
          detectedIntent = intent;
          confidence = 0.8;
        } else if (intent.intent_name === 'reschedule' && (lowerMessage.includes('reschedule') || lowerMessage.includes('改期') || lowerMessage.includes('change time'))) {
          detectedIntent = intent;
          confidence = 0.8;
        } else if (intent.intent_name === 'get_receipt' && (lowerMessage.includes('receipt') || lowerMessage.includes('收据') || lowerMessage.includes('invoice'))) {
          detectedIntent = intent;
          confidence = 0.8;
        } else if (intent.intent_name === 'contact_support' && (lowerMessage.includes('help') || lowerMessage.includes('帮助') || lowerMessage.includes('support'))) {
          detectedIntent = intent;
          confidence = 0.9;
        } else if (intent.intent_name === 'faq' && (lowerMessage.includes('what') || lowerMessage.includes('how') || lowerMessage.includes('什么') || lowerMessage.includes('怎么'))) {
          detectedIntent = intent;
          confidence = 0.6;
        } else if (intent.intent_name === 'payment_issue' && (lowerMessage.includes('payment') || lowerMessage.includes('支付') || lowerMessage.includes('pay'))) {
          detectedIntent = intent;
          confidence = 0.7;
        }
      }
    }

    // Search knowledge base for relevant answers
    const { data: kbResults } = await (await import('@/lib/supabase')).supabase
      .rpc('search_knowledge_base', { p_query: message, p_language: language });

    // Generate response
    let response = '';
    let shouldEscalate = false;

    if (detectedIntent?.response_template) {
      response = detectedIntent.response_template;
    } else if (kbResults && kbResults.length > 0) {
      response = kbResults[0].answer;
      // Increment view count
      await supabaseAdmin
        .from('ai_knowledge_base')
        .update({ view_count: (kbResults[0].view_count || 0) + 1 })
        .eq('id', kbResults[0].id);
    } else {
      // Get fallback response
      const { data: fallback } = await (await import('@/lib/supabase')).supabase
        .from('ai_response_templates')
        .select('template_text')
        .eq('template_key', 'fallback')
        .eq('language', language)
        .single();
      response = fallback?.template_text || "I'm not sure I understood that. Could you please rephrase?";
    }

    // Check for escalation keywords
    if (lowerMessage.includes('speak to human') || lowerMessage.includes('人工客服') || lowerMessage.includes('投诉')) {
      shouldEscalate = true;
    }

    // Add AI response to messages
    messages.push({ 
      role: 'assistant', 
      content: response, 
      timestamp: new Date().toISOString(),
      intent: detectedIntent?.intent_name,
      confidence,
    });

    // Update conversation
    await supabaseAdmin
      .from('ai_conversations')
      .update({
        messages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id);

    return NextResponse.json({
      success: true,
      response: {
        message: response,
        intent: detectedIntent?.intent_name,
        confidence,
        shouldEscalate,
        knowledgeBaseResults: kbResults || [],
      },
      conversationId: conversation.id,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}