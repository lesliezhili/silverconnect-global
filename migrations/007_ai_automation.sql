-- =====================================================
-- MODULE 7: AI Customer Service & Automation
-- =====================================================

-- AI conversation history
CREATE TABLE IF NOT EXISTS ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  session_id TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  context JSONB, -- booking context, provider info, etc.
  language TEXT DEFAULT 'en',
  satisfaction_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- AI intent classification
CREATE TABLE IF NOT EXISTS ai_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  intent_name TEXT NOT NULL,
  description TEXT,
  required_slots TEXT[], -- slots needed to fulfill intent
  response_template TEXT,
  escalation_threshold INTEGER DEFAULT 3, -- times before human handoff
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Predefined intents
INSERT INTO ai_intents (intent_name, description, required_slots, response_template) VALUES
('book_service', 'Book a service', '["service", "date", "time", "address"]', 'I can help you book a service. Let me gather the details.'),
('cancel_booking', 'Cancel a booking', '["booking_id", "reason"]', 'I''m sorry to hear you need to cancel. Let me help with that.'),
('reschedule', 'Reschedule a booking', '["booking_id", "new_date", "new_time"]', 'I can help you reschedule your booking.'),
('get_receipt', 'Get a receipt', '["booking_id"]', 'Let me retrieve your receipt.'),
('contact_support', 'Contact human support', NULL, 'I''ll connect you with a human agent.'),
('faq', 'Frequently asked questions', NULL, 'Here''s some information that might help.'),
('provider_info', 'Get provider information', '["provider_id"]', 'Let me find that information for you.'),
('payment_issue', 'Payment issue', '["booking_id", "issue_type"]', 'I''ll help resolve your payment issue.');

-- AI knowledge base
CREATE TABLE IF NOT EXISTS ai_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  keywords TEXT[],
  language TEXT DEFAULT 'en',
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Sample knowledge base entries
INSERT INTO ai_knowledge_base (category, question, answer, keywords) VALUES
('booking', 'How do I book a service?', 'You can book a service by selecting your desired service, choosing a provider, picking a date and time, and confirming payment.', 'book, booking, schedule, appointment'),
('cancellation', 'What is your cancellation policy?', 'You can cancel up to 24 hours before your booking for a full refund. Within 24 hours, a 50% fee applies.', 'cancel, cancellation, refund, policy'),
('payment', 'What payment methods do you accept?', 'We accept all major credit cards, debit cards, and PayPal.', 'payment, pay, card, credit, debit'),
('provider', 'How are providers verified?', 'All providers undergo background checks, reference verification, and skills assessment before joining our platform.', 'provider, verified, background, check'),
('support', 'How do I contact support?', 'You can reach our support team via the chat, email at support@silverconnect.global, or call our hotline.', 'support, contact, help, chat');

-- AI automation rules
CREATE TABLE IF NOT EXISTS ai_automation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  trigger_condition JSONB NOT NULL, -- {intent: 'book_service', slots_filled: ['service', 'date']}
  action JSONB NOT NULL, -- {type: 'create_booking', next_state: 'confirm'}
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chatbot sessions
CREATE TABLE IF NOT EXISTS chatbot_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  initial_intent TEXT,
  final_intent TEXT,
  messages_count INTEGER DEFAULT 0,
  escalated_to_human BOOLEAN DEFAULT false,
  satisfaction_score INTEGER,
  feedback_text TEXT
);

-- AI response templates per language
CREATE TABLE IF NOT EXISTS ai_response_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key TEXT NOT NULL,
  language TEXT NOT NULL,
  template_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  UNIQUE(template_key, language)
);

-- Sample response templates
INSERT INTO ai_response_templates (template_key, language, template_text) VALUES
('greeting', 'en', 'Hello! I''m SilverConnect AI Assistant. How can I help you today?'),
('greeting', 'zh', '您好！我是银联AI助手。有什么可以帮助您的？'),
('booking_confirm', 'en', 'Your booking has been confirmed! You''ll receive a confirmation email shortly.'),
('booking_confirm', 'zh', '您的预约已确认！您将很快收到确认邮件。'),
('fallback', 'en', 'I''m not sure I understood that. Could you please rephrase? Or type "help" to speak with a human agent.'),
('fallback', 'zh', '抱歉我没有理解您的意思。请重新描述一下，或者输入"帮助"联系人工客服。');

-- RLS Policies
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_response_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own conversations
CREATE POLICY "Users can view own conversations" ON ai_conversations
  FOR ALL USING (user_id = auth.uid());

-- Users can view their chatbot sessions
CREATE POLICY "Users can view own chatbot sessions" ON chatbot_sessions
  FOR ALL USING (user_id = auth.uid());

-- Public can view active knowledge base
CREATE POLICY "Public can view knowledge base" ON ai_knowledge_base
  FOR SELECT USING (is_active = true);

-- Public can view response templates
CREATE POLICY "Public can view response templates" ON ai_response_templates
  FOR SELECT USING (is_active = true);

-- Function to search knowledge base
CREATE OR REPLACE FUNCTION search_knowledge_base(p_query TEXT, p_language TEXT DEFAULT 'en')
RETURNS TABLE(id UUID, question TEXT, answer TEXT, keywords TEXT[]) AS $$
BEGIN
  RETURN QUERY
  SELECT kb.id, kb.question, kb.answer, kb.keywords
  FROM ai_knowledge_base kb
  WHERE kb.is_active = true 
    AND kb.language = p_language
    AND (
      kb.question ILIKE '%' || p_query || '%' OR
      kb.answer ILIKE '%' || p_query || '%' OR
      kb.keywords && string_to_array(LOWER(p_query), ' ')
    )
  ORDER BY kb.view_count DESC
  LIMIT 5;
END;
$$ LANGUAGE plpgsql;