'use client'
import { useState } from 'react'

const SPECIALIZATIONS = [
  { id: 'aiCompanionship',  label: 'AI \u5fc3\u8bed\u964a\u4f34\u5e08',  icon: '\ud83e\udd16', desc: '\u5fae\u4fe1\u964a\u4f34\u3001\u60c5\u7eea\u652f\u6301\u3001\u7568\u7720\u52a9\u624b' },
  { id: 'digitalBiography', label: '\u6570\u5b57\u4f20\u8bb0\u987e\u95ee',   icon: '\ud83d\udcd6', desc: '\u8bbf\u8c08\u3001AI \u6574\u7406\u3001\u4f20\u8bb0\u5236\u4f5c' },
  { id: 'medicalSupport',   label: '\u533b\u517b\u8f85\u52a9\u5206\u6790\u5e08', icon: '\ud83c\udfe5', desc: 'DRG/DIP \u5206\u6790\u3001\u533b\u60a3\u6c9f\u901a\u52a9\u624b' },
  { id: 'insuranceService', label: '\u4fdd\u9669\u5173\u6000\u4e13\u5458',   icon: '\ud83d\udee1\ufe0f', desc: '\u957f\u62a4\u9669\u3001\u589e\u503c\u670d\u52a1\u5bf9\u63a5' },
  { id: 'outreachAmbassador', label: '\u9ad8\u6821\u63a8\u5e7f\u5927\u4f7f',  icon: '\ud83c\udf93', desc: '\u9662\u6821\u5408\u4f5c\u3001\u5e73\u53f0\u63a8\u5e7f' },
]

type Form = {
  fullName: string; phone: string; email: string; city: string
  university: string; department: string; yearOfStudy: string
  specializations: string[]; backgroundCheckConsent: boolean; volunteerCommitment: boolean; confidentiality: boolean
}

const EMPTY: Form = {
  fullName: '', phone: '', email: '', city: '',
  university: '', department: '', yearOfStudy: '',
  specializations: [], backgroundCheckConsent: false, volunteerCommitment: false, confidentiality: false,
}

