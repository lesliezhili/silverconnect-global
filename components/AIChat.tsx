'use client';

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { Send, MessageCircle, Phone, X, AlertTriangle } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  language: Language;
  region: 'AU' | 'CN' | 'CA';
}

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'normal' | 'emergency' | 'contact';
}

const EMERGENCY_KEYWORDS = [
  'emergency', 'urgent', 'help', 'danger', 'accident', 'fall', 'pain',
  'medical', 'hospital', 'ambulance', 'police', 'fire', 'crisis'
];

const CONTACT_INFO = {
  whatsapp: '+61452409228',
  wechat: '+61452409228',
  china_work: '+8618271390346',
  au_support: '+61452409228',
  ca_support: '+16042486604'
};

const EMERGENCY_LINES: Record<'AU' | 'CN' | 'CA', string> = {
  AU: '000',
  CN: '110 / 120 / 119',
  CA: '911'
};

export default function AIChat({ isOpen, onClose, user, language, region }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [retryAttempted, setRetryAttempted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const t = (key: string) => (translations[language] as any)[key] || key;

  useEffect(() => {
    if (isOpen) {
      initializeChat();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const initializeChat = () => {
    const welcomeMessage: Message = {
      id: '1',
      text: getWelcomeMessage(),
      isUser: false,
      timestamp: new Date(),
      type: 'normal'
    };
    setMessages([welcomeMessage]);
  };

  const getWelcomeMessage = (): string => {
    const messages = {
      en: `Hello! I'm SilverConnect AI, your 24/7 customer service assistant. I can help you with:

• Booking management (create, cancel, modify)
• Service information and pricing
• Emergency support
• Account questions

How can I assist you today?`,
      zh: `您好！我是SilverConnect AI，您的24小时客户服务助手。我可以帮助您：

• 预订管理（创建、取消、修改）
• 服务信息和价格查询
• 紧急支持
• 账户问题

今天我可以如何帮助您？`
    };
    return messages[language] || messages.en;
  };

  const checkForEmergency = (message: string): boolean => {
    const lowerMessage = message.toLowerCase();
    return EMERGENCY_KEYWORDS.some(keyword => lowerMessage.includes(keyword));
  };

  const sendMessage = async () => {
    const messageText = inputMessage.trim();
    if (!messageText || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      isUser: true,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setRetryAttempted(false);
    setIsLoading(true);

    // Check for emergency keywords
    const emergencyDetected = checkForEmergency(messageText);
    setIsEmergency(emergencyDetected);

    const sendToAI = async (attempt = 0): Promise<void> => {
      try {
        const response = await fetch('/api/ai-customer-service', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: messageText,
            user_id: user?.id,
            language,
            region,
            contact_method: 'web'
          }),
        });

        const data = await response.json();

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.response,
          isUser: false,
          timestamp: new Date(),
          type: emergencyDetected ? 'emergency' : 'normal'
        };

        setMessages(prev => [...prev, aiMessage]);

        // If emergency, show contact info
        if (emergencyDetected) {
          setTimeout(() => {
            const emergencyMessage: Message = {
              id: (Date.now() + 2).toString(),
              text: getEmergencyContacts(),
              isUser: false,
              timestamp: new Date(),
              type: 'contact'
            };
            setMessages(prev => [...prev, emergencyMessage]);
          }, 1000);
        }
      } catch (error) {
        if (attempt === 0) {
          setRetryAttempted(true);
          await delay(700);
          await sendToAI(1);
          return;
        }

        console.error('Error sending message:', error);

        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: getErrorMessage(),
          isUser: false,
          timestamp: new Date(),
          type: 'emergency'
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    };

    await sendToAI();
    setIsLoading(false);
  };

  const getEmergencyContacts = (): string => {
    const contacts = {
      en: `🚨 EMERGENCY CONTACTS:

WhatsApp: ${CONTACT_INFO.whatsapp}
WeChat: ${CONTACT_INFO.wechat}

Local Emergency Lines:
• Australia: ${EMERGENCY_LINES.AU}
• China: ${EMERGENCY_LINES.CN}
• Canada: ${EMERGENCY_LINES.CA}

Please call emergency services immediately if this is life-threatening.`,
      zh: `🚨 紧急联系方式：

WhatsApp: ${CONTACT_INFO.whatsapp}
微信: ${CONTACT_INFO.wechat}

本地紧急电话：
• 澳大利亚: ${EMERGENCY_LINES.AU}
• 中国: ${EMERGENCY_LINES.CN}
• 加拿大: ${EMERGENCY_LINES.CA}

如果这是危及生命的情况，请立即拨打紧急服务。`
    };
    return contacts[language] || contacts.en;
  };

  const getErrorMessage = (): string => {
    const messages = {
      en: 'Our AI assistant is temporarily unavailable. Please contact support by email at zhili@phledger.com or call our support line +61452409228. For emergencies, use the local emergency number for your region.',
      zh: '我们的 AI 助手暂时不可用。请通过 zhili@phledger.com 联系支持，或拨打 +61452409228。紧急情况请拨打您所在地区的本地紧急电话。'
    };
    return messages[language] || messages.en;
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md h-[600px] flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gradient-to-r from-green-500 to-blue-500 text-white rounded-t-lg">
          <div className="flex items-center gap-2">
            <MessageCircle size={20} />
            <div>
              <h2 className="text-lg font-bold">SilverConnect AI</h2>
              <p className="text-xs opacity-90">24/7 Customer Support</p>
            </div>
          </div>
          {isEmergency && (
            <div className="flex items-center gap-1 bg-red-600 px-2 py-1 rounded-full">
              <AlertTriangle size={14} />
              <span className="text-xs font-bold">EMERGENCY</span>
            </div>
          )}
          <button onClick={onClose} className="text-white hover:bg-white/20 rounded-full p-1">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.isUser
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : msg.type === 'emergency'
                    ? 'bg-red-100 text-red-900 border border-red-300 rounded-bl-none'
                    : msg.type === 'contact'
                    ? 'bg-yellow-100 text-yellow-900 border border-yellow-300 rounded-bl-none'
                    : 'bg-gray-200 text-gray-900 rounded-bl-none'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                <p className="text-xs mt-1 opacity-70">
                  {msg.timestamp.toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-200 text-gray-900 rounded-lg rounded-bl-none px-4 py-2">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                  <span className="text-sm">AI is typing...</span>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t p-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={language === 'zh' ? '输入您的消息...' : 'Type your message...'}
              className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={isLoading || !inputMessage.trim()}
              className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              <Send size={20} />
            </button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>24/7 AI Support</span>
            <div className="flex items-center gap-1">
              <Phone size={12} />
              <span>{language === 'zh' ? '紧急号码' : 'Emergency:'} {EMERGENCY_LINES[region]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
