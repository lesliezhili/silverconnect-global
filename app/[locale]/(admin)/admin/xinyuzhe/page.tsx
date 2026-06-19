import { setRequestLocale } from 'next-intl/server'
import { redirect } from '@/i18n/navigation'
import { AdminShell } from '@/components/layout/AdminShell'
import { getAdmin } from '@/components/domain/adminCookie'
import { db } from '@/lib/db'
import { xinyuzheProviders } from '@/lib/db/schema/xinyuzhe'
import { desc } from 'drizzle-orm'
import XinyuzheProviderActions from './ProviderActions'

export const dynamic = 'force-dynamic'

export default async function AdminXinyuzhePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  setRequestLocale(locale)
  const admin = await getAdmin()
  if (!admin.signedIn) redirect({ href: '/admin/login', locale })

  const providers = await db
    .select()
    .from(xinyuzheProviders)
    .orderBy(desc(xinyuzheProviders.createdAt))
    .limit(100)

  const pending   = providers.filter(p => p.status === 'pending')
  const approved  = providers.filter(p => p.status === 'approved')
  const rejected  = providers.filter(p => p.status === 'rejected' || p.status === 'suspended')

  return (
    <AdminShell email={admin.email ?? ''}>
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            和润心语者 — 服务者申请管理
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            待审核 {pending.length} 人· 已通过 {approved.length} 人· 已拒绝/暂停 {rejected.length} 人
          </p>
        </div>

        {pending.length === 0 && (
          <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-xl">
            暂无待审核申请
          </div>
        )}

        {[{ title: '待审核', list: pending, badge: 'bg-amber-100 text-amber-800' },
          { title: '已通过', list: approved, badge: 'bg-green-100 text-green-800' },
          { title: '已拒绝/暂停', list: rejected, badge: 'bg-red-100 text-red-800' }]
          .map(({ title, list, badge }) => list.length > 0 && (
          <div key={title} className="mb-8">
            <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <span className={'px-2 py-0.5 rounded-full text-xs font-bold ' + badge}>{title}</span>
              <span className="text-gray-400 text-sm">{list.length} 人</span>
            </h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3 text-left">姓名</th>
                    <th className="px-4 py-3 text-left">联系方式</th>
                    <th className="px-4 py-3 text-left">城市 / 学历</th>
                    <th className="px-4 py-3 text-left">服务类型</th>
                    <th className="px-4 py-3 text-left">申请时间</th>
                    <th className="px-4 py-3 text-left">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {list.map(p => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{p.fullName}</td>
                      <td className="px-4 py-3 text-gray-500">
                        <div>{p.phone}</div>
                        <div className="text-xs">{p.email}</div>
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        <div>{p.city || '—'}</div>
                        <div className="text-xs">{p.education || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {(p.serviceTypes || []).map((s: string) => (
                            <span key={s} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">{s}</span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString('zh-CN') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <XinyuzheProviderActions id={p.id} status={p.status ?? 'pending'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </AdminShell>
  )
}
