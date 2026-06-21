import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getOptionalAuthSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'
import { eq } from 'drizzle-orm'

export const metadata = {
  title: '和润心语者 — 服务提供者中心',
  description: '和润心语者服务提供者管理中心',
}

const TILES = [
  {
    href:     'xinyuzhe/register',
    icon:     '📝',
    title:    '心语者申请注册',
    desc:     '提交您的个人信息、学历背景与服务方向，申请加入和润心语者团队。',
    bg:       'bg-rose-50',
    border:   'border-rose-200',
    badge:    '开放招募中',
    badgeCls: 'bg-green-100 text-green-700',
  },
  {
    href:     'xinyuzhe/training',
    icon:     '🎓',
    title:    '心语者培训课程',
    desc:     '5 大核心模块：情感陊伴、老年心理、数字传记、保险服务、安全合规。',
    bg:       'bg-amber-50',
    border:   'border-amber-200',
    badge:    '32 小时',
    badgeCls: 'bg-amber-100 text-amber-700',
  },
  {
    href:     'xinyuzhe/implementation',
    icon:     '🗓️',
    title:    '服务实施管理',
    desc:     '查看已分配客户、安排服务时间、记录服务笔记。',
    bg:       'bg-blue-50',
    border:   'border-blue-200',
    badge:    '服务记录',
    badgeCls: 'bg-blue-100 text-blue-700',
  },
  {
    href:     'xinyuzhe/feedback',
    icon:     '⭐',
    title:    '反馈与评价',
    desc:     '提交服务结束后的客户反馈，持续提升和润服务质量。',
    bg:       'bg-purple-50',
    border:   'border-purple-200',
    badge:    '质量保障',
    badgeCls: 'bg-purple-100 text-purple-700',
  },
]

export default async function XinyuzheProviderHubNavPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  // Status gate: only approved providers can access hub
  // getOptionalAuthSession returns null when not logged in (getAuthSession never returns null)
  const session = await getOptionalAuthSession()
  const { locale } = await params
  if (!session?.email) redirect(`/${locale}/login`)

  const [pr] = await db
    .select({ status: xinyuzheProviders.status })
    .from(xinyuzheProviders)
    .where(eq(xinyuzheProviders.email, session!.email!))
    .limit(1)

  if (!pr) redirect(`/${locale}/xinyuzhe/registration`)

  if (pr!.status !== 'approved') {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{pr!.status === 'pending' ? '⏳' : '❌'}</div>
          <h2 className="text-xl font-bold mb-2">
            {pr!.status === 'pending' ? '申请审核中' : '申请未通过'}
          </h2>
          <p className="text-gray-500 text-sm mb-4">
            {pr!.status === 'pending'
              ? '您的申请正在审核中，通常需需3～5个工作日。通过后将收到邮件通知。'
              : '您可完善资料后重新提交申请。'}
          </p>
          {pr!.status !== 'pending' && (
            <a href={`/${locale}/xinyuzhe/registration`}
               className="inline-block bg-rose-500 text-white px-6 py-2 rounded-xl text-sm font-semibold">
              重新申请
            </a>
          )}
        </div>
      </main>
    )
  }

  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-gray-50">
      <section className="bg-gradient-to-r from-rose-600 to-amber-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">🌸</span>
            <div>
              <h1 className="text-3xl font-bold">和润心语者</h1>
              <p className="text-rose-100 text-sm mt-1">服务提供者管理中心</p>
            </div>
          </div>
          <p className="text-white/90 max-w-2xl text-base leading-relaxed">
            欢迎加入和润心语者团队，为独居老人提供情感陊伴服务。
          </p>
        </div>
      </section>
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">请选择您需要的功能</h2>
          <div className="grid md:grid-cols-2 gap-5">
            {TILES.map((t) => (
              <Link
                key={t.href}
                href={`/${locale}/${t.href}`}
                className={`${t.bg} border ${t.border} rounded-2xl p-6 flex gap-4 hover:shadow-md transition-all group`}
              >
                <span className="text-4xl shrink-0">{t.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 text-base group-hover:underline">{t.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${t.badgeCls}`}>{t.badge}</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{t.desc}</p>
                </div>
                <span className="text-gray-400 group-hover:text-rose-500 transition-colors self-center shrink-0">→</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
