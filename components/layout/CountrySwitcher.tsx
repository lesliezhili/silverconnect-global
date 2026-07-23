"use client";

import * as React from "react";
import * as Dropdown from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/components/ui/cn";
import { COUNTRY_FLAG, type CountryCode } from "./CountrySelector";

const COOKIE_NAME = "sc-country";
const ONE_YEAR = 60 * 60 * 24 * 365;

/**
 * Compact country chip — AU always, CN only for the small internal
 * allowlist previewing the future mainland deployment (see
 * lib/auth/chinaSiteAccess.ts — the current CN option runs on the
 * AU-hosted stack, which doesn't actually work for mainland users yet).
 * Persists choice to cookie and refreshes route.
 */
export function CountrySwitcher({
  value,
  className,
}: {
  value: CountryCode;
  className?: string;
}) {
  const t = useTranslations("country");
  const router = useRouter();
  const [chinaSiteAllowed, setChinaSiteAllowed] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/auth/china-site-access")
      .then((r) => r.json())
      .then((d) => setChinaSiteAllowed(Boolean(d.allowed)))
      .catch(() => setChinaSiteAllowed(false));
  }, []);

  const onSelect = (next: CountryCode) => {
    if (next === value) return;
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=${ONE_YEAR}; samesite=lax`;
    router.refresh();
  };

  return (
    <Dropdown.Root>
      <Dropdown.Trigger
        aria-label={`Country: ${value}`}
        className={cn(
          "inline-flex h-12 min-w-touch items-center justify-center gap-1 rounded-pill border-[1.5px] border-border bg-bg-surface px-2 text-[16px] font-semibold text-text-primary sm:px-3",
          className
        )}
      >
        <span aria-hidden>{COUNTRY_FLAG[value]}</span>
        <span className="hidden sm:inline">{value}</span>
        <ChevronDown size={14} className="ml-0.5 hidden sm:inline" aria-hidden />
      </Dropdown.Trigger>
      <Dropdown.Portal>
        <Dropdown.Content
          align="end"
          sideOffset={6}
          className="z-50 min-w-[180px] rounded-md border border-border bg-bg-base p-1 shadow-popover"
        >
          {/* 🇦🇺 Australia */}
          <Dropdown.Item
            onSelect={() => onSelect("AU")}
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-body text-text-primary outline-none hover:bg-bg-surface focus:bg-bg-surface",
              value === "AU" && "bg-bg-surface-2 font-semibold"
            )}
          >
            <span aria-hidden>🇦🇺</span>
            <span>{t("AU")}</span>
          </Dropdown.Item>

          {/* 🇨🇳 China / 九鼎 — internal preview only, see chinaSiteAccess.ts */}
          {chinaSiteAllowed && (
            <Dropdown.Item
              onSelect={() => onSelect("CN")}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-sm px-3 py-2 text-body text-text-primary outline-none hover:bg-bg-surface focus:bg-bg-surface",
                value === "CN" && "bg-bg-surface-2 font-semibold"
              )}
            >
              <span aria-hidden>🇨🇳</span>
              <span>{t("CN")}</span>
            </Dropdown.Item>
          )}
        </Dropdown.Content>
      </Dropdown.Portal>
    </Dropdown.Root>
  );
}
