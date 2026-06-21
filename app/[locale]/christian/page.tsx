'use client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const SERVICES = [
  {
    icon: '📖',
    title: '免费查经',
    desc: '每周小组查经，资深导师带领，线上线下均可参加。',
    cta: '我要加入',
  },
  {
    icon: '🙏',
    title: '祈祷小组',
    desc: '小型祈祷圈，互相代祈，信心相透，支持同行。',
    cta: '加入小组',
  },
  {
    icon: '✝️',
    title: '牧师探访',
    desc: '有资质牧师上门探望老年教友，灵魂关怀。',
    cta: '预约探访',
  },
]

export default function ChristianPage() {
  const params = useParams()
  const locale = (params?.locale as string) || 'zh'

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 to-yellow-600 text-white px-6 py-12 text-center">
        <div className="text-5xl mb-3">✝️</div>
        <h1 className="text-3xl font-bold mb-2">基督徒互助平台</h1>
        <p className="text-amber-100 text-lg">山上之城，库不能被躅没。【3:17】</p>
      </div>

      {/* Services */}
      <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
        <p className="text-center text-gray-500 text-sm mb-6">为老年基督徒提供灵魂关怀服务，免费参加</p>
        {SERVICES.map((s) => (
          <div key={s.title} className="bg-white rounded-2xl shadow-sm border border-amber-100 p-6 flex items-start gap-4">
            <div className="text-4xl">{s.icon}</div>
            <div className="flex-1">
              <h2 className="font-bold text-amber-900 text-lg">{s.title}</h2>
              <p className="text-gray-500 text-sm mt-1">{s.desc}</p>
            </div>
            <button className="text-amber-600 font-semibold text-sm hover:text-amber-800 whitespace-nowrap">
              {s.cta} →
            </button>
          </div>
        ))}

        {/* Community note */}
        <div className="bg-amber-50 rounded-2xl p-6 text-center mt-6">
          <p className="text-amber-800 font-medium">微信扫码加入社群</p>
          <div className="w-24 h-24 bg-amber-200 rounded-xl mx-auto mt-3 flex items-center justify-center text-amber-600 text-sm">
            WeChat QR
          </div>
          <p className="text-xs text-gray-400 mt-2">扫码后发送 "基督徒服务" 加入服务小组</p>
        </div>

        <div className="text-center pt-4">
          <Link href={`/${locale}`} className="text-sm text-gray-400 hover:text-amber-700">← 返回首页</Link>
        </div>
      </div>
    </main>
  )
}
