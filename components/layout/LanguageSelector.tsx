"use client";

import * as React from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { routing, type Locale } from "@/i18n/routing";
import { cn } from "@/components/ui/cn";

const LABELS: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export function LanguageSelector({ className }: { className?: string }) {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();

  const switchTo = (next: Locale) => {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label="Language"
        className={cn(
          "inline-flex h-touch-btn min-w-[88px] items-center gap-1 rounded-md border border-border bg-bg-base px-3 text-body text-text-primary",
          className
        )}
      >
        <span className="font-semibold">{LABELS[locale]}</span>
        <ChevronDown size={16} className="ml-auto" aria-hidden />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={4}
          className="z-50 min-w-[140px] rounded-md border border-border bg-bg-base p-1 shadow-card"
        >
          {routing.locales.map((l) => (
            <Dropdown.Item
              key={l}
              onSelect={() => switchTo(l)}
              className="flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-body text-text-primary outline-none hover:bg-bg-surface focus:bg-bg-surface"
            >
              <span>{LABELS[l]}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
