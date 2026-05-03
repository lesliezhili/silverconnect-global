"use client";

import * as React from "react";
import { Home, Grid3x3, Calendar, MessageCircle, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/components/ui/cn";

const TABS = [
  { key: "home", href: "/home", Icon: Home },
  { key: "services", href: "/services", Icon: Grid3x3 },
  { key: "bookings", href: "/bookings", Icon: Calendar },
  { key: "messages", href: "/chat", Icon: MessageCircle },
  { key: "profile", href: "/profile", Icon: User },
] as const;

export function BottomTabBar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <nav
      role="navigation"
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-bg-base sm:hidden"
    >
      <ul className="mx-auto flex max-w-content">
        {TABS.map(({ key, href, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <li key={key} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex h-16 flex-col items-center justify-center gap-0.5 text-small",
                  active ? "text-brand" : "text-text-secondary"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon size={28} aria-hidden />
                <span>{t(key)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
