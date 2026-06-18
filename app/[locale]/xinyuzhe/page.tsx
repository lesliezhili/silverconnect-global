\
'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState } from 'react'

const PKGS = [
  {
    icon: '\u{1F4AC}',
    name: 'AI \u5fc3\u8bed\u964a\u4f34',
    price: '\u00a5299/\u6708',
    desc: '\u6bcf\u65e5\u8bed\u97f3\u964a\u4f34\u3001\u60c5\u7eea\u652f\u6301\u4e0e\u8bb0\u5fc6\u6fc0\u6d3b\uff0c\u7531 AI \u4e0e\u8ba4\u8bc1\u5fc3\u8bed\u8005\u5171\u540c\u63d0\u4f9b\u3002',
    badge: '\u6700\u53d7\u6b22\u8fce',
    bcls: 'bg-rose-100 text-rose-700',
  },
  {
    icon: '\u{1F4D6}',
    name: '\u6570\u5b57\u4f20\u8bb0',
    price: '\u8d77\u4ef7 \u00a530,000',
    desc: '\u4e13\u4e1a\u56e2\u961f\u91c7\u96c6\u5e76\u5236\u4f5c\u60a8\u6216\u5bb6\u4eba\u7684\u4eba\u751f\u6545\u4e8b\u6570\u5b57\u6863\u6848\u3002',
    badge: '\u5b9a\u5236\u670d\u52a1',
    bcls: 'bg-amber-100 text-amber-700',
  },
  {
    icon: '\u{1F3E5}',
    name: '\u60c5\u611f\u8bc4\u4f30\u548c\u8bfe',
    price: '\u9996\u6b21\u514d\u8d39',
    desc: '\u7531\u6301\u8bc1\u5fc3\u8bed\u8005\u8fdb\u884c\u9996\u6b21\u60c5\u611f\u5065\u5eb7\u8bc4\u4f30\uff0c\u5236\u5b9a\u4e2a\u6027\u5316\u964a\u4f34\u65b9\u6848\u3002',
    badge: '\u65b0\u7528\u6237\u4e13\u4eab',
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
          \u2190 \u8fd4\u56de\u9996\u9875
        </Link>
        <span className="font-semibold text-gray-900 text-sm flex-1 text-center">
          \u548c\u6da6\u5fc3\u8bed\u8005
        </span>
        <span className="text-sm opacity-0">\u2190</span>
      </div>

      {/* Hero */}
      <section className="px-4 py-6 text-center">
        <div className="text-5xl mb-2">\u{1F338}</div>
        <h1 className="text-xl font-bold text-gray-900 mb-1">\u548c\u6da6\u5fc3\u8bed\u8005</h1>
        <p className="text-rose-600 text-sm font-medium">\u60c5\u611f\u667a\u80fd\u4e0e\u6570\u5b57\u751f\u547d\u670d\u52a1</p>
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
            \u{1F6CE} \u9884\u7ea6\u670d\u52a1
          </button>
          <button
            onClick={() => setTab('provider')}
            className={`flex-1 py-2.5 rounded-full text-sm font-medium transition-colors ${
              tab === 'provider' ? 'bg-white shadow-sm text-rose-600' : 'text-gray-500'
            }`}
          >
            \u{1F33F} \u52a0\u5165\u56e2\u961f
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
                  href={`/${locale}/bookings/new?service=xinyuzhe`}
                  className="bg-rose-500 text-white text-xs px-4 py-2 rounded-full font-medium hover:bg-rose-600 active:scale-95 transition-all"
                >
                  \u7acb\u5373\u9884\u7ea6
                </Link>
              </div>
            </div>
          ))}
          <p className="text-center text-xs text-gray-400 py-4">
            \u548c\u8be2\u8bf7\u53d1\u90ae\u4ef6\u81f3 hello@silverconnect.app
          </p>
        </section>
      ) : (
        <section className="px-4 space-y-4">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5">
            <h2 className="font-bold text-rose-800 mb-2 text-sm">\u{1F33F} \u6210\u4e3a\u5fc3\u8bed\u8005</h2>
            <p className="text-xs text-gray-700 mb-4 leading-relaxed">
              \u8bf8\u9080\u533b\u5b66\u3001\u62a4\u7406\u3001\u5fc3\u7406\u4e0e\u793e\u5de5\u5b66\u79d1\u5728\u6821\u751f\u53ca\u6bd5\u4e1a\u751f\uff0c
              \u4e3a\u72ec\u5c45\u8001\u4eba\u4e0e\u6162\u75c5\u60a3\u8005\u63d0\u4f9b\u4e13\u4e1a\u60c5\u611f\u964a\u4f34\u670d\u52a1\u3002
            </p>
            <ul className="text-xs text-gray-600 space-y-2 mb-5">
              <li>\u2705 \u5fc3\u8bed\u8005\u4e13\u4e1a\u8ba4\u8bc1\u8bc1\u4e66</li>
              <li>\u2705 800 \uff5e 1,500 \u5143/\u671f\u5b9e\u4e60\u8865\u8d34</li>
              <li>\u2705 \u5408\u4f5c\u4e09\u7532\u533b\u9662\u5b9e\u4e60\u673a\u4f1a</li>
              <li>\u2705 5 \u5927\u6838\u5fc3\u6a21\u5757\uff0819 \u8bfe\u65f6\uff09</li>
            </ul>
            <Link
              href={`/${locale}/xinyuzhe/register`}
              className="block bg-rose-600 text-white text-center py-3 rounded-xl text-sm font-semibold hover:bg-rose-700 transition-colors mb-3"
            >
              \u{1F4DD} \u7533\u8bf7\u6ce8\u518c\u5fc3\u8bed\u8005
            </Link>
            <Link
              href={`/${locale}/xinyuzhe/training`}
              className="block border border-rose-300 text-rose-600 text-center py-3 rounded-xl text-sm font-semibold hover:bg-rose-50 transition-colors"
            >
              \u{1F393} \u67e5\u770b\u57f9\u8bad\u8bfe\u7a0b\uff0819 \u5c0f\u65f6\uff09
            </Link>
          </div>

          <div className="border border-gray-200 rounded-2xl p-4">
            <p className="text-xs text-gray-500 font-medium mb-2 px-1">\u5df2\u662f\u5fc3\u8bed\u8005\uff1f</p>
            {[
              { href: `/${locale}/xinyuzhe/hub`,            label: '\u670d\u52a1\u8005\u7ba1\u7406\u4e2d\u5fc3' },
              { href: `/${locale}/xinyuzhe/implementation`, label: '\u670d\u52a1\u5b9e\u65bd\u534f\u8bae' },
              { href: `/${locale}/xinyuzhe/feedback`,       label: '\u63d0\u4ea4\u670d\u52a1\u53cd\u9988' },
            ].map((item, i) => (
              <div key={item.href}>
                {i > 0 && <div className="border-t border-gray-100 my-0.5" />}
                <Link
                  href={item.href}
                  className="flex items-center justify-between py-2.5 px-1 text-gray-700 hover:text-rose-600 transition-colors"
                >
                  <span className="text-sm">{item.label}</span>
                  <span className="text-gray-300 text-xs">\u2192</span>
                </Link>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
