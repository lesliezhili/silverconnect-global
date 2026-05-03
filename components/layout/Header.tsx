"use client";

import * as React from "react";
import { Search, User } from "lucide-react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { CountrySelector, type CountryCode } from "./CountrySelector";
import { LanguageSelector } from "./LanguageSelector";

export interface HeaderProps {
  signedIn?: boolean;
  initialCountry?: CountryCode;
}

export function Header({ signedIn = false, initialCountry = "AU" }: HeaderProps) {
  const t = useTranslations("common");
  const [country, setCountry] = React.useState<CountryCode>(initialCountry);

  return (
    <header
      role="banner"
      className="sticky top-0 z-40 h-20 w-full border-b border-border bg-bg-base"
    >
      <div className="mx-auto flex h-full max-w-content items-center gap-3 px-4">
        <Link
          href="/"
          className="text-h3 font-bold text-text-primary"
          aria-label="SilverConnect home"
        >
          SilverConnect
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <CountrySelector value={country} onChange={setCountry} />
          <LanguageSelector />
          <button
            aria-label={t("search")}
            className="hidden min-h-touch min-w-touch items-center justify-center rounded-md text-text-primary hover:bg-bg-surface sm:inline-flex"
          >
            <Search size={24} aria-hidden />
          </button>
          {signedIn ? (
            <Link
              href="/profile"
              aria-label="Profile"
              className="inline-flex min-h-touch min-w-touch items-center justify-center rounded-full bg-bg-surface text-text-primary"
            >
              <User size={24} aria-hidden />
            </Link>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth/login">{t("signIn")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
