import { setRequestLocale } from 'next-intl/server'
import Link from 'next/link'
import { IMPLEMENTATION_PROTOCOLS } from '@/lib/types/xinyuzhe'

export const metadata = {
  title: '服务实施工具第 — 和润心语者',
}

const COLOR_HDR: Record<string, string> = {
  blue:  'bg-blue-600',
  green: 'bg-green-600',
  red:   'bg-red-600',
  amber: 'bg-amber-600',
}
const COLOR_BADGE: Record<string, string> = {
  blue:  'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red:   'bg-red-100 text-red-800',
  amber: 'bg-amber-100 text-amber-800',
}

export default async function XinyuzheImplementationPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* 标题 */}
        <div className="mb-8">
          <Link href={`/${locale}/xinyuzhe`} className="text-sm text-gray-400 hover:text-gray-600 mb-3 inline-block">
            ← 和润心语者中心
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-4xl">🗓️</span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">服务实施工具第</h1>
              <p className="text-gray-500 text-sm">和润心语者 · 老年心理健康服务 · 标准操作协议</p>
            </div>
          </div>
        </div>

        {/* 冥想提示 */}
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-8">
          <p className="text-rose-800 text-sm font-medium">💗 和润心语者的使命：</p>
          <p className="text-rose-700 text-sm mt-1 leading-relaxed">
            我们不是其他任何人的替代品——我们是长者信任的那个声音。
            我们不提供诊断，不给建议，只是指引和陊伴。
          </p>
        </div>

        {/* 协议列表 */}
        <div className="space-y-6">
          {IMPLEMENTATION_PROTOCOLS.map(proto => (
            <div key={proto.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {/* 协议标题 */}
              <div className={`${COLOR_HDR[proto.color]} px-6 py-4 flex items-center gap-3`}>
                <span className="text-2xl">{proto.icon}</span>
                <div>
                  <h2 className="font-bold text-white text-lg">{proto.title}</h2>
                  <p className="text-white/80 text-xs">{proto.description}</p>
                </div>
                <span className={`ml-auto text-xs px-3 py-1 rounded-full font-medium ${COLOR_BADGE[proto.color]}`}>
                  {proto.steps.length} 步
                </span>
              </div>
              {/* 步骤列表 */}
              <div className="px-6 py-5">
                <ol className="space-y-3">
                  {proto.steps.map((step, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-100 text-gray-600 text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-gray-700 leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          ))}
        </div>

        {/* 质量指标 */}
        <div className="mt-8 bg-amber-50 rounded-2xl p-6">
          <h2 className="font-bold text-amber-900 mb-4">📊 会话质量自检清单</h2>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              '是否确认知情同意书已签署',
              '是否记录了客户情绪状态评分（每次必填）',
              '是否使用了积极倾听技巧',
              '是否避免给出建议或判断',
              '是否在临时结束前提醒并确认下次时间',
              '是否完成了系统内的服务笔记',
              '高风险信号是否开启了危机响应流程',
              '个人隐私保护：未存入非工作设备',
            ].map((item, i) => (
              <label key={i} className="flex items-start gap-2 p-3 bg-white rounded-xl cursor-pointer hover:bg-amber-50 transition">
                <input type="checkbox" className="mt-0.5 rounded" />
                <span className="text-sm text-gray-700">{item}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 紧急联系 */}
        <div className="mt-6 bg-red-50 border border-red-200 rounded-2xl p-6">
          <h2 className="font-bold text-red-900 mb-3">🚨 紧急联系号码</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-red-700">防自杀热线</p>
              <p className="text-2xl font-bold text-red-600">400-161-9995</p>
              <p className="text-xs text-gray-400">24小时 · 全国免费</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-gray-700">和润制导电话</p>
              <p className="text-2xl font-bold text-gray-800">内部热线</p>
              <p className="text-xs text-gray-400">工作日 9:00—18:00</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-gray-700">紧急救护</p>
              <p className="text-2xl font-bold text-gray-800">120</p>
              <p className="text-xs text-gray-400">高风险情况立即拨打</p>
            </div>
            <div className="bg-white rounded-xl p-4">
              <p className="font-semibold text-gray-700">心理健康重建平台</p>
              <p className="text-lg font-bold text-gray-800">www.npmh.org</p>
              <p className="text-xs text-gray-400">全国心理助人平台</p>
            </div>
          </div>
        </div>

        {/* 反馈入口 */}
        <div className="mt-8 text-center">
          <Link
            href={`/${locale}/xinyuzhe/feedback`}
            className="bg-rose-500 text-white px-8 py-3 rounded-xl font-semibold hover:bg-rose-600 transition-colors"
          >
            提交本次会话反馈 →
          </Link>
        </div>

      </div>
    </main>
  )
}
