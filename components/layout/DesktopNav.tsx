"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui/cn";

const ITEMS = [
  { key: "home", href: "/home", match: /^\/home/ },
  { key: "services", href: "/services", match: /^\/services/ },
  { key: "bookings", href: "/bookings", match: /^\/bookings/ },
  { key: "messages", href: "/chat", match: /^\/chat/ },
] as const;

/** Inline horizontal nav shown only at sm+ inside the Header. */
export function DesktopNav() {
  const t = useTranslations("nav");
  const pathname = usePathname() ?? "";

  return (
    <nav
      aria-label={t("primary")}
      className="ml-6 hidden gap-1 lg:flex"
    >
      {ITEMS.map((it) => {
        const active = it.match.test(pathname);
        return (
          <Link
            key={it.key}
            href={it.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "inline-flex h-10 items-center rounded-md px-4 text-[16px] font-semibold",
              active
                ? "bg-brand-soft text-brand"
                : "text-text-secondary hover:bg-bg-surface-2"
            )}
          >
            {t(it.key)}
          </Link>
        );
      })}
    </nav>
  );
}
