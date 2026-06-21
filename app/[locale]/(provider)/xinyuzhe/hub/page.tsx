import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { getAuthSession } from '@/lib/auth/session'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'

export const metadata = {
  title: '\u548c\u6da6\u5fc3\u8bed\u8005 \u2014 \u670d\u52a1\u63d0\u4f9b\u8005\u4e2d\u5fc3',
  description: '\u548c\u6da6\u5fc3\u8bed\u8005\u670d\u52a1\u63d0\u4f9b\u8005\u7ba1\u7406\u4e2d\u5fc3\uff1a\u6ce8\u518c\u3001\u57f9\u8bad\u3001\u670d\u52a1\u7ba1\u7406\u4e0e\u53cd\u9988\u8bc4\u4ef7',
}

const TILES = [
  {
    href:    'xinyuzhe/register',
    icon:    '\ud83d\udcdd',
    title:   '\u5fc3\u8bed\u8005\u7533\u8bf7\u6ce8\u518c',
    desc:    '\u63d0\u4ea4\u60a8\u7684\u4e2a\u4eba\u4fe1\u606f\u3001\u5b66\u5386\u80cc\u666f\u4e0e\u670d\u52a1\u65b9\u5411\uff0c\u7533\u8bf7\u52a0\u5165\u548c\u6da6\u5fc3\u8bed\u8005\u56e2\u961f\u3002',
    bg:      'bg-rose-50',
    border:  'border-rose-200',
    badge:   '\u5f00\u653e\u62db\u52df\u4e2d',
    badgeCls:'bg-green-100 text-green-700',
  },
  {
    href:    'xinyuzhe/training',
    icon:    '\ud83c\udf93',
    title:   '\u5fc3\u8bed\u8005\u57f9\u8bad\u8bfe\u7a0b',
    desc:    '5 \u5927\u6838\u5fc3\u6a21\u5757\uff1a\u60c5\u611f\u964a\u4f34\u3001\u6570\u5b57\u4f20\u8bb0\u3001\u8001\u5e74\u5fc3\u7406\u3001\u4fdd\u9669\u670d\u52a1\u3001\u5b89\u5168\u5408\u89c4\u3002\u7b80\u4e3b\u8bfe\u7a0b\u5e76\u83b7\u5f97\u8ba4\u8bc1\u3002',
    bg:      'bg-amber-50',
    border:  'border-amber-200',
    badge:   '32 \u5c0f\u65f6',
    badgeCls:'bg-amber-100 text-amber-700',
  },
  {
    href:    'xinyuzhe/implementation',
    icon:    '\ud83d\uddd3\ufe0f',
    title:   '\u670d\u52a1\u5b9e\u65bd\u7ba1\u7406',
    desc:    '\u67e5\u770b\u5df2\u5206\u914d\u5ba2\u6237\u3001\u5b89\u6392\u670d\u52a1\u65f6\u95f4\u3001\u8bb0\u5f55\u670d\u52a1\u7b14\u8bb0\uff0c\u8ddf\u8e2a\u6bcf\u4e00\u6b21\u7684\u9646\u4f34\u8fdb\u5c55\u3002',
    bg:      'bg-blue-50',
    border:  'border-blue-200',
    badge:   '\u670d\u52a1\u8bb0\u5f55',
    badgeCls:'bg-blue-100 text-blue-700',
  },
  {
    href:    'xinyuzhe/feedback',
    icon:    '\u2b50',
    title:   '\u53cd\u9988\u4e0e\u8bc4\u4ef7',
    desc:    '\u63d0\u4ea4\u6bcf\u6b21\u670d\u52a1\u7ed3\u675f\u540e\u7684\u5ba2\u6237\u53cd\u9988\uff0c\u5e2e\u52a9\u6211\u4eec\u6301\u7eed\u63d0\u5347\u548c\u6da6\u670d\u52a1\u8d28\u91cf\u3002',
    bg:      'bg-purple-50',
    border:  'border-purple-200',
    badge:   '\u8d28\u91cf\u4fdd\u969c',
    badgeCls:'bg-purple-100 text-purple-700',
  },
]

