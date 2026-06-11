"use client";

import * as React from "react";
import { Heart, Star } from "lucide-react";
import { Link } from "@/i18n/navigation";

export function FavouriteProviderCard({
  providerId,
  name,
  rating,
  bio,
  avatarUrl,
  locale,
}: {
  providerId: string;
  name: string;
  rating: number;
  bio: string;
  avatarUrl?: string;
  locale: string;
}) {
  const [removed, setRemoved] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const handleUnfavourite = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/favourites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ providerId }),
      });
      if (res.ok) {
        setRemoved(true);
      }
    } catch (e) {
      console.error("Unfavourite failed:", e);
    } finally {
      setLoading(false);
    }
  };

  if (removed) {
    return (
      <article className="rounded-lg border border-border bg-gray-50 p-5 text-center">
        <p className="text-[18px] text-text-tertiary">
          {locale === "zh" ? "已取消收藏" : "Removed from favourites"}
        </p>
      </article>
    );
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="rounded-lg border border-border bg-bg-base p-5 shadow-card">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[20px] font-bold text-blue-700">
          {avatarUrl ? (
            <img src={avatarUrl} alt={name} className="h-16 w-16 rounded-full object-cover" />
          ) : (
            initials
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-[20px] font-bold text-text-primary">{name}</h3>
            <button
              type="button"
              onClick={handleUnfavourite}
              disabled={loading}
              aria-label={locale === "zh" ? "取消收藏" : "Remove from favourites"}
              className="text-red-500 hover:text-red-700 disabled:opacity-50"
            >
              <Heart size={24} fill="currentColor" aria-hidden />
            </button>
          </div>

          {rating > 0 && (
            <div className="mt-1.5 flex items-center gap-1">
              <Star size={16} className="text-amber-400" aria-hidden />
              <span className="text-[18px] font-semibold">{rating.toFixed(1)}</span>
            </div>
          )}

          {bio && (
            <p className="mt-2 line-clamp-2 text-[17px] text-text-secondary">{bio}</p>
          )}

          <div className="mt-3.5 flex gap-2">
            <Link
              href={`/providers/${providerId}`}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md border-2 border-brand bg-bg-base text-[16px] font-semibold text-brand"
            >
              {locale === "zh" ? "查看" : "View"}
            </Link>
            <Link
              href={`/bookings/new?providerId=${providerId}&step=1`}
              className="inline-flex h-12 flex-1 items-center justify-center rounded-md bg-brand text-[16px] font-semibold text-white"
            >
              {locale === "zh" ? "立即预约" : "Book"} →
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}
