'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function BookingForm() {
  const params = useParams<{ locale: string }>()
  const searchParams = useSearchParams()
  const locale = (params?.locale as string) || 'zh'
  const service = searchParams?.get('service') || ''

  const [form, setForm] = useState({ name: '', email: '', phone: '', date: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('submitting')
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, service }),
      })
      setStatus(res.ok ? 'success' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <main className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <div className="text-6xl mb-4">🌸</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">预约申请已提交</h1>
        <p className="text-sm text-gray-500 mb-6">
          我们将在24小时内通过邮件与您联系。
        </p>
        <Link href={`/${locale}/home`}
          className="bg-rose-500 text-white px-8 py-3 rounded-full text-sm font-semibold hover:bg-rose-600 transition-colors">
          返回首页
        </Link>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-white font-sans pb-24">
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-gray-100 px-4 py-3 flex items-center">
        <Link href={`/${locale}/xinyuzhe`} className="text-sm text-gray-500 hover:text-rose-600 transition-colors mr-3">
          ← 返回
        </Link>
        <span className="font-semibold text-gray-900 text-sm flex-1 text-center">预约服务</span>
      </div>

      <div className="px-4 py-6">
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <span className="text-2xl">🌸</span>
          <div>
            <p className="text-xs text-rose-600 font-medium">和润心语者</p>
            <p className="text-sm font-semibold text-gray-900">情感智能与数字生命服务</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              姓名 <span className="text-rose-500">*</span>
            </label>
            <input required type="text" value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="您的姓名"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              联系邮筱 <span className="text-rose-500">*</span>
            </label>
            <input required type="email" value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              placeholder="example@email.com"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">联系电话</label>
            <input type="tel" value={form.phone}
              onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
              placeholder="+61 400 000 000"
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">期望日期</label>
            <input type="date" value={form.date}
              onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">备注留言</label>
            <textarea rows={3} value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="请告知您的具体需求..."
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none" />
          </div>

          {status === 'error' && (
            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-4 py-3">
              提交失败，请稍后重试或发邮件至 hello@silverconnect.app
            </p>
          )}

          <button type="submit" disabled={status === 'submitting'}
            className="w-full bg-rose-600 text-white py-3.5 rounded-xl text-sm font-semibold hover:bg-rose-700 disabled:opacity-50 transition-colors mt-2">
            {status === 'submitting' ? '提交中...' : '确认预约申请'}
          </button>

          <p className="text-center text-xs text-gray-400 pt-1">
            提交后我们将在24小时内通过邮件确认
          </p>
        </form>
      </div>
    </main>
  )
}

export default function BookingNewPage() {
  return (
    <Suspense>
      <BookingForm />
    </Suspense>
  )
}
