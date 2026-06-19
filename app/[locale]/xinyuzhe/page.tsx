'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'

type Pkg = { id: string; icon: string; title: string; price: string; desc: string; popular: boolean }

const PACKAGES: Pkg[] = [
  {
    id: 'ai_companion',
    icon: '🤖',
    title: 'AI 伴侣',
    price: '￥299 / 月',
    desc: '7×24小时 AI 情感陪伴，随时倾听，永不厌倦',
    popular: true,
  },
  {
    id: 'digital_biography',
    icon: '📖',
    title: '数字传记',
    price: '￥3,999 起',
    desc: '专业团队协助整理人生故事，留存珍贵记忆',
    popular: false,
  },
  {
    id: 'grief_support',
    icon: '🕊️',
    title: '哀伤陪伴',
    price: '￥600 / 次',
    desc: '认证心语者一对一哀伤疏导，专业温暖',
    popular: false,
  },
  {
    id: 'group_healing',
    icon: '🌸',
    title: '团体疗愈',
    price: '￥199 / 人',
    desc: '小组心灵工作坊，在共同陪伴中获得力量',
    popular: false,
  },
  {
    id: 'insurance_plus',
    icon: '🛡️',
    title: '保险增值',
    price: '定制报价',
    desc: '结合保险保障的综合心理健康支持方案',
    popular: false,
  },
]

export default function XinyuzhePage() {
  const params = useParams() as { locale: string }
  const locale = params?.locale ?? 'zh'

  return (
    <main className="min-h-screen bg-gradient-to-b from-pink-50 to-purple-50">

      {/* Hero */}
      <section className="text-center px-6 py-16 bg-gradient-to-br from-pink-100 to-purple-100">
        <div className="text-6xl mb-4">🌸</div>
        <h1 className="text-4xl font-bold text-purple-900 mb-3">和润心语者</h1>
        <p className="text-xl text-purple-700 mb-2">为长辈而生的心灵陪伴服务</p>
        <p className="text-sm text-purple-600 max-w-md mx-auto mb-8">
          专业认证的心语者陪伴您或您的家人，走过人生每一个重要时刻
        </p>
        <Link
          href={"/" + locale + "/xinyuzhe/book"}
          className="inline-block bg-purple-700 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-purple-800 transition-colors"
        >
          立即预约咋询 →
        </Link>
      </section>

      {/* Service Packages */}
      <section className="px-6 py-12 max-w-5xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-purple-900 mb-8">服务套餐</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={"relative bg-white rounded-xl p-6 shadow-sm border " +
                (pkg.popular ? "border-purple-500 ring-1 ring-purple-200" : "border-purple-100")}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-5 bg-purple-600 text-white text-xs px-3 py-1 rounded-full">
                  最受欢迎
                </span>
              )}
              <div className="text-4xl mb-3">{pkg.icon}</div>
              <h3 className="text-lg font-bold text-purple-900 mb-1">{pkg.title}</h3>
              <p className="text-2xl font-bold text-purple-600 mb-2">{pkg.price}</p>
              <p className="text-sm text-gray-500 mb-4">{pkg.desc}</p>
              <Link
                href={"/" + locale + "/xinyuzhe/book?service=" + pkg.id}
                className="block text-center bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold py-2 rounded-lg text-sm transition-colors"
              >
                了解详情 / 预约
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Become a Provider */}
      <section className="bg-purple-50 py-12 px-6 text-center">
        <h2 className="text-2xl font-bold text-purple-900 mb-2">成为认证心语者</h2>
        <p className="text-sm text-gray-500 max-w-sm mx-auto mb-6">
          有心理咋询、社工或老年护理背景？加入我们，以专业助力长辈心灵健康
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            href={"/" + locale + "/xinyuzhe/training"}
            className="bg-purple-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-800 transition-colors"
          >
            查看认证培训课程
          </Link>
          <Link
            href={"/" + locale + "/xinyuzhe/registration"}
            className="border-2 border-purple-700 text-purple-700 px-6 py-3 rounded-lg font-semibold hover:bg-white transition-colors"
          >
            注册成为心语者
          </Link>
        </div>
      </section>

      {/* Investor footer */}
      <div className="text-center py-5 text-xs text-gray-400">
        <Link href={"/" + locale + "/xinyuzhe/about"} className="underline hover:text-gray-600">
          投资者 / 合作伙伴信息
        </Link>
      </div>

    </main>
  )
}