export default function XinyuzheRegisterPage() {
  const [step, setStep]     = useState(1)       // 1 | 2 | 3
  const [form, setForm]     = useState<Form>(EMPTY)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]   = useState('')

  const set = (field: keyof Form, val: unknown) => setForm(f => ({ ...f, [field]: val }))
  const toggleSpec = (id: string) =>
    set('specializations', form.specializations.includes(id)
      ? form.specializations.filter(s => s !== id)
      : [...form.specializations, id])

  const step1Ok = form.fullName && form.phone && form.email && form.city
  const step2Ok = form.university && form.department && form.yearOfStudy && form.specializations.length > 0
  const step3Ok = form.backgroundCheckConsent && form.volunteerCommitment && form.confidentiality

  const submit = async () => {
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/xinyuzhe/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
        <div className="text-6xl mb-4">\ud83c\udf38</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">\u7533\u8bf7\u5df2\u6210\u529f\u63d0\u4ea4\uff01</h2>
        <p className="text-gray-600 text-sm leading-relaxed mb-6">
          \u611f\u8c22\u60a8\u7533\u8bf7\u548c\u6da6\u5fc3\u8bed\u8005\u8ba1\u5212\u3002\u6211\u4eec\u7684\u56e2\u961f\u5c06\u5728 3 \u4e2a\u5de5\u4f5c\u65e5\u5185\u4e0e\u60a8\u8054\u7cfb\uff0c\u5b89\u6392\u9762\u8bd5\u5e76\u5f00\u59cb\u57f9\u8bad\u3002
        </p>
        <div className="bg-rose-50 rounded-xl p-4 text-sm text-rose-700">
          \u8bf7\u5c42\u5019\u6211\u4eec\u7684\u901a\u77e5\u90ae\u4ef6\uff0c\u786e\u8ba4\u8d26\u53f7\u5df2\u7ecf\u6fc0\u6d3b\u3002
        </div>
      </div>
    </main>
  )

  return (
    <main className="min-h-screen bg-gray-50">

      {/* Header */}
      <section className="bg-gradient-to-r from-rose-600 to-amber-500 text-white py-10 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-2xl font-bold mb-1">\ud83d\udcdd \u548c\u6da6\u5fc3\u8bed\u8005\u7533\u8bf7\u6ce8\u518c</h1>
          <p className="text-white/90 text-sm">\u52a0\u5165\u8ba1\u5212 \u00b7 \u63d0\u4ea4\u4fe1\u606f \u00b7 \u5f00\u59cb\u57f9\u8bad \u00b7 \u63d0\u4f9b\u670d\u52a1</p>
          {/* Step indicator */}
          <div className="flex items-center gap-2 mt-5">
            {[1,2,3].map(n => (
              <>
                <div key={n} className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                  n === step ? 'bg-white text-rose-600' : n < step ? 'bg-white/40 text-white' : 'bg-white/20 text-white/50'
                }`}>{n < step ? '\u2713' : n}</div>
                {n < 3 && <div className="h-0.5 w-8 bg-white/30" />}
              </>
            ))}
            <span className="ml-2 text-sm text-white/80">
              {step === 1 && '\u57fa\u672c\u4fe1\u606f'}
              {step === 2 && '\u4e13\u4e1a\u80cc\u666f'}
              {step === 3 && '\u670d\u52a1\u627f\u8bfa'}
            </span>
          </div>
        </div>
      </section>

      <section className="py-10 px-4">
        <div className="max-w-2xl mx-auto">

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="font-bold text-gray-900 text-lg mb-2">\u7b2c\u4e00\u6b65\uff1a\u57fa\u672c\u4fe1\u606f</h2>
              {([
                { key: 'fullName',  label: '\u771f\u5b9e\u59d3\u540d *', placeholder: '\u5982\uff1a\u674e\u5c0f\u6d77', type: 'text' },
                { key: 'phone',    label: '\u624b\u673a\u53f7\u7801 *', placeholder: '138 0000 0000', type: 'tel' },
                { key: 'email',    label: '\u7535\u5b50\u90ae\u7bb1 *', placeholder: 'you@university.edu.cn', type: 'email' },
                { key: 'city',     label: '\u6240\u5728\u57ce\u5e02 *', placeholder: '\u5982\uff1a\u5317\u4eac', type: 'text' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type={f.type} value={form[f.key] as string}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              ))}
              <button
                onClick={() => step1Ok && setStep(2)}
                disabled={!step1Ok}
                className="w-full bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 disabled:opacity-40 transition-colors mt-2"
              >
                \u4e0b\u4e00\u6b65\uff1a\u4e13\u4e1a\u80cc\u666f \u2192
              </button>
            </div>
          )}

          {/* Step 2: Professional Background */}
          {step === 2 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-gray-900 text-lg mb-2">\u7b2c\u4e8c\u6b65\uff1a\u4e13\u4e1a\u80cc\u666f</h2>
              {([
                { key: 'university', label: '\u5c31\u8bfb\u9662\u6821 *', placeholder: '\u5982\uff1a\u5317\u4eac\u5927\u5b66' },
                { key: 'department', label: '\u6240\u5728\u9662\u7cfb/\u4e13\u4e1a *', placeholder: '\u5982\uff1a\u5fc3\u7406\u5b66\u9662\u5e94\u7528\u5fc3\u7406\u5b66' },
              ] as const).map(f => (
                <div key={f.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
                  <input
                    type="text" value={form[f.key] as string}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                  />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">\u5c31\u8bfb\u5e74\u7ea7 *</label>
                <select
                  value={form.yearOfStudy}
                  onChange={e => set('yearOfStudy', e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
                >
                  <option value="">\u8bf7\u9009\u62e9</option>
                  {['\u5927\u4e00','\u5927\u4e8c','\u5927\u4e09','\u5927\u56db','\u7814\u4e00','\u7814\u4e8c','\u7814\u4e09','\u535a\u58eb\u5728\u8bfb','\u5df2\u6bd5\u4e1a'].map((y,i) => (
                    <option key={i} value={i+1}>{y}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">\u670d\u52a1\u65b9\u5411 *\uff08\u53ef\u591a\u9009\uff09</label>
                <div className="grid grid-cols-1 gap-3">
                  {SPECIALIZATIONS.map(s => (
                    <label
                      key={s.id}
                      className={`flex items-start gap-3 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        form.specializations.includes(s.id)
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-gray-200 hover:border-rose-200'
                      }`}
                    >
                      <input
                        type="checkbox" checked={form.specializations.includes(s.id)}
                        onChange={() => toggleSpec(s.id)}
                        className="mt-0.5 accent-rose-500"
                      />
                      <div>
                        <p className="font-medium text-sm text-gray-900">{s.icon} {s.label}</p>
                        <p className="text-xs text-gray-500">{s.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">
                  \u2190 \u8fd4\u56de
                </button>
                <button
                  onClick={() => step2Ok && setStep(3)}
                  disabled={!step2Ok}
                  className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 disabled:opacity-40 transition-colors"
                >
                  \u4e0b\u4e00\u6b65\uff1a\u670d\u52a1\u627f\u8bfa \u2192
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Agreements */}
          {step === 3 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm space-y-5">
              <h2 className="font-bold text-gray-900 text-lg mb-2">\u7b2c\u4e09\u6b65\uff1a\u670d\u52a1\u627f\u8bfa</h2>
              <p className="text-sm text-gray-500">\u8bf7\u4ed4\u7ec6\u9605\u8bfb\u5e76\u52fe\u9009\u4ee5\u4e0b\u6761\u6b3e\uff0c\u65b9\u53ef\u5b8c\u6210\u7533\u8bf7\u3002</p>

              {[
                {
                  key: 'backgroundCheckConsent' as const,
                  title: '\u80cc\u666f\u8c03\u67e5\u540c\u610f *',
                  desc: '\u6211\u540c\u610f\u548c\u6da6\u5fc3\u8bed\u8005\u9879\u76ee\u5bf9\u6211\u8fdb\u884c\u5fc5\u8981\u7684\u80cc\u666f\u4fe1\u606f\u6838\u67e5\uff0c\u5305\u62ec\u8eab\u4efd\u8bc1\u660e\u548c\u65e0\u72af\u7f6a\u5386\u786e\u8ba4\u3002',
                },
                {
                  key: 'volunteerCommitment' as const,
                  title: '\u5fd7\u613f\u670d\u52a1\u627f\u8bfa *',
                  desc: '\u6211\u627f\u8bfa\u6bcf\u6708\u81f3\u5c11\u63d0\u4f9b 10 \u5c0f\u65f6\u670d\u52a1\uff0c\u5e76\u6309\u548c\u6da6\u5fc3\u8bed\u8005\u884c\u4e3a\u51c6\u5219\u884c\u4e8b\u3002',
                },
                {
                  key: 'confidentiality' as const,
                  title: '\u4fdd\u5bc6\u534f\u8bae *',
                  desc: '\u6211\u627f\u8bfa\u4fdd\u62a4\u670d\u52a1\u5bf9\u8c61\u7684\u4e2a\u4eba\u4fe1\u606f\uff0c\u4e0d\u5c06\u4efb\u4f55\u670d\u52a1\u5185\u5bb9\u6cc4\u9732\u4e8e\u672a\u6388\u6743\u7b2c\u4e09\u65b9\u3002',
                },
              ].map(a => (
                <label key={a.key} className="flex items-start gap-3 p-4 border-2 border-gray-200 rounded-xl cursor-pointer hover:border-rose-200 transition-colors">
                  <input
                    type="checkbox" checked={form[a.key]}
                    onChange={e => set(a.key, e.target.checked)}
                    className="mt-0.5 accent-rose-500 w-4 h-4"
                  />
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{a.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{a.desc}</p>
                  </div>
                </label>
              ))}

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(2)} className="flex-1 border border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50">
                  \u2190 \u8fd4\u56de
                </button>
                <button
                  onClick={submit}
                  disabled={!step3Ok || loading}
                  className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-semibold hover:bg-rose-600 disabled:opacity-40 transition-colors"
                >
                  {loading ? '\u63d0\u4ea4\u4e2d...' : '\u63d0\u4ea4\u7533\u8bf7 \ud83c\udf38'}
                </button>
              </div>
            </div>
          )}

        </div>
      </section>
    </main>
  )
}
