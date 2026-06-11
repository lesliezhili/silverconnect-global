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
  zh: "中文 (简体)",
  zh_tw: "中文 (繁體)",
  th: "ภาษาไทย",
  ko: "한국어",
  ja: "日本語",
  vi: "Tiếng Việt",
};

const SHORT: Record<Locale, string> = {
  en: "EN",
  zh: "中文",
  zh_tw: "繁體",
  th: "ไทย",
  ko: "한국",
  ja: "日本",
  vi: "Việt",
};

/** Compact language switcher dropdown chip used in the mobile header. */
export function LanguageChip({ className }: { locale?: Locale; className?: string }) {
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
        aria-label={`Language: ${LABELS[locale]}`}
        className={cn(
          "inline-flex h-12 min-w-touch items-center justify-center gap-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-2 text-[16px] font-semibold text-text-primary sm:px-3",
          className
        )}
      >
        <span aria-hidden>🌐</span>
        <span className="hidden sm:inline">{SHORT[locale]}</span>
        <ChevronDown size={14} className="ml-0.5 hidden sm:inline" aria-hidden />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-md border border-border bg-bg-base p-1 shadow-popover"
        >
          {routing.locales.map((l) => (
            <Dropdown.Item
              key={l}
              onSelect={() => switchTo(l)}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-body text-text-primary outline-none hover:bg-bg-surface focus:bg-bg-surface",
                l === locale && "bg-bg-surface font-bold"
              )}
            >
              <span className="w-16 text-sm">{SHORT[l]}</span>
              <span>{LABELS[l]}</span>
            </Dropdown.Item>
          ))}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
