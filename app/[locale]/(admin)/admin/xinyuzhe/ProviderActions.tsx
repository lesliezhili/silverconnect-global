'use client'
import { useState } from 'react'

export default function XinyuzheProviderActions({
  id,
  status,
}: {
  id: string
  status: string
}) {
  const [current, setCurrent] = useState(status)
  const [loading, setLoading] = useState(false)

  async function update(newStatus: string) {
    setLoading(true)
    const res = await fetch('/api/xinyuzhe/providers', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus }),
    })
    if (res.ok) setCurrent(newStatus)
    setLoading(false)
  }

  if (current === 'approved') {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-green-600 text-xs font-semibold">✓ 已通过</span>
        <button onClick={() => update('suspended')} disabled={loading}
          className="text-xs text-red-500 hover:underline disabled:opacity-50">
          暂停
        </button>
      </div>
    )
  }
  if (current === 'rejected' || current === 'suspended') {
    return (
      <div className="flex gap-2 items-center">
        <span className="text-red-500 text-xs">{current === 'suspended' ? '已暂停' : '已拒绝'}</span>
        <button onClick={() => update('approved')} disabled={loading}
          className="text-xs text-green-600 hover:underline disabled:opacity-50">
          恢复
        </button>
      </div>
    )
  }
  // pending
  return (
    <div className="flex gap-2">
      <button onClick={() => update('approved')} disabled={loading}
        className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:opacity-50">
        {loading ? '...' : '通过'}
      </button>
      <button onClick={() => update('rejected')} disabled={loading}
        className="px-3 py-1 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 disabled:opacity-50">
        {loading ? '...' : '拒绝'}
      </button>
    </div>
  )
}
