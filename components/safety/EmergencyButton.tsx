"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { EMERGENCY_NUMBER } from "@/components/domain/country";
import type { CountryCode } from "@/components/layout/CountrySelector";

/**
 * Emergency/Duress Button
 * Always visible, 72px+ pulsing red, never hidden behind menus.
 * Single tap activates — no double-tap, no long-press.
 * 10-second undo window (forgiveness principle for elders).
 */
export default function EmergencyButton({ country = "AU" }: { country?: CountryCode }) {
  const t = useTranslations("emergency");
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(10);
  const [timerRef, setTimerRef] = useState<NodeJS.Timeout | null>(null);

  const handleActivate = useCallback(() => {
    setActivated(true);
    let remaining = 10;
    const timer = setInterval(() => {
      remaining--;
      setCountdown(remaining);
      if (remaining <= 0) {
        clearInterval(timer);
        dispatchEmergency(country);
      }
    }, 1000);
    setTimerRef(timer);
  }, [country]);

  const handleCancel = useCallback(() => {
    if (timerRef) clearInterval(timerRef);
    setActivated(false);
    setCountdown(10);
    setTimerRef(null);
  }, [timerRef]);

  const num = EMERGENCY_NUMBER[country];

  if (activated) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-red-600 p-6">
        <div className="mb-8 text-center">
          <p className="text-[32px] font-bold text-white">🚨 {t("sub", { country })}</p>
          <p className="mt-4 text-[24px] text-red-100">
            {t("calling")} {countdown}s
          </p>
          <p className="mt-2 text-[18px] text-red-200">
            {t("gpsSharing")}
          </p>
        </div>
        <a
          href={`tel:${num}`}
          className="mb-4 flex h-20 w-full max-w-[320px] items-center justify-center rounded-2xl bg-white text-[28px] font-extrabold text-red-600 shadow-xl"
        >
          📞 {t("call", { num })}
        </a>
        <button
          onClick={handleCancel}
          className="rounded-2xl border-2 border-white bg-transparent px-12 py-4 text-[20px] font-bold text-white"
          style={{ minHeight: "56px" }}
        >
          ✕ {t("stayCalm")}
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleActivate}
      className="emergency-pulse fixed bottom-[100px] right-4 z-40 flex items-center justify-center rounded-full bg-red-600 shadow-2xl border-4 border-red-800"
      style={{ width: "72px", height: "72px" }}
      aria-label={t("title")}
    >
      <span className="text-[28px] font-extrabold text-white leading-none">SOS</span>
    </button>
  );
}

async function dispatchEmergency(country: string) {
  try {
    // Dispatch SOS event for EmergencyOverlay
    window.dispatchEvent(new Event("sc:sos"));

    await fetch("/api/safety/duress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "duress",
        country,
        timestamp: new Date().toISOString(),
        location: await getLocation(),
      }),
    });
  } catch (e) {
    console.error("Emergency dispatch failed:", e);
  }
}

async function getLocation(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { timeout: 5000 }
    );
  });
}
