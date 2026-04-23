'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AIChat from '@/components/AIChat';
import SignupModal from '@/components/SignupModal';
import { supabase } from '@/lib/supabase';
import { Language, translations } from '@/lib/translations';
import { Phone, MessageSquare, AlertCircle } from 'lucide-react';

export default function SupportPage() {
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<any>(null);
  const [selectedCountry, setSelectedCountry] = useState({ code: 'AU', name: 'Australia', flag: '🇦🇺', currency: 'AUD' });
  const [showAIChat, setShowAIChat] = useState(true);
  const [showSignup, setShowSignup] = useState(false);

  const t = (key: string) => (translations[language] as any)[key] || key;

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      setUser(sessionUser);
    };
    checkUser();

    // Set language from localStorage
    const savedLanguage = localStorage.getItem('language') as Language;
    if (savedLanguage) setLanguage(savedLanguage);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Header 
        user={user} 
        countryInfo={selectedCountry}
        language={language}
        onSignInClick={() => setShowSignup(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Phone className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">
              {language === 'zh' ? '24/7 支持' : '24/7 Support'}
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-4">
            {language === 'zh' 
              ? '我们随时准备帮助您。通过我们的 AI 助手或联系我们的支持团队。'
              : 'We are here to help you anytime. Get support through our AI assistant or contact our support team.'}
          </p>
          <div className="flex justify-center">
            <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
              {language === 'zh' ? '返回首页' : 'Back to Home'}
            </Link>
          </div>
        </div>

        {/* Support Options Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* AI Chat Support */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-blue-200 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? 'AI 助手' : 'AI Assistant'}
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '获得即时的 AI 驱动的支持和答案。'
                : 'Get instant AI-powered support and answers.'}
            </p>
            <button
              onClick={() => setShowAIChat(true)}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition font-medium"
            >
              {language === 'zh' ? '开始对话' : 'Start Chat'}
            </button>
          </div>

          {/* Email Support */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 rounded-full">
                <MessageSquare className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '电子邮件' : 'Email Support'}
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '通过电子邮件与我们的支持团队联系。'
                : 'Contact our support team via email.'}
            </p>
            <a
              href="mailto:support@silverconnect.com"
              className="w-full block text-center bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition font-medium"
            >
              {language === 'zh' ? '发送邮件' : 'Send Email'}
            </a>
          </div>

          {/* Phone Support */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-purple-100 rounded-full">
                <Phone className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '电话支持' : 'Phone Support'}
              </h3>
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '直接与我们的团队通话。'
                : 'Speak directly with our team.'}
            </p>
            <a
              href="tel:+61234567890"
              className="w-full block text-center bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition font-medium"
            >
              {language === 'zh' ? '拨打电话' : 'Call Now'}
            </a>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-blue-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'zh' ? '常见问题' : 'Frequently Asked Questions'}
          </h2>
          <div className="space-y-4">
            {[
              {
                en: 'How long does it take to get a response?',
                zh: '需要多长时间才能获得回复？',
                answerEn: 'Our AI assistant provides instant responses 24/7. For email support, we typically respond within 24 hours.',
                answerZh: '我们的 AI 助手全天候提供即时回复。对于电子邮件支持，我们通常在 24 小时内回复。'
              },
              {
                en: 'What languages do you support?',
                zh: '您支持哪些语言？',
                answerEn: 'We support English and Simplified Chinese. Our AI assistant can handle both languages.',
                answerZh: '我们支持英语和简体中文。我们的 AI 助手可以处理两种语言。'
              },
              {
                en: 'Can I track my service booking?',
                zh: '我可以追踪我的服务预订吗？',
                answerEn: 'Yes, you can track your booking status in your account dashboard. Updates are sent via email and SMS.',
                answerZh: '是的，您可以在您的账户仪表板中追踪您的预订状态。更新通过电子邮件和短信发送。'
              }
            ].map((faq, idx) => (
              <details key={idx} className="bg-white rounded-lg p-4 cursor-pointer hover:bg-gray-50 transition">
                <summary className="font-semibold text-gray-900 flex items-center gap-2">
                  <span>{language === 'zh' ? faq.zh : faq.en}</span>
                </summary>
                <p className="text-gray-600 mt-2 ml-4">
                  {language === 'zh' ? faq.answerZh : faq.answerEn}
                </p>
              </details>
            ))}
          </div>
        </div>
      </main>

      {/* AI Chat Modal */}
      <AIChat
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
        user={user}
        language={language}
        region={selectedCountry.code as 'AU' | 'CN' | 'CA'}
      />

      <SignupModal
        isOpen={showSignup}
        onClose={() => setShowSignup(false)}
        country={selectedCountry.code}
        language={language}
      />
    </div>
  );
}
