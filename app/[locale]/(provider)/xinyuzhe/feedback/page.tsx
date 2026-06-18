'use client'
import { useState } from 'react'

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0)
  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-2">{label}</p>
      <div className="flex gap-1.5">
        {[1,2,3,4,5].map(n => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className={`text-2xl transition-transform hover:scale-110 ${
              n <= (hover || value) ? 'text-amber-400' : 'text-gray-200'
            }`}
          >
            \u2605
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-gray-500 self-center">
            {['','\u5f88\u4e0d\u6ee1\u610f','\u4e0d\u6ee1\u610f','\u4e00\u822c','\u6ee1\u610f','\u975e\u5e38\u6ee1\u610f'][value]}
          </span>
        )}
      </div>
    </div>
  )
}

export default function XinyuzheFeedbackPage() {
  const [form, setForm] = useState({
    sessionDate:         '',
    serviceType:         '',
    clientSatisfaction:  0,
    emotionalConnection: 0,
    professionalism:     0,
    wouldRecommend:      null as boolean | null,
    clientComment:       '',
    providerNotes:       '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')

  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }))

  const canSubmit =
    form.sessionDate && form.serviceType &&
    form.clientSatisfaction > 0 && form.emotionalConnection > 0 && form.professionalism > 0

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/xinyuzhe/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId:          'self', // server resolves from session
          clientSatisfaction:  form.clientSatisfaction,
          emotionalConnection: form.emotionalConnection,
          professionalism:     form.professionalism,
          wouldRecommend:      form.wouldRecommend ?? false,
          clientComment:       form.clientComment,
          providerNotes:       form.providerNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '\u63d0\u4ea4\u5931\u8d25')
      setSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '\u670d\u52a1\u5668\u9519\u8bef')
    } finally {
      setLoading(false)
    }
  }

  if (success) return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-sm">
        <div className="text-6xl mb-4">\u2b50</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">\u53cd\u9988\u5df2\u63d0\u4ea4\uff01</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          \u611f\u8c22\u60a8\u7684\u8ba4\u771f\u53cd\u9988\u3002\u60a8\u7684\u8bc4\u4ef7\u5c06\u5e2e\u52a9\u548c\u6da6\u5fc3\u8bed\u8005\u56e2\u961f\u6301\u7eed\u63d0\u5347\u670d\u52a1\u8d28\u91cf\u3002
        </p>
        <button
          onClick={() => { setSuccess(false); setForm({ sessionDate: '', serviceType: '', clientSatisfaction: 0, emotionalConnection: 0, professionalism: 0, wouldRecommend: null, clientComment: '', providerNotes: '' }) }}
          className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-rose-600 transition-colors"
        >
          \u63d0\u4ea4\u65b0\u53cd\u9988
        </button>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-gradient-to-r from-purple-600 to-rose-500 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">\u2b50 \u670d\u52a1\u53cd\u9988\u4e0e\u8bc4\u4ef7</h1>
          <p className="text-white/90 text-sm">\u6bcf\u6b21\u670d\u52a1\u5b8c\u6210\u540e\u8bf7\u5c3d\u5feb\u586b\u5199 \u00b7 \u5e2e\u52a9\u6211\u4eec\u6301\u7eed\u6539\u5584</p>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl p-6 shadow-sm space-y-6">

          {/* Session info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">\u670d\u52a1\u65e5\u671f *</label>
              <input
                type="date" value={form.sessionDate}
                onChange={e => set('sessionDate', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">\u670d\u52a1\u7c7b\u578b *</label>
              <select
                value={form.serviceType}
                onChange={e => set('serviceType', e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">\u8bf7\u9009\u62e9</option>
                <option value="aiCompanionship">AI \u5fc3\u8bed\u964a\u4f34</option>
                <option value="digitalBiography">\u6570\u5b57\u4f20\u8bb0</option>
                <option value="medicalSupport">\u533b\u517b\u8f85\u52a9</option>
                <option value="insuranceService">\u4fdd\u9669\u5173\u6000</option>
                <option value="outreach">\u9ad8\u6821\u63a8\u5e7f</option>
              </select>
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Ratings */}
          <div>
            <h3 className="font-bold text-gray-900 mb-4">\u5ba2\u6237\u8bc4\u4ef7\uff08\u4ee3\u5ba2\u6237\u586b\u5199\uff09</h3>
            <div className="space-y-5">
              <StarRating
                value={form.clientSatisfaction}
                onChange={v => set('clientSatisfaction', v)}
                label="\u603b\u4f53\u6ee1\u610f\u5ea6 *"
              />
              <StarRating
                value={form.emotionalConnection}
                onChange={v => set('emotionalConnection', v)}
                label="\u60c5\u611f\u8fde\u63a5\u8d28\u91cf *"
              />
              <StarRating
                value={form.professionalism}
                onChange={v => set('professionalism', v)}
                label="\u4e13\u4e1a\u8868\u73b0 *"
              />
            </div>
          </div>

          {/* Would Recommend */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">\u5ba2\u6237\u662f\u5426\u613f\u610f\u5411\u5bb6\u4eba/\u670b\u53cb\u63a8\u8350\u548c\u6da6\u670d\u52a1\uff1f</p>
            <div className="flex gap-3">
              {[{ val: true, label: '\u613f\u610f\u63a8\u8350 \ud83d\udc4d' }, { val: false, label: '\u6682\u4e0d\u63a8\u8350 \ud83e\udd14' }].map(o => (
                <button
                  key={String(o.val)}
                  onClick={() => set('wouldRecommend', o.val)}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border-2 transition-colors ${
                    form.wouldRecommend === o.val
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 text-gray-600 hover:border-purple-300'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          {/* Comments */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">\u5ba2\u6237\u6587\u5b57\u53cd\u9988\uff08\u53ef\u9009\uff09</label>
            <textarea
              value={form.clientComment}
              onChange={e => set('clientComment', e.target.value)}
              rows={3}
              placeholder="\u5ba2\u6237\u8bf4\u4e86\u4ec0\u4e48\uff1f\u8bb0\u5f55\u5ba2\u6237\u7684\u539f\u8bdd\u6216\u5173\u952e\u53cd\u9988\u70b9\u2026\u2026"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          <hr className="border-gray-100" />

          {/* Provider self-reflection */}
          <div>
            <h3 className="font-bold text-gray-900 mb-3">\u5fc3\u8bed\u8005\u81ea\u6211\u53cd\u601d\uff08\u4ec5\u5185\u90e8\u53ef\u89c1\uff09</h3>
            <textarea
              value={form.providerNotes}
              onChange={e => set('providerNotes', e.target.value)}
              rows={4}
              placeholder="\u672c\u6b21\u670d\u52a1\u4e2d\u6211\u505a\u5f97\u597d\u7684\u5730\u65b9\uff1f\u6709\u54ea\u4e9b\u60c5\u7eea\u5360\u6a21\u5f0f\u9700\u8981\u6ce8\u610f\uff1f\u4e0b\u6b21\u5982\u4f55\u6539\u8fdb\u2026\u2026"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            onClick={submit}
            disabled={!canSubmit || loading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 disabled:opacity-40 transition-colors"
          >
            {loading ? '\u63d0\u4ea4\u4e2d...' : '\u63d0\u4ea4\u53cd\u9988 \u2b50'}
          </button>
        </div>
      </section>
    </main>
  )
}