export default async function XinyuzheProviderHubNavPage({
  // Status gate: only approved providers can access hub
  const session = await getAuthSession()
  const localeStr = (await params as { locale: string }).locale || 'zh'
  if (!session) {
    const { redirect } = await import('next/navigation')
    redirect(`/${localeStr}/login`)
  }
  const [providerRecord] = await db
    .select({ status: xinyuzheProviders.status, fullName: xinyuzheProviders.fullName })
    .from(xinyuzheProviders)
    .where(eq(xinyuzheProviders.email, session!.email))
    .limit(1)
  if (!providerRecord) {
    const { redirect } = await import('next/navigation')
    redirect(`/${localeStr}/xinyuzhe/registration`)
  }
  if (providerRecord!.status !== 'approved') {
    return (
      <main className="min-h-screen bg-amber-50 flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-5xl mb-4">{providerRecord!.status === 'pending' ? '⏳' : '❌'}</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            {providerRecord!.status === 'pending' ? '申请审核中' : '申请未通过'}
          </h2>
          <p className="text-gray-500 text-sm">
            {providerRecord!.status === 'pending'
              ? '您的申请正在审核中，通常需需3～5个工作日。通过后将收到邮件通知。'
              : '您可完善资料后重新提交申请。'}
          </p>
          {providerRecord!.status !== 'pending' && (
            <a href={`/${localeStr}/xinyuzhe/registration`}
               className="mt-4 inline-block bg-rose-500 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              重新申请
            </a>
          )}
        </div>
      </main>
    )
  }

  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-r from-rose-600 to-amber-500 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-5xl">\ud83c\udf38</span>
            <div>
              <h1 className="text-3xl font-bold">\u548c\u6da6\u5fc3\u8bed\u8005</h1>
              <p className="text-rose-100 text-sm mt-1">\u670d\u52a1\u63d0\u4f9b\u8005\u7ba1\u7406\u4e2d\u5fc3 \u00b7 SilverConnect \u9280\u9f84\u667a\u8054</p>
            </div>
          </div>
          <p className="text-white/90 max-w-2xl text-base leading-relaxed">
            \u6b22\u8fce\u52a0\u5165\u548c\u6da6\u5fc3\u8bed\u8005\u56e2\u961f\u3002\u6211\u4eec\u7b2c\u4e00\u671f\u62db\u52df\u6765\u81ea\u533b\u5b66\u3001\u62a4\u7406\u3001\u5fc3\u7406\u548c\u793e\u5de5\u5b66\u9662\u7684\u5927\u5b66\u751f\uff0c\n            \u4e3a\u72ec\u5c45\u8001\u4eba\u3001\u6162\u75c5\u60a3\u8005\u63d0\u4f9b\u60c5\u611f\u964a\u4f34\u3001\u6570\u5b57\u4f20\u8bb0\u4e0e\u5fc3\u7406\u652f\u6301\u670d\u52a1\u3002
          </p>
          <div className="flex flex-wrap gap-3 mt-6">
            <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm">\ud83c\udf93 \u5b9e\u4e60\u8ba4\u8bc1</span>
            <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm">\ud83d\udcb0 800\uff5e1500 \u5143/\u671f</span>
            <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm">\ud83c\udfe5 \u5408\u4f5c\u533b\u9662\u5b9e\u4e60</span>
            <span className="bg-white/20 px-3 py-1.5 rounded-full text-sm">\ud83d\udcdc \u5fc3\u8bed\u8005\u8bc1\u4e66</span>
          </div>
        </div>
      </section>

      {/* Navigation Tiles */}
      <section className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-bold text-gray-900 mb-6">\u8bf7\u9009\u62e9\u60a8\u9700\u8981\u7684\u529f\u80fd</h2>
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
                <span className="text-gray-400 group-hover:text-rose-500 transition-colors self-center shrink-0">\u2192</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Program Stats */}
      <section className="py-8 px-4 bg-white border-t border-gray-100">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-gray-700 mb-6">\u548c\u6da6\u5fc3\u8bed\u8005\u9879\u76ee\u8fdb\u5c55</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '\u6ce8\u518c\u5fc3\u8bed\u8005', val: '\u62db\u52df\u4e2d', icon: '\ud83d\udc65' },
              { label: '\u5df2\u5b8c\u6210\u57f9\u8bad', val: '0 / 5 \u6a21\u5757', icon: '\ud83c\udf93' },
              { label: '\u6670\u52a1\u5ba2\u6237', val: '\u5f85\u5206\u914d', icon: '\ud83d\udc64' },
              { label: '\u670d\u52a1\u8bc4\u5206', val: '\u5f85\u53cd\u9988', icon: '\u2b50' },
            ].map((s) => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-4 text-center">
                <div className="text-2xl mb-1">{s.icon}</div>
                <div className="text-lg font-bold text-gray-900">{s.val}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer info */}
      <section className="py-8 px-4">
        <div className="max-w-4xl mx-auto bg-rose-50 rounded-2xl p-6">
          <h3 className="font-bold text-rose-800 mb-3">\ud83d\udcac \u548c\u6da6\u5fc3\u8bed\u8005\u670d\u52a1\u627f\u8bfa</h3>
          <ul className="text-sm text-gray-700 space-y-2">
            <li>\u2705 \u6bcf\u6b21\u670d\u52a1\u5c06\u88ab\u5168\u8fc7\u7a0b\u8bb0\u5f55\uff0c\u4fdd\u969c\u5ba2\u6237\u5b89\u5168\u3002</li>
            <li>\u2705 \u60a8\u7684\u670d\u52a1\u65f6\u95f4\u5c06\u6309 800\uff5e1500 \u5143/\u6708\u6807\u51c6\u53d1\u653e\u5b9e\u4e60\u8865\u8d34\u3002</li>
            <li>\u2705 \u8fc7\u5173\u5168\u90e8\u57f9\u8bad\u6a21\u5757\u540e\uff0c\u5c06\u83b7\u5f97\u548c\u6da6\u5fc3\u8bed\u8005\u8ba4\u8bc1\u8bc1\u4e66\u3002</li>
            <li>\u2705 \u4f18\u79c0\u5fc3\u8bed\u8005\u5c06\u88ab\u63a8\u8350\u81f3\u5408\u4f5c\u533b\u9662\u5168\u804c\u5c97\u4f4d\u3002</li>
          </ul>
        </div>
      </section>

    </main>
  )
}
