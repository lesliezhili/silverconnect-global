"use client";

import * as React from "react";
import {
  LayoutDashboard,
  Scale,
  ShieldAlert,
  Users,
  RotateCcw,
  BarChart3,
  LogOut,
  Menu,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui/cn";

const NAV = [
  { key: "navOverview", href: "/admin", Icon: LayoutDashboard, exact: true },
  { key: "navDisputes", href: "/admin/disputes", Icon: Scale, exact: false },
  { key: "navSafety", href: "/admin/safety", Icon: ShieldAlert, exact: false },
  { key: "navProviders", href: "/admin/providers", Icon: Users, exact: false },
  { key: "navRefunds", href: "/admin/refunds", Icon: RotateCcw, exact: false },
  { key: "navAnalytics", href: "/admin/analytics", Icon: BarChart3, exact: false },
] as const;

export function AdminShell({
  email,
  children,
}: {
  email: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("admin");
  const pathname = usePathname();
  const [openMobile, setOpenMobile] = React.useState(false);

  return (
    <div className="min-h-screen bg-bg-surface-2">
      {/* Top bar */}
      <header
        role="banner"
        className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-bg-base px-4 sm:px-6"
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpenMobile((v) => !v)}
            aria-label={t("menuToggle")}
            aria-expanded={openMobile}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-text-primary hover:bg-bg-surface-2 sm:hidden"
          >
            <Menu size={20} aria-hidden />
          </button>
          <p className="text-[16px] font-extrabold tracking-tight">
            SilverConnect <span className="text-brand">Admin</span>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-[13px] text-text-tertiary sm:inline">
            {email}
          </span>
          <Link
            href="/admin/logout"
            aria-label={t("signOut")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border-[1.5px] border-border-strong bg-bg-base text-text-primary"
          >
            <LogOut size={18} aria-hidden />
          </Link>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-[1280px]">
        {/* Sidebar (desktop) */}
        <aside
          aria-label={t("sidebar")}
          className={cn(
            "fixed inset-y-14 left-0 z-30 w-64 shrink-0 border-r border-border bg-bg-base p-4 sm:sticky sm:top-14 sm:h-[calc(100vh-3.5rem)]",
            openMobile ? "block" : "hidden sm:block"
          )}
        >
          <nav>
            <ul className="flex flex-col gap-1">
              {NAV.map(({ key, href, Icon, exact }) => {
                const on = exact ? pathname === href : pathname?.startsWith(href);
                return (
                  <li key={key}>
                    <Link
                      href={href}
                      onClick={() => setOpenMobile(false)}
                      aria-current={on ? "page" : undefined}
                      className={cn(
                        "flex h-11 items-center gap-3 rounded-md px-3 text-[14px] font-semibold",
                        on
                          ? "bg-brand-soft text-brand"
                          : "text-text-primary hover:bg-bg-surface-2"
                      )}
                    >
                      <Icon size={18} aria-hidden />
                      <span>{t(key)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </aside>

        <main
          id="main-content"
          className="min-w-0 flex-1 px-5 py-6 sm:px-8 sm:py-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
