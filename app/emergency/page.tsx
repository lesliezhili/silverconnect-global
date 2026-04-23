'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import Header from '@/components/Header';
import AIChat from '@/components/AIChat';
import SignupModal from '@/components/SignupModal';
import { supabase } from '@/lib/supabase';
import { Language, translations } from '@/lib/translations';
import { AlertTriangle, Heart, Phone, Clock } from 'lucide-react';

export default function EmergencyPage() {
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
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white">
      <Header 
        user={user} 
        countryInfo={selectedCountry}
        language={language}
        onSignInClick={() => setShowSignup(true)}
      />

      <main className="max-w-6xl mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="text-blue-600 hover:text-blue-800 font-medium">
            {language === 'zh' ? '返回首页' : 'Back to Home'}
          </Link>
        </div>
        {/* Alert Banner */}
        <div className="bg-red-100 border-2 border-red-400 rounded-lg p-6 mb-12 flex gap-4 items-start">
          <AlertTriangle className="w-8 h-8 text-red-600 flex-shrink-0 mt-1" />
          <div>
            <h2 className="text-2xl font-bold text-red-900 mb-2">
              {language === 'zh' ? '紧急服务' : 'Emergency Services'}
            </h2>
            <p className="text-red-800">
              {language === 'zh'
                ? '如果您遇到需要立即关注的问题，我们随时准备帮助。使用下面的选项之一立即获取帮助。'
                : 'If you are facing an issue that requires immediate attention, we are here to help. Use one of the options below to get help right away.'}
            </p>
          </div>
        </div>

        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Heart className="w-10 h-10 text-red-600 animate-pulse" />
            <h1 className="text-4xl font-bold text-gray-900">
              {language === 'zh' ? '24/7 紧急支持' : '24/7 Emergency Support'}
            </h1>
          </div>
          <p className="text-xl text-gray-600">
            {language === 'zh'
              ? '我们在这里帮助您度过任何紧急情况。'
              : 'We are here to help you through any emergency situation.'}
          </p>
        </div>

        {/* Emergency Response Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Instant AI Response */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-300 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full animate-pulse">
                <Heart className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? 'AI 紧急助手' : 'AI Emergency Assistant'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
              <Clock className="w-4 h-4" />
              {language === 'zh' ? '即时回复' : 'Instant Response'}
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '获得即时的 AI 驱动的紧急支持和指导。'
                : 'Get instant AI-powered emergency support and guidance.'}
            </p>
            <button
              onClick={() => setShowAIChat(true)}
              className="w-full bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              {language === 'zh' ? '获取帮助' : 'Get Help Now'}
            </button>
          </div>

          {/* Emergency Hotline */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-300 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Phone className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '紧急热线' : 'Emergency Hotline'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
              <Clock className="w-4 h-4" />
              {language === 'zh' ? '全天候' : '24/7'}
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '立即使用本地紧急电话号码联系当地紧急服务。'
                : 'Call your local emergency number immediately to reach emergency services.'}
            </p>
            <div className="mb-4 text-sm text-gray-700">
              {language === 'zh' ? '本地紧急电话号码：' : 'Local emergency numbers:'}
              <ul className="mt-2 space-y-1 list-disc list-inside">
                <li>🇦🇺 {language === 'zh' ? '澳大利亚: 000' : 'Australia: 000'}</li>
                <li>🇨🇳 {language === 'zh' ? '中国: 110 / 120 / 119' : 'China: 110 / 120 / 119'}</li>
                <li>🇨🇦 {language === 'zh' ? '加拿大: 911' : 'Canada: 911'}</li>
              </ul>
            </div>
            <a
              href="tel:+61234567890"
              className="w-full block text-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              {language === 'zh' ? '呼叫本地支持' : 'Call Local Support'}
            </a>
          </div>

          {/* Priority Email */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-300 hover:shadow-xl transition">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">
                {language === 'zh' ? '优先邮件' : 'Priority Email'}
              </h3>
            </div>
            <div className="flex items-center gap-2 text-green-600 font-semibold mb-4">
              <Clock className="w-4 h-4" />
              {language === 'zh' ? '1 小时回复' : '1 Hour Response'}
            </div>
            <p className="text-gray-600 mb-4">
              {language === 'zh'
                ? '发送优先电子邮件以在 1 小时内获得回复。'
                : 'Send a priority email to get a response within 1 hour.'}
            </p>
            <a
              href="mailto:emergency@silverconnect.com?subject=EMERGENCY"
              className="w-full block text-center bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition font-medium"
            >
              {language === 'zh' ? '发送紧急邮件' : 'Send Emergency Email'}
            </a>
          </div>
        </div>

        {/* Emergency Guidelines */}
        <div className="bg-orange-50 rounded-lg p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'zh' ? '紧急情况处理指南' : 'Emergency Handling Guidelines'}
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold text-orange-600 mb-2">
                {language === 'zh' ? '✓ 应该做什么' : '✓ What To Do'}
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• {language === 'zh' ? '立即使用 AI 助手' : 'Use AI assistant immediately'}</li>
                <li>• {language === 'zh' ? '提供详细的问题描述' : 'Provide detailed problem description'}</li>
                <li>• {language === 'zh' ? '说明您的位置和联系方式' : 'Include your location and contact info'}</li>
                <li>• {language === 'zh' ? '保存所有沟通记录' : 'Keep all communication records'}</li>
              </ul>
            </div>
            <div className="bg-white rounded-lg p-4">
              <h3 className="font-bold text-red-600 mb-2">
                {language === 'zh' ? '✗ 不要做什么' : '✗ What NOT To Do'}
              </h3>
              <ul className="text-gray-700 space-y-2 text-sm">
                <li>• {language === 'zh' ? '不要等待解决' : 'Don\'t wait to resolve'}</li>
                <li>• {language === 'zh' ? '不要隐瞒问题的严重性' : 'Don\'t hide severity of issue'}</li>
                <li>• {language === 'zh' ? '不要提供虚假信息' : 'Don\'t provide false information'}</li>
                <li>• {language === 'zh' ? '不要忽视指导' : 'Don\'t ignore guidance'}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Common Emergency Issues */}
        <div className="bg-gray-50 rounded-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {language === 'zh' ? '常见紧急情况' : 'Common Emergency Issues'}
          </h2>
          <div className="space-y-4">
            {[
              {
                en: 'Service Provider No-Show',
                zh: '服务提供者未按时出现',
                descEn: 'Your service provider did not arrive at the scheduled time',
                descZh: '您的服务提供者没有在规定时间到达'
              },
              {
                en: 'Safety or Security Concern',
                zh: '安全或安保问题',
                descEn: 'You have a safety or security concern during or after service',
                descZh: '您在服务期间或之后有安全或安保问题'
              },
              {
                en: 'Property Damage',
                zh: '财产损害',
                descEn: 'Property was damaged during the service',
                descZh: '在服务期间财产被损坏'
              },
              {
                en: 'Billing Issue',
                zh: '计费问题',
                descEn: 'You were charged incorrectly or unexpectedly',
                descZh: '您被错误地或意外收费'
              }
            ].map((issue, idx) => (
              <div key={idx} className="bg-white rounded-lg p-4 border-l-4 border-red-400">
                <h3 className="font-bold text-gray-900">
                  {language === 'zh' ? issue.zh : issue.en}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {language === 'zh' ? issue.descZh : issue.descEn}
                </p>
              </div>
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
