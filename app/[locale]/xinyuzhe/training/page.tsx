'use client'
import { useState, useEffect } from 'react'
import { TRAINING_MODULES, TOTAL_HOURS, TOTAL_LESSONS } from '@/lib/types/xinyuzhe'
import Link from 'next/link'

const COLOR_RING: Record<string, string> = {
  green: 'border-green-300 bg-green-50',
  purple: 'border-purple-300 bg-purple-50',
  blue: 'border-blue-300 bg-blue-50',
  red: 'border-red-300 bg-red-50',
  amber: 'border-amber-300 bg-amber-50',
}
const BTN: Record<string, string> = {
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  blue: 'bg-blue-500',
  red: 'bg-red-500',
  amber: 'bg-amber-500',
}
const LESSON_TYPE_LABEL: Record<string, string> = {
  video: '🎥 视频',
  reading: '📚 阅读',
  quiz: '📝 测试',
  practice: '🎭 实践',
}

const LS_KEY = 'xinyuzhe_training_progress'

export default function XinyuzheTrainingPage() {
  const [expanded, setExpanded] = useState<string | null>('M1')
  const [done, setDone] = useState<Set<string>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved) setDone(new Set(JSON.parse(saved)))
    } catch {}
    setMounted(true)
  }, [])

  function toggle(id: string) {
    setDone(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch {}
      return next
    })
  }

  const completedCount = done.size
  const pct = Math.round((completedCount / TOTAL_LESSONS) * 100)

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">📚</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">心语者培训课程</h1>
          <p className="text-gray-500">和润心语者 · 老年心理健康服务 · 全 {TRAINING_MODULES.length} 模块 · 共 {TOTAL_HOURS} 课时</p>
        </div>

        {/* 进度条 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>总体进度</span>
            <span className="text-rose-600">{mounted ? completedCount : 0}/{TOTAL_LESSONS} 课时</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-rose-500 to-amber-400 h-3 rounded-full transition-all duration-500"
              style={{ width: mounted ? `${pct}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {pct < 100
              ? `完成所有课时可申请“和润心语者”认证证书`
              : '🏆 恭喜！全部课程完成，请前往注册页申请认证'}
          </p>
        </div>

        {/* 模块列表 */}
        {TRAINING_MODULES.map(mod => {
          const modDone = mod.lessons.filter(l => done.has(l.id)).length
          const isOpen = expanded === mod.id
          return (
            <div key={mod.id} className={`rounded-2xl border-2 mb-4 overflow-hidden shadow-sm ${COLOR_RING[mod.color]}`}>
              <button
                onClick={() => setExpanded(isOpen ? null : mod.id)}
                className="w-full flex items-center justify-between p-5 text-left"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{mod.badge}</span>
                  <div>
                    <h2 className="font-bold text-gray-900 text-lg">{mod.title}</h2>
                    <p className="text-sm text-gray-500">{mod.totalHours}课时 · {mod.lessons.length}节课</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-gray-600">{mounted ? modDone : 0}/{mod.lessons.length}</span>
                  <svg className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              {isOpen && (
                <div className="px-5 pb-6 bg-white/80">
                  <p className="text-gray-600 text-sm mb-4">{mod.description}</p>
                  <div className="space-y-2">
                    {mod.lessons.map(lesson => {
                      const isDone = done.has(lesson.id)
                      return (
                        <div key={lesson.id}
                          className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100 hover:border-gray-200 transition">
                          <button
                            onClick={() => toggle(lesson.id)}
                            className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                              isDone ? `${BTN[mod.color]} border-transparent text-white` : 'border-gray-300'
                            }`}
                          >
                            {isDone && <span className="text-xs font-bold">✓</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lesson.duration} · {LESSON_TYPE_LABEL[lesson.type]}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {/* 认证申请 CTA */}
        <div className="mt-6 bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-6 text-white text-center">
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-bold text-lg mb-2">和润心语者认证证书</h3>
          <p className="text-sm opacity-90 mb-4">5模块 {TOTAL_HOURS}课时全部完成后，申请官方认证证书</p>
          <Link
            href="/zh/xinyuzhe/registration"
            className="inline-block bg-white text-rose-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
          >
            前往注册申请
          </Link>
        </div>

        {/* 返回 */}
        <div className="mt-6 text-center">
          <Link href="/zh/xinyuzhe" className="text-sm text-gray-400 hover:text-gray-600">
            ← 返回和润心语者主页
          </Link>
        </div>
      </div>
    </main>
  )
}
