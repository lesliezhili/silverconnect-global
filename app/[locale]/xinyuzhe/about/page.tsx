import { setRequestLocale } from 'next-intl/server'

export const metadata = {
  title: '和润心语者 — SilverConnect銀龄智联',
  description: '情感智能与数字生命服务中心——中国领先的高净值情感科技平台',
}

export default async function XinyuzhePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)

  return (
    <main className="min-h-screen bg-white font-sans">

      {/* ── Hero ── */}
      <section className="bg-gradient-to-br from-rose-50 via-amber-50 to-orange-50 py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="text-7xl mb-4">🌸</div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">和润心语者</h1>
          <p className="text-2xl text-rose-700 font-semibold mb-2">情感智能与数字生命服务中心</p>
          <p className="text-gray-600 text-lg mb-6">SilverConnect 銀龄智联 · 中国平台旗舰项目</p>
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <span className="bg-rose-100 text-rose-800 px-4 py-2 rounded-full text-sm font-semibold">💹 首年投资 500 万元</span>
            <span className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold">⏱ 12～18 月回收</span>
            <span className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold">📊 3 年累计 ROI 150%</span>
            <span className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">🏥 保险投资方进入</span>
          </div>
          <p className="text-gray-500 text-base max-w-2xl mx-auto leading-relaxed">
            不是再建一个 APP，而是建设集团未来十年的数字基础设施。
            以情感为入口，以数据为资产，以 AI 为引擎，以保险与医疗为放大器。
          </p>
        </div>
      </section>

      {/* ── 战略定位 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">一、执行摘要</h2>
          <p className="text-center text-gray-400 text-sm mb-8">SilverConnect（銀龄智联）中国平台——和润心语者项目路径指南与财务规划说明书（正式版 V2.0 · 2026年6月）</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-rose-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">🎯</div>
              <h3 className="font-bold text-gray-900 mb-2">战略定位</h3>
              <p className="text-gray-600 text-sm leading-relaxed">以“情感陊伴、数字生命、医疗人文、保险增值服务”为切入口，推动医院、医养、保险、培训等多个事业部完成数字化升级。</p>
            </div>
            <div className="bg-amber-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">💡</div>
              <h3 className="font-bold text-gray-900 mb-2">项目本质</h3>
              <p className="text-gray-600 text-sm leading-relaxed">从“服务驱动”升级为“数据驱动”，再升级为“AI驱动经营”的集团级智能基础设施。</p>
            </div>
            <div className="bg-green-50 rounded-2xl p-6">
              <div className="text-3xl mb-3">📈</div>
              <h3 className="font-bold text-gray-900 mb-2">投资目标</h3>
              <p className="text-gray-600 text-sm leading-relaxed">首年投资 500 万元。目标：12～18 月实现经营性现金流平衡；24 月进入稳定盈利；36 月形成集团数据资产与区域复制能力。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 五大产品线 ── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">二、五大产品线</h2>
          <p className="text-center text-gray-500 text-sm mb-10">多元收入保障·长期可持续增长</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-rose-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🤖</span>
                <div>
                  <h3 className="font-bold text-rose-700">一、AI 心语陊伴</h3>
                  <p className="text-xs text-gray-400">299 元/月</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• 微信 / 电话情感陊伴</li>
                <li>• 情绪识别与睡眠支持</li>
                <li>• 用药提醒与家庭联动</li>
              </ul>
              <p className="text-xs text-rose-600 font-medium">目标客户：独居老人、慢病患者、精神康复人群</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-amber-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">📖</span>
                <div>
                  <h3 className="font-bold text-amber-700">二、家庭数字传记</h3>
                  <p className="text-xs text-gray-400">3 万～10 万元/套</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• 访谈 → AI 整理 → 文字传记</li>
                <li>• AI 分镜 → 视频制作</li>
                <li>• 家族数字档案交付</li>
              </ul>
              <p className="text-xs text-amber-600 font-medium">目标客户：高净值家庭、企业家、退休干部</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🛡️</span>
                <div>
                  <h3 className="font-bold text-blue-700">三、保险增值服务</h3>
                  <p className="text-xs text-gray-400">60～120 元/人/年</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• 长者关怀 / 心理支持</li>
                <li>• 家属陊伴 / 理赔后干预</li>
              </ul>
              <p className="text-xs text-blue-600 font-medium">目标客户：保险公司（ B2B 合作）</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-purple-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🏥</span>
                <div>
                  <h3 className="font-bold text-purple-700">四、医管赋能</h3>
                  <p className="text-xs text-gray-400">50～100 万元/院/年</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• DRG/DIP 分析大屏</li>
                <li>• 医患沟通助手 / AI 知识库</li>
                <li>• 经营驾驶舱</li>
              </ul>
              <p className="text-xs text-purple-600 font-medium">目标客户：集团医院（ B2B 授权）</p>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm border border-green-100">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">🎓</span>
                <div>
                  <h3 className="font-bold text-green-700">五、高校实践基地</h3>
                  <p className="text-xs text-gray-400">800～1500 元/人</p>
                </div>
              </div>
              <ul className="text-sm text-gray-600 space-y-1 mb-3">
                <li>• 医护心理社工学院联实课程</li>
                <li>• 培训 + 认证 + 实习</li>
              </ul>
              <p className="text-xs text-green-600 font-medium">价值：降低成本、储备人才、形成品牌</p>
            </div>

            <div className="bg-gradient-to-br from-rose-500 to-amber-500 rounded-2xl p-6 text-white">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-bold mb-2">集团飞轮逻辑</h3>
              <p className="text-sm opacity-90 leading-relaxed">
                服务创造数据 → 数据训练 AI → AI 赋能经营 → 经营反哺服务
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ── 首年 500 万元预算明细 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">三、首年 500 万元预算明细</h2>
          <p className="text-center text-gray-500 text-sm mb-8">包括云基础设施、应用平台、数据与 AI 组件全层次成本</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 rounded-tl-xl">支出项目</th>
                  <th className="text-right px-4 py-3">首年预算（万元）</th>
                  <th className="text-left px-4 py-3 rounded-tr-xl">包含内容</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr className="bg-blue-50">
                  <td className="px-4 py-3 font-semibold text-blue-800">🏢 云基础设施</td>
                  <td className="px-4 py-3 text-right font-bold text-blue-800">35</td>
                  <td className="px-4 py-3 text-gray-600">阿里云 18 万 + 腾讯云 12 万 + 安全备份 5 万</td>
                </tr>
                <tr className="bg-purple-50">
                  <td className="px-4 py-3 font-semibold text-purple-800">🤖 AI 开发工具</td>
                  <td className="px-4 py-3 text-right font-bold text-purple-800">5.7</td>
                  <td className="px-4 py-3 text-gray-600">Claude·3 + Codex·2 + Copilot·5 年订</td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="px-4 py-3 font-semibold text-amber-800">📚 共享知识库</td>
                  <td className="px-4 py-3 text-right font-bold text-amber-800">30</td>
                  <td className="px-4 py-3 text-gray-600">临床规范、心理知识、培训课程、运营经验沉淠</td>
                </tr>
                <tr className="bg-rose-50">
                  <td className="px-4 py-3 font-semibold text-rose-800">🎥 DGX 传记生产线</td>
                  <td className="px-4 py-3 text-right font-bold text-rose-800">110</td>
                  <td className="px-4 py-3 text-gray-600">DGX Spark 工作站 60 万 + 剪辑师 30 万/年 + 拍摄制作 20 万</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-800">👨‍💻 研发团队</td>
                  <td className="px-4 py-3 text-right font-bold">120</td>
                  <td className="px-4 py-3 text-gray-600">后端 2 人 + 前端 2 人 + AI 工程师 1 人（含高校生实习）</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-semibold text-gray-800">💼 运营团队</td>
                  <td className="px-4 py-3 text-right font-bold">80</td>
                  <td className="px-4 py-3 text-gray-600">心语者首席运营官 + 客户服务 + 渠道拓展</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-semibold text-gray-800">🏫 高校合作</td>
                  <td className="px-4 py-3 text-right font-bold">20</td>
                  <td className="px-4 py-3 text-gray-600">实习平台建设， 2～3 所院校合作</td>
                </tr>
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-semibold text-red-800">🔒 安全与合规</td>
                  <td className="px-4 py-3 text-right font-bold text-red-800">20</td>
                  <td className="px-4 py-3 text-gray-600">个人信息保护、媒体合规、安全审计</td>
                </tr>
                <tr className="bg-gray-100">
                  <td className="px-4 py-3 font-semibold text-gray-700">📂 行政及预备金</td>
                  <td className="px-4 py-3 text-right font-bold">79.3</td>
                  <td className="px-4 py-3 text-gray-600">办公、工商注册、法务、设备、活动营销</td>
                </tr>
                <tr className="bg-gray-900 text-white">
                  <td className="px-4 py-3 font-bold rounded-bl-xl">合计</td>
                  <td className="px-4 py-3 text-right font-bold text-2xl">500</td>
                  <td className="px-4 py-3 rounded-br-xl">人民币 / 首年</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 云基础设施详细说明 ── */}
      <section className="py-14 px-4 bg-blue-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">四、云基础设施详细说明</h2>
          <p className="text-center text-gray-500 text-sm mb-8">首年云平台预算 35 万元人民币（轻资产）——第一阶段全公有云，不自建深度绑定</p>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {/* 阿里云 */}
            <div className="bg-white rounded-2xl p-6 border border-blue-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">☁️</span>
                <div>
                  <h3 className="font-bold text-gray-900">阿里云（首选）—ↀ18 万元/年</h3>
                  <p className="text-xs text-blue-600">应用服务器 + 数据库 + 存储 + 数据开发</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-700">
                  <thead className="bg-blue-100 text-blue-800">
                    <tr>
                      <th className="text-left px-3 py-2">服务类型</th>
                      <th className="text-right px-3 py-2">设配</th>
                      <th className="text-right px-3 py-2">年费（元）</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="px-3 py-2">ECS 应用服务器</td><td className="px-3 py-2 text-right">2核 4G ×2</td><td className="px-3 py-2 text-right">28,800</td></tr>
                    <tr><td className="px-3 py-2">RDS MySQL</td><td className="px-3 py-2 text-right">1核 2G</td><td className="px-3 py-2 text-right">14,400</td></tr>
                    <tr><td className="px-3 py-2">OSS 对象存储</td><td className="px-3 py-2 text-right">1 TB</td><td className="px-3 py-2 text-right">1,440</td></tr>
                    <tr><td className="px-3 py-2">CDN 内容加速</td><td className="px-3 py-2 text-right">100 GB/月</td><td className="px-3 py-2 text-right">4,800</td></tr>
                    <tr><td className="px-3 py-2">DataWorks 数据开发</td><td className="px-3 py-2 text-right">基础版</td><td className="px-3 py-2 text-right">28,800</td></tr>
                    <tr><td className="px-3 py-2">查数安全许可</td><td className="px-3 py-2 text-right">年订</td><td className="px-3 py-2 text-right">1,760</td></tr>
                    <tr className="bg-blue-50 font-semibold"><td className="px-3 py-2">小计</td><td className="px-3 py-2"></td><td className="px-3 py-2 text-right text-blue-700">80,000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 腾讯云 */}
            <div className="bg-white rounded-2xl p-6 border border-green-200">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">💬</span>
                <div>
                  <h3 className="font-bold text-gray-900">腾讯云（微信生态）—ↀ12 万元/年</h3>
                  <p className="text-xs text-green-600">微信小程序 + 音视频 + 企业微信</p>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-gray-700">
                  <thead className="bg-green-100 text-green-800">
                    <tr>
                      <th className="text-left px-3 py-2">服务类型</th>
                      <th className="text-right px-3 py-2">设配</th>
                      <th className="text-right px-3 py-2">年费（元）</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    <tr><td className="px-3 py-2">小程序 cloud</td><td className="px-3 py-2 text-right">标准版</td><td className="px-3 py-2 text-right">30,000</td></tr>
                    <tr><td className="px-3 py-2">TRTC 实时音视频</td><td className="px-3 py-2 text-right">1000 分钟/月</td><td className="px-3 py-2 text-right">14,400</td></tr>
                    <tr><td className="px-3 py-2">企业微信消息推送</td><td className="px-3 py-2 text-right">10 万条/月</td><td className="px-3 py-2 text-right">12,000</td></tr>
                    <tr><td className="px-3 py-2">ASR 语音识别</td><td className="px-3 py-2 text-right">5000 小时</td><td className="px-3 py-2 text-right">7,500</td></tr>
                    <tr><td className="px-3 py-2">云塾各项服务</td><td className="px-3 py-2 text-right">按量</td><td className="px-3 py-2 text-right">56,100</td></tr>
                    <tr className="bg-green-50 font-semibold"><td className="px-3 py-2">小计</td><td className="px-3 py-2"></td><td className="px-3 py-2 text-right text-green-700">120,000</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* 安全备份 */}
          <div className="bg-white rounded-2xl p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">🔒</span>
              <h3 className="font-bold text-gray-900">安全与备份—ↀ5 万元/年（合规必要支出）</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-center">
              <div className="bg-red-50 rounded-xl p-3">
                <div className="font-semibold text-red-700">巨灿 DDoS 防护</div>
                <div className="text-xs text-gray-500 mt-1">12,000 元/年</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="font-semibold text-red-700">SSL 证书</div>
                <div className="text-xs text-gray-500 mt-1">2,000 元/年</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="font-semibold text-red-700">异地备份</div>
                <div className="text-xs text-gray-500 mt-1">18,000 元/年</div>
              </div>
              <div className="bg-red-50 rounded-xl p-3">
                <div className="font-semibold text-red-700">数据审计服务</div>
                <div className="text-xs text-gray-500 mt-1">18,000 元/年</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── AI 开发工具 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">五、AI 开发工具配置</h2>
          <p className="text-center text-gray-500 text-sm mb-8">年订合计 5.7 万元 · 研发效率提升 30～50%</p>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">Claude Code</h3>
                <span className="text-yellow-500 text-sm">★★★★★</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">定位：系统设计与复杂开发</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• 微服务架构设计</li>
                <li>• 知识库与 AI 工作流</li>
              </ul>
              <div className="bg-purple-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-purple-700">3.3 万元/年</div>
                <div className="text-xs text-gray-500">3 个席位</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">OpenAI Codex</h3>
                <span className="text-yellow-500 text-sm">★★★★</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">定位：自动编码生成</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• API 开发与测试生成</li>
                <li>• 文档自动化</li>
              </ul>
              <div className="bg-blue-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-blue-700">0.7 万元/年</div>
                <div className="text-xs text-gray-500">2 个席位</div>
              </div>
            </div>
            <div className="border border-gray-200 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">GitHub Copilot</h3>
                <span className="text-yellow-500 text-sm">★★★★★</span>
              </div>
              <p className="text-xs text-gray-500 mb-3">定位：协同开发治理</p>
              <ul className="text-sm text-gray-600 space-y-1 mb-4">
                <li>• PR 审查与自动修复</li>
                <li>• Issue 处理</li>
              </ul>
              <div className="bg-green-50 rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-700">1.7 万元/年</div>
                <div className="text-xs text-gray-500">5 个席位</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 收入预测 ── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">六、三年财务预测</h2>
          <p className="text-center text-gray-500 text-sm mb-8">屔8 —— 战略投入期，第 2 年进入盈利，第 3 年形成区域龙头</p>

          <div className="overflow-x-auto mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="text-left px-4 py-3 rounded-tl-xl">产品线</th>
                  <th className="px-4 py-3 text-center">第一年</th>
                  <th className="px-4 py-3 text-center">第二年</th>
                  <th className="px-4 py-3 text-center rounded-tr-xl">第三年</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                <tr>
                  <td className="px-4 py-3">AI 心语陊伴<br/><span className="text-xs text-gray-400">用户规模</span></td>
                  <td className="px-4 py-3 text-center">108 万元<br/><span className="text-xs text-gray-400">300 人</span></td>
                  <td className="px-4 py-3 text-center">360 万元<br/><span className="text-xs text-gray-400">1,000 人</span></td>
                  <td className="px-4 py-3 text-center">720 万元<br/><span className="text-xs text-gray-400">2,000 人</span></td>
                </tr>
                <tr className="bg-amber-50">
                  <td className="px-4 py-3">家庭数字传记<br/><span className="text-xs text-gray-400">个帚单数</span></td>
                  <td className="px-4 py-3 text-center">150 万元<br/><span className="text-xs text-gray-400">30 单</span></td>
                  <td className="px-4 py-3 text-center">300 万元<br/><span className="text-xs text-gray-400">60 单</span></td>
                  <td className="px-4 py-3 text-center">500 万元<br/><span className="text-xs text-gray-400">100 单</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-3">保险增值服务<br/><span className="text-xs text-gray-400">拆单人数</span></td>
                  <td className="px-4 py-3 text-center">40 万元<br/><span className="text-xs text-gray-400">5,000 人</span></td>
                  <td className="px-4 py-3 text-center">160 万元<br/><span className="text-xs text-gray-400">20,000 人</span></td>
                  <td className="px-4 py-3 text-center">400 万元<br/><span className="text-xs text-gray-400">50,000 人</span></td>
                </tr>
                <tr className="bg-purple-50">
                  <td className="px-4 py-3">医管赋能<br/><span className="text-xs text-gray-400">合作医院</span></td>
                  <td className="px-4 py-3 text-center">120 万元<br/><span className="text-xs text-gray-400">2 家</span></td>
                  <td className="px-4 py-3 text-center">300 万元<br/><span className="text-xs text-gray-400">5 家</span></td>
                  <td className="px-4 py-3 text-center">500 万元<br/><span className="text-xs text-gray-400">8 家</span></td>
                </tr>
                <tr>
                  <td className="px-4 py-3">高校培训基地</td>
                  <td className="px-4 py-3 text-center">30 万元</td>
                  <td className="px-4 py-3 text-center">60 万元</td>
                  <td className="px-4 py-3 text-center">80 万元</td>
                </tr>
                <tr className="bg-gray-900 text-white">
                  <td className="px-4 py-3 font-bold rounded-bl-xl">总收入</td>
                  <td className="px-4 py-3 text-center font-bold text-xl">448 万</td>
                  <td className="px-4 py-3 text-center font-bold text-xl">1,180 万</td>
                  <td className="px-4 py-3 text-center font-bold text-xl rounded-br-xl">2,200+ 万</td>
                </tr>
                <tr className="bg-green-100">
                  <td className="px-4 py-3 font-semibold text-green-800">预计净利润</td>
                  <td className="px-4 py-3 text-center text-red-600 font-semibold">− 52 万（战略投入期）</td>
                  <td className="px-4 py-3 text-center text-green-700 font-semibold">300～400 万</td>
                  <td className="px-4 py-3 text-center text-green-700 font-bold">700+ 万</td>
                </tr>
                <tr className="bg-green-50">
                  <td colSpan={4} className="px-4 py-3 text-center text-sm text-green-800 font-medium">
                    📊 3 年累计 ROI ≈ 150%，投资回收期 12～18 月
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── 保险投资机制 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">七、保险投资进入机制</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-blue-50 rounded-2xl p-6">
              <h3 className="font-bold text-blue-800 text-lg mb-4">🤝 第一阶段：业务合作（不入股）</h3>
              <ul className="text-sm text-gray-700 space-y-2">
                <li>✅ 保险公司作为渠道合作伙伴</li>
                <li>✅ SilverConnect 提供长者关怀服务</li>
                <li>✅ 保险公司向被保险人分发服务</li>
                <li>✅ 按人头收取 60～120 元/年</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-2xl p-6">
              <h3 className="font-bold text-green-800 text-lg mb-4">📈 第二阶段：开放股权融资</h3>
              <p className="text-sm text-gray-600 mb-3">开放条件（任满其一）：</p>
              <ul className="text-sm text-gray-700 space-y-2 mb-4">
                <li>📌 有效用户 ≥ 3,000</li>
                <li>📌 合作医院 ≥ 3 家</li>
                <li>📌 保险客户 ≥ 10,000</li>
              </ul>
              <div className="bg-white rounded-xl p-3 text-center">
                <div className="text-lg font-bold text-green-700">开放 10%～15% 股权</div>
                <div className="text-sm text-gray-500">融资 1,000～1,500 万元</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 高校人才培养 ── */}
      <section className="py-14 px-4 bg-amber-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">八、服务提供者培训与高校人才体系</h2>
          <p className="text-center text-gray-500 text-sm mb-8">降低人力成本 · 形成品牌 · 储备人才</p>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-3">🏥</div>
              <h3 className="font-semibold text-gray-900 text-sm">医学院校</h3>
              <p className="text-xs text-gray-500 mt-2">实习 + 就业渠道</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-3">🧑‍⚕️</div>
              <h3 className="font-semibold text-gray-900 text-sm">护理学院</h3>
              <p className="text-xs text-gray-500 mt-2">情感陊伴实证培训</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-3">🧠</div>
              <h3 className="font-semibold text-gray-900 text-sm">心理学院</h3>
              <p className="text-xs text-gray-500 mt-2">心语者模块认证</p>
            </div>
            <div className="bg-white rounded-xl p-5 text-center shadow-sm">
              <div className="text-3xl mb-3">🧑‍🤝‍🧑</div>
              <h3 className="font-semibold text-gray-900 text-sm">社工学院</h3>
              <p className="text-xs text-gray-500 mt-2">社区服务实践</p>
            </div>
          </div>
          <div className="mt-6 bg-white rounded-2xl p-6 text-center">
            <p className="text-gray-700 text-sm"><span className="font-semibold">实习费用：800～1,500 元/人</span>，高校生代替全职员工，节约人力成本 40～60%，同时为院校提供真实厂内实习场景。</p>
          </div>
        </div>
      </section>

      {/* ── 技术路线图 ── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">九、技术路线三年规划</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-b from-blue-50 to-blue-100 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-bold">第一阶段</div>
              <h3 className="font-bold text-blue-900 text-lg mt-2 mb-4">0～12 月——轻资产验证</h3>
              <ul className="text-sm text-blue-800 space-y-2">
                <li>• 阿里云 + 腾讯云（全公有云）</li>
                <li>• 快速上线 MVP</li>
                <li>• 微信小程序雳伴功能上线</li>
                <li>• 首批 30～50 位下单</li>
              </ul>
            </div>
            <div className="bg-gradient-to-b from-purple-50 to-purple-100 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-bold">第二阶段</div>
              <h3 className="font-bold text-purple-900 text-lg mt-2 mb-4">12～24 月——企业数据中台</h3>
              <ul className="text-sm text-purple-800 space-y-2">
                <li>• 打通集团数据层</li>
                <li>• AI 分析展现层建设</li>
                <li>• 保险 API 接口打通</li>
                <li>• 医院 ×2 初始签约</li>
              </ul>
            </div>
            <div className="bg-gradient-to-b from-green-50 to-green-100 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-6 bg-green-600 text-white px-3 py-1 rounded-full text-xs font-bold">第三阶段</div>
              <h3 className="font-bold text-green-900 text-lg mt-2 mb-4">24～36 月——混合云 + 本地算力</h3>
              <ul className="text-sm text-green-800 space-y-2">
                <li>• DGX Spark 集群部署</li>
                <li>• 形成数据 + 市场壁垒</li>
                <li>• 申报国家 AI 临床科研项目</li>
                <li>• 开始区域市场复制</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── 风险与应对 ── */}
      <section className="py-14 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">十、主要风险与应对</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-5 border-l-4 border-red-400">
              <h3 className="font-bold text-red-700 mb-2">用户增长不足</h3>
              <p className="text-sm text-gray-600">应对：优先保险渠道，传统渠道折扣 + 保险公司安排小程序入口。</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-l-4 border-orange-400">
              <h3 className="font-bold text-orange-700 mb-2">AI 模型调用费用上涨</h3>
              <p className="text-sm text-gray-600">应对：逐步本地化推理， DGX 第二阶段预算进行计划。</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-l-4 border-yellow-400">
              <h3 className="font-bold text-yellow-700 mb-2">监管政策变化</h3>
              <p className="text-sm text-gray-600">应对：坚持情感陊伴定位，遇免医疗诊断红线。配合合规顾问常态忩评。</p>
            </div>
            <div className="bg-white rounded-2xl p-5 border-l-4 border-green-400">
              <h3 className="font-bold text-green-700 mb-2">关键人才流失</h3>
              <p className="text-sm text-gray-600">应对： AI 工具标准化、高校生培养体系、股权激励三防线并行。</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 结语 CTA ── */}
      <section className="py-16 px-4 bg-gradient-to-br from-rose-600 to-amber-600 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-5xl mb-6">🌸</div>
          <h2 className="text-3xl font-bold mb-4">宏大叙事已经结束</h2>
          <p className="text-lg opacity-90 mb-6 leading-relaxed">
            真正决定未来的，不是拥有最大的模型，
            而是谁率先拥有最真实的场景、最持续的数据、最深厚的信任。
          </p>
          <p className="text-base opacity-80 mb-8 leading-relaxed">
            和润心语者，以情感为入口，以数据为资产，以 AI 为引擎。
            今天投入 500 万元，不只是启动一个项目，
            而是在建设能够陊伴千万家庭、赋能整个集团的新型智能基础设施。
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href="mailto:zhili@phledger.com"
              className="bg-white text-rose-600 px-8 py-3 rounded-xl font-bold hover:bg-rose-50 transition-colors">
              联系项目负责人
            </a>
            <a href="/zh/book-service"
              className="border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors">
              预约和润服务
            </a>
          </div>
          <p className="mt-8 text-sm opacity-60">
            愿科技有温度，愿陊伴有力量，愿价值长久传承。
          </p>
        </div>
      </section>

    </main>
  )
}
