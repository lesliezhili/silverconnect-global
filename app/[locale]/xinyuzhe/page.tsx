'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

const PKGS = [
  {
    icon: '💬',
    name: 'AI 心语陊伴',
    price: '¥299/月',
    desc: '每日语音陊伴、情绪支持与记忆激活，由 AI 与认证心语者共同提供。',
    badge: '最受欢迎',
    bcls: 'bg-rose-100 text-rose-700',
  },
  {
    icon: '📖',
    name: '数字传记',
    price: '起价 ¥30,000',
    desc: '专业团队采集并制作您或家人的人生故事数字档案。',
    badge: '定制服务',
    bcls: 'bg-amber-100 text-amber-700',
  },
  {
    icon: '🏥',
    name: '情感评估和课',
    price: '首次免费',
    desc: '由持证心语者进行首次情感健康评估，制定个性化陊伴方案。',
    badge: '新用户专享',
    bcls: 'bg-green-100 text-green-700',
  },
]

export default function XinyuzhePage() {
  const params = useParams<{ locale: string }>()
  const locale = (params?.locale as string) || 'zh'
  const [tab, setTab] = useState<'customer' | 'provider'>('customer')

  return (
    <main className="min-h-screen bg-white font-sans pb-24">

      {/* Sticky back bar */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center gap-3">
        <Link
          href={`/${locale}/home`}
          className="text-sm text-gray-500 hover:text-rose-600 transition-colors"
        >
          ← 返回首页
        </Link>
        <span className="font-semibold text-gray-900 text-sm flex-1 text-center">
          和润心语者
        </span>
        <span className="text-sm opacity-0">←</span>
      </div>

      {/* Hero */}
      <section className="px-4 py-6 text-center">
        <div className="text-5xl mb-2">🌸</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">和润心语者</h1>
        <p className="text-rose-600 text-sm font-medium">情感智能与数字生命服务</p>
      </section>

      {/* Role toggle */}
      <div className="px-4 mb-6">
        <div className="flex bg-gray-100 rounded-full p-1">
          <button
            onClick={() => setTab('customer')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === 'customer' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'
            }`}
          >
            🛎 预约服务
          </button>
          <button
            onClick={() => setTab('provider')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === 'provider' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'
            }`}
          >
            🌿 加入团队
          </button>
        </div>
      </div>

      {tab === 'customer' ? (
        <section className="px-4 space-y-4">
          {PKGS.map((pkg) => (
            <div key={pkg.name} className="border border-gray-200 rounded-2xl p-5">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-3xl shrink-0">{pkg.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h3 className="font-bold text-gray-900 text-sm">{pkg.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${pkg.bcls}`}>
                      {pkg.badge}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed">{pkg.desc}</p>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <span className="font-bold text-rose-600 text-sm">{pkg.price}</span>
                <Link
                  href={`/${locale}/xinyuzhe/book?service=xinyuzhe`}
                  className="bg-rose-500 text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-rose-600 active:scale-95 transition-all"
                >
                  立即预约
                </Link>
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400 py-4">
            和询请发邮件至 hello@silverconnect.app
          </p>
        </section>
      ) : (
        <section className="px-4 space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <h2 className="font-bold text-rose-800 mb-2 text-sm">🌿 成为心语者</h2>
            <p className="text-xs text-gray-700 mb-4 leading-relaxed">
              诸邀医学、护理、心理与社工学科在校生及毕业生，
              为独居老人与慢病患者提供专业情感陊伴服务。
            </p>
            <ul className="text-xs text-gray-600 space-y-2 mb-5">
              <li>✅ 心语者专业认证证书</li>
              <li>✅ 800 ～ 1,500 元/期实习补贴</li>
              <li>✅ 合作三甲医院实习机会</li>
              <li>✅ 5 大核心模块（19 课时）</li>
            </ul>
            <Link
              href={`/${locale}/xinyuzhe/register`}
              className="block bg-rose-600 text-white text-center py-3 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors mb-3"
            >
              📝 申请注册心语者
            </Link>
            <Link
              href={`/${locale}/xinyuzhe/training`}
              className="block border border-rose-300 text-rose-600 text-center py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
            >
              🎓 查看培训课程（19 小时）
            </Link>
          </div>

          <div className="border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2 px-1">已是心语者？</p>
            {[
              { href: `/${locale}/xinyuzhe/hub`,            label: '服务者管理中心' },
              { href: `/${locale}/xinyuzhe/implementation`, label: '服务实施协议' },
              { href: `/${locale}/xinyuzhe/feedback`,       label: '提交服务反馈' },
            ].map((item, i) => (
              <div key={item.href}>
                {i > 0 && <div className="border-t border-gray-100 my-0.5" />}
                <Link
                  href={item.href}
                  className="flex items-center justify-between py-2.5 px-1 text-gray-700 hover:text-rose-600 transition-colors"
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-gray-300 text-xs">→</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
