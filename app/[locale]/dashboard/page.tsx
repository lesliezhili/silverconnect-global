"use client";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function DashboardPage() {
  const { locale } = useParams();
  const isZh = locale === "zh";
  const actions = [
    { href: `/${locale}/book`, icon: "📅", label: isZh?"预约服务":"Book a Service" },
    { href: `/${locale}/chat`, icon: "💬", label: isZh?"AI助手":"AI Companion" },
    { href: `/${locale}/biography`, icon: "📖", label: isZh?"人生传记":"My Biography" },
    { href: `/${locale}/services`, icon: "🔍", label: isZh?"浏览服务":"Browse Services" },
  ];
  return (
    <main className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">{isZh?"欢迎回来 👋":"Welcome Back 👋"}</h1>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {actions.map(a=>(
            <Link key={a.href} href={a.href} className="p-6 bg-white rounded-xl shadow hover:shadow-lg transition text-center">
              <div className="text-3xl mb-2">{a.icon}</div><div className="font-medium text-sm">{a.label}</div>
            </Link>))}
        </div>
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="font-semibold text-lg mb-4">{isZh?"安全状态":"Safety Status"}</h2>
          <p className="text-green-700 bg-green-50 p-4 rounded-lg">✅ {isZh?"紧急检入系统已激活":"Emergency check-in system active"}</p>
        </div>
      </div>
    </main>);
}
