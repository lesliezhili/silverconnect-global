"use client";

import * as React from "react";
import { ChevronLeft } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import { CountryChip, type CountryCode } from "./CountrySelector";
import { LanguageChip } from "./LanguageSelector";

export interface HeaderProps {
  back?: boolean;
  onBack?: () => void;
  country?: CountryCode;
  rightExtra?: React.ReactNode;
}

export function Header({ back = false, onBack, country = "AU", rightExtra }: HeaderProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("common");
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-base px-4"
    >
      <div className="flex items-center gap-2">
        {back ? (
          <button
            type="button"
            onClick={handleBack}
            aria-label={t("back")}
            className="-ml-2 inline-flex h-12 w-12 items-center justify-center rounded-md text-text-primary hover:bg-bg-surface-2"
          >
            <ChevronLeft size={24} aria-hidden />
          </button>
        ) : (
          <Link
            href="/home"
            className="text-[20px] font-extrabold tracking-tight text-brand"
            aria-label="SilverConnect home"
          >
            SilverConnect
          </Link>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        {rightExtra}
        <CountryChip value={country} locale={locale} />
        <LanguageChip locale={locale} />
      </div>
    </header>
  );
}
