'use client'
import { useState } from 'react'
import Link from 'next/link'
import { SERVICE_TYPES, CITIES } from '@/lib/types/xinyuzhe'
import type { ProviderRegistrationData } from '@/lib/types/xinyuzhe'

const EMPTY: ProviderRegistrationData = {
  name: '', gender: '', phone: '', email: '', city: '',
  education: '', major: '', university: '',
  licenseType: '', licenseNumber: '', yearsExperience: 0,
  serviceTypes: [], bio: '',
  agreeTerms: false, agreeBackground: false,
}

const STEPS = ['个人信息', '资质与服务', '确认提交']

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}

export default function XinyuzheRegistrationPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<ProviderRegistrationData>(EMPTY)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  function set(k: keyof ProviderRegistrationData, v: unknown) {
    setForm(f => ({ ...f, [k]: v }))
  }

  function toggleService(id: string) {
    set('serviceTypes', form.serviceTypes.includes(id)
      ? form.serviceTypes.filter(s => s !== id)
      : [...form.serviceTypes, id])
  }

  async function submit() {
    setSubmitting(true)
    setError('')
    try {
      const res = await fetch('/api/xinyuzhe/registration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw new Error('提交失败，请重试')
      setSubmitted(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : '未知错误')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-rose-300'
  const selectCls = inputCls

  if (submitted) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl p-10 text-center max-w-md shadow-md">
          <div className="text-5xl mb-4">🌸</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">申请已提交！</h2>
          <p className="text-gray-600 text-sm mb-6">
            感谢您申请成为和润心语者。我们将在 3−5 个工作日内审核您的资主并通过电子邮件通知您。
          </p>
          <Link href="/zh/xinyuzhe" className="bg-rose-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-rose-600 transition">
            返回主页
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-xl mx-auto">

        {/* 标题 */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-2">🔏</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">心语者注册申请</h1>
          <p className="text-gray-500 text-sm">和润心语者 · 老年心理健康服务提供商</p>
        </div>

        {/* 步骤条 */}
        <div className="flex items-center gap-2 mb-8">
          {STEPS.map((s, i) => (
            <>
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  i <= step ? 'bg-rose-500 text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {i < step ? '✓' : i + 1}
                </div>
                <span className={`text-sm ${i <= step ? 'text-rose-600 font-medium' : 'text-gray-400'}`}>{s}</span>
              </div>
              {i < STEPS.length - 1 && <div className="flex-1 h-0.5 bg-gray-200" />}
            </>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-6">

          {/* 第一步：个人信息 */}
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg mb-4">个人基本信息</h2>
              <Field label="姓名" required>
                <input className={inputCls} value={form.name} onChange={e => set('name', e.target.value)} placeholder="请输入您的姓名" />
              </Field>
              <Field label="性别" required>
                <select className={selectCls} value={form.gender} onChange={e => set('gender', e.target.value)}>
                  <option value="">请选择</option>
                  <option>男</option><option>女</option><option>其他</option>
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="手机号" required>
                  <input className={inputCls} value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="13x xxxx xxxx" />
                </Field>
                <Field label="所在城市" required>
                  <select className={selectCls} value={form.city} onChange={e => set('city', e.target.value)}>
                    <option value="">请选择</option>
                    {CITIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="电子邮件" required>
                <input type="email" className={inputCls} value={form.email} onChange={e => set('email', e.target.value)} placeholder="example@email.com" />
              </Field>
              <Field label="最高学历" required>
                <select className={selectCls} value={form.education} onChange={e => set('education', e.target.value)}>
                  <option value="">请选择</option>
                  {['大专','本科','硕士','博士','其他'].map(e => <option key={e}>{e}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="专业">
                  <input className={inputCls} value={form.major} onChange={e => set('major', e.target.value)} placeholder="如：心理学" />
                </Field>
                <Field label="毕业院校">
                  <input className={inputCls} value={form.university} onChange={e => set('university', e.target.value)} placeholder="院校名称" />
                </Field>
              </div>
            </div>
          )}

          {/* 第二步：资质与服务 */}
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-gray-900 text-lg mb-4">资质认证与服务选择</h2>
              <Field label="执业设备/资质类型">
                <select className={selectCls} value={form.licenseType} onChange={e => set('licenseType', e.target.value)}>
                  <option value="">请选择</option>
                  {['心理咋课师证书','社会工作者证书','护论艥落证书','医师资格证（心理科）','社区工作者证书','无，但正在培训中'].map(v => <option key={v}>{v}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="证书编号">
                  <input className={inputCls} value={form.licenseNumber} onChange={e => set('licenseNumber', e.target.value)} placeholder="证书编号" />
                </Field>
                <Field label="相关工作年限">
                  <input type="number" min={0} max={40} className={inputCls}
                    value={form.yearsExperience || ''} onChange={e => set('yearsExperience', Number(e.target.value))} placeholder="0" />
                </Field>
              </div>
              <Field label="拟提供的服务类型" required>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SERVICE_TYPES.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => toggleService(s.id)}
                      className={`flex items-start gap-2 p-3 rounded-xl border-2 text-left transition ${
                        form.serviceTypes.includes(s.id)
                          ? 'border-rose-400 bg-rose-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-lg flex-shrink-0">{s.icon}</span>
                      <div>
                        <p className="text-sm font-medium text-gray-800">{s.label}</p>
                        <p className="text-xs text-gray-400">{s.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="个人简介">
                <textarea rows={3} className={inputCls} value={form.bio}
                  onChange={e => set('bio', e.target.value)}
                  placeholder="请简述您的服务理念与与老年群体工作的动机…" />
              </Field>
            </div>
          )}

          {/* 第三步：确认提交 */}
          {step === 2 && (
            <div className="space-y-5">
              <h2 className="font-bold text-gray-900 text-lg mb-2">确认信息</h2>
              <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">姓名：</span>{form.name}</p>
                <p><span className="font-medium">手机：</span>{form.phone}</p>
                <p><span className="font-medium">城市：</span>{form.city}</p>
                <p><span className="font-medium">学历：</span>{form.education} {form.major}</p>
                <p><span className="font-medium">服务：</span>
                  {SERVICE_TYPES.filter(s => form.serviceTypes.includes(s.id)).map(s => s.label).join('、') || '未选择'}
                </p>
              </div>
              <div className="space-y-3">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={form.agreeTerms}
                    onChange={e => set('agreeTerms', e.target.checked)} />
                  <span className="text-sm text-gray-600">
                    我已阅读并同意《和润心语者服务协议》和《个人信息保护政策》。
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1" checked={form.agreeBackground}
                    onChange={e => set('agreeBackground', e.target.checked)} />
                  <span className="text-sm text-gray-600">
                    我同意进行资质核实和背景调查。
                  </span>
                </label>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
            </div>
          )}

          {/* 按钮层 */}
          <div className="flex justify-between mt-8">
            {step > 0
              ? <button onClick={() => setStep(s => s - 1)} className="text-sm text-gray-500 hover:text-gray-700">← 上一步</button>
              : <Link href="/zh/xinyuzhe" className="text-sm text-gray-400 hover:text-gray-600">← 返回</Link>
            }
            {step < 2
              ? <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={step === 0 ? !form.name || !form.phone || !form.email : form.serviceTypes.length === 0}
                  className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 hover:bg-rose-600 transition"
                >
                  下一步 →
                </button>
              : <button
                  onClick={submit}
                  disabled={submitting || !form.agreeTerms || !form.agreeBackground}
                  className="bg-rose-500 text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50 hover:bg-rose-600 transition"
                >
                  {submitting ? '提交中…' : '正式提交'}
                </button>
            }
          </div>
        </div>
      </div>
    </main>
  )
}
