"use client";

import * as React from "react";
import { Star, ShieldCheck, Heart } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { CountryCode } from "@/components/layout";
import { CURRENCY_SYMBOL } from "./country";
import { ProviderAvatar } from "./ProviderAvatar";

export interface ProviderCardData {
  id: string;
  name: string;
  initials: string;
  hue?: 0 | 1 | 2 | 3;
  rating: number;
  reviews: number;
  distanceKm: string;
  pricePerHour: number;
  verified?: boolean;
  firstAid?: boolean;
}

export function ProviderCard({
  provider,
  country,
  compact = false,
  initialFavourited = false,
}: {
  provider: ProviderCardData;
  country: CountryCode;
  compact?: boolean;
  initialFavourited?: boolean;
}) {
  const locale = useLocale() as Locale;
  const t = useTranslations("provider");
  const [favourited, setFavourited] = React.useState(initialFavourited);
  const [toggling, setToggling] = React.useState(false);
  const cur =
    country === "CN"
      ? `${CURRENCY_SYMBOL.CN}${provider.pricePerHour * 8}`
      : `${CURRENCY_SYMBOL[country]}${provider.pricePerHour}`;

  const handleFavourite = async () => {
    setToggling(true);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId: provider.id }),
      });
      if (res.ok) {
        const data = await res.json();
        setFavourited(data.favourited);
      }
    } catch (e) {
      console.error("Favourite toggle failed:", e);
    } finally {
      setToggling(false);
    }
  };

  return (
    <article className="rounded-lg border border-border bg-bg-base p-5 shadow-card">
      <div className="flex items-start gap-4">
        <ProviderAvatar
          size={compact ? 64 : 80}
          hue={provider.hue ?? 0}
          initials={provider.initials}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[20px] font-bold text-text-primary">
              {provider.name}
            </h3>
            <button
              type="button"
              onClick={handleFavourite}
              disabled={toggling}
              aria-label={favourited ? t("unfavourite") : t("favourite")}
              className={`transition-colors disabled:opacity-50 ${
                favourited
                  ? "text-red-500 hover:text-red-700"
                  : "text-text-tertiary hover:text-red-500"
              }`}
            >
              <Heart
                size={24}
                fill={favourited ? "currentColor" : "none"}
                aria-hidden
              />
            </button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <Star size={16} className="text-[var(--brand-accent)]" aria-hidden />
              <span className="font-semibold">{provider.rating.toFixed(1)}</span>
              <span className="text-[16px] text-text-tertiary">({provider.reviews})</span>
            </span>
            <span className="text-[16px] text-text-tertiary">
              · {locale === "zh" ? "中文" : "Mandarin"} · {provider.distanceKm}km
            </span>
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {provider.verified && (
              <span className="inline-flex h-7 items-center gap-1 rounded-sm bg-success-soft px-2 text-[16px] font-semibold text-success">
                <ShieldCheck size={14} aria-hidden /> {t("verified")}
              </span>
            )}
            {provider.firstAid && (
              <span className="inline-flex h-7 items-center gap-1 rounded-sm bg-brand-soft px-2 text-[16px] font-semibold text-brand">
                + {t("firstAid")}
              </span>
            )}
          </div>
          <p className="mt-3.5 flex items-baseline gap-1">
            <span className="text-[22px] font-bold tabular-nums text-text-primary">{cur}</span>
            <span className="text-[17px] font-medium text-text-secondary">
              /{locale === "zh" ? "小时" : "hr"} · {locale === "zh" ? "含税" : "incl. tax"}
            </span>
          </p>
          <div className="mt-3.5 flex gap-2">
            <Link
              href={`/providers/${provider.id}`}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-2 border-brand bg-bg-base text-[16px] font-semibold text-brand"
            >
              {t("view")}
            </Link>
            <Link
              href={`/bookings/new?providerId=${provider.id}&step=1`}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-brand text-[16px] font-semibold text-white hover:bg-brand-hover"
            >
              {t("bookNow")} →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
