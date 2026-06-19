'use client'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
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
  video: '\ud83c\udfa5 \u89c6\u9891',
  reading: '\ud83d\udcda \u9605\u8bfb',
  quiz: '\ud83d\udcdd \u6d4b\u8bd5',
  practice: '\ud83c\udfad \u5b9e\u8df5',
}

const LS_KEY = 'xinyuzhe_training_progress'

export default function XinyuzheTrainingPage() {
  const params = useParams()
  const locale = (params?.locale as string) ?? 'zh'
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

  function toggle(id: string, moduleId: string) {
    setDone(prev => {
      const next = new Set(prev)
      const adding = !next.has(id)
      if (adding) next.add(id); else next.delete(id)
      try { localStorage.setItem(LS_KEY, JSON.stringify([...next])) } catch {}
      // Sync to DB (fire-and-forget; fails gracefully if not authenticated)
      if (adding) {
        fetch('/api/xinyuzhe/training/progress', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lessonId: id, moduleId }),
        }).catch(() => {})
      }
      return next
    })
  }

  const completedCount = done.size
  const pct = Math.round((completedCount / TOTAL_LESSONS) * 100)

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto">

        {/* \u6807\u9898 */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">\ud83d\udcda</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-1">\u5fc3\u8bed\u8005\u57f9\u8bad\u8bfe\u7a0b</h1>
          <p className="text-gray-500">\u548c\u6da6\u5fc3\u8bed\u8005 \u00b7 \u8001\u5e74\u5fc3\u7406\u5065\u5eb7\u670d\u52a1 \u00b7 \u5168 {TRAINING_MODULES.length} \u6a21\u5757 \u00b7 \u5171 {TOTAL_HOURS} \u8bfe\u65f6</p>
        </div>

        {/* \u8fdb\u5ea6\u6761 */}
        <div className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
            <span>\u603b\u4f53\u8fdb\u5ea6</span>
            <span className="text-rose-600">{mounted ? completedCount : 0}/{TOTAL_LESSONS} \u8bfe\u65f6</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
            <div
              className="bg-gradient-to-r from-rose-500 to-amber-400 h-3 rounded-full transition-all duration-500"
              style={{ width: mounted ? `${pct}%` : '0%' }}
            />
          </div>
          <p className="text-xs text-gray-400">
            {pct < 100
              ? `\u5b8c\u6210\u6240\u6709\u8bfe\u65f6\u53ef\u7533\u8bf7\u201c\u548c\u6da6\u5fc3\u8bed\u8005\u201d\u8ba4\u8bc1\u8bc1\u4e66`
              : '\ud83c\udfc6 \u606d\u559c\uff01\u5168\u90e8\u8bfe\u7a0b\u5b8c\u6210\uff0c\u8bf7\u524d\u5f80\u6ce8\u518c\u9875\u7533\u8bf7\u8ba4\u8bc1'}
          </p>
        </div>

        {/* \u6a21\u5757\u5217\u8868 */}
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
                    <p className="text-sm text-gray-500">{mod.totalHours}\u8bfe\u65f6 \u00b7 {mod.lessons.length}\u8282\u8bfe</p>
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
                            {isDone && <span className="text-xs font-bold">\u2713</span>}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${isDone ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                              {lesson.title}
                            </p>
                            <p className="text-xs text-gray-400">
                              {lesson.duration} \u00b7 {LESSON_TYPE_LABEL[lesson.type]}
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

        {/* \u8ba4\u8bc1\u7533\u8bf7 CTA */}
        <div className="mt-6 bg-gradient-to-r from-rose-500 to-amber-500 rounded-2xl p-6 text-white text-center">
          <div className="text-3xl mb-2">\ud83c\udfc6</div>
          <h3 className="font-bold text-lg mb-2">\u548c\u6da6\u5fc3\u8bed\u8005\u8ba4\u8bc1\u8bc1\u4e66</h3>
          <p className="text-sm opacity-90 mb-4">5\u6a21\u5757 {TOTAL_HOURS}\u8bfe\u65f6\u5168\u90e8\u5b8c\u6210\u540e\uff0c\u7533\u8bf7\u5b98\u65b9\u8ba4\u8bc1\u8bc1\u4e66</p>
          <Link
            href={`/${locale}/xinyuzhe/registration`}
            className="inline-block bg-white text-rose-600 px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-50 transition-colors"
          >
            \u524d\u5f80\u6ce8\u518c\u7533\u8bf7
          </Link>
        </div>

        {/* \u8fd4\u56de */}
        <div className="mt-6 text-center">
          <Link href={`/${locale}/xinyuzhe`} className="text-sm text-gray-400 hover:text-gray-600">
            \u2190 \u8fd4\u56de\u548c\u6da6\u5fc3\u8bed\u8005\u4e3b\u9875
          </Link>
        </div>
      </div>
    </main>
  )
}
