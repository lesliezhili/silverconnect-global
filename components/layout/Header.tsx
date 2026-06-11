"use client";

import * as React from "react";
import { ChevronLeft, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { type CountryCode } from "./CountrySelector";
import { CountrySwitcher } from "./CountrySwitcher";
import { DesktopNav } from "./DesktopNav";
import { LanguageChip } from "./LanguageSelector";

export interface HeaderProps {
  back?: boolean;
  onBack?: () => void;
  country?: CountryCode;
  signedIn?: boolean;
  initials?: string;
  rightExtra?: React.ReactNode;
}

export function Header({
  back = false,
  onBack,
  country = "AU",
  signedIn = false,
  initials,
  rightExtra,
}: HeaderProps) {
  const t = useTranslations("common");
  const locale = useLocale();
  const isChinese = locale === "zh" || locale === "zh_tw";
  const tNav = useTranslations("nav");
  const router = useRouter();

  const handleBack = () => {
    if (onBack) onBack();
    else router.back();
  };

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-bg-base px-4 sm:h-20 sm:px-8"
    >
      <div className="flex min-w-0 items-center gap-2">
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
            href="/"
            className="flex items-baseline gap-1.5 text-[20px] font-extrabold tracking-tight text-brand sm:text-[24px]"
            aria-label={country === "CN" ? "九鼎银联" : "SilverConnect home"}
          >
            {country === "CN" ? (
              <>
                <span className="text-[24px] sm:text-[28px]">九鼎银联</span>
                <span className="text-[12px] font-bold text-brand/60 sm:text-[14px]">非营利互助平台</span>
              </>
            ) : (
              <>
                SilverConnect
                {isChinese && (
                  <span className="text-[14px] font-bold text-brand/70 sm:text-[16px]">和润</span>
                )}
              </>
            )}
          </Link>
        )}
        <DesktopNav signedIn={signedIn} />
      </div>
      <div className="flex items-center gap-1.5">
        {rightExtra}
        <CountrySwitcher value={country} />
        <LanguageChip />
        {signedIn ? (
          <Link
            href="/profile"
            aria-label={tNav("profile")}
            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-accent-soft text-[16px] font-bold text-[#92590A] dark:text-[var(--brand-accent)]"
          >
            {initials ?? <User size={22} aria-hidden />}
          </Link>
        ) : (
          <Link
            href="/auth/login"
            className="inline-flex h-12 items-center rounded-md bg-brand px-4 text-[16px] font-bold text-white hover:bg-brand-hover"
          >
            {t("signIn")}
          </Link>
        )}
      </div>
    </header>
  );
}
