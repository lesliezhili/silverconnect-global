"use client";

import { useRouter, usePathname } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

const LABELS: Record<string, { back: string; home: string }> = {
  en: { back: "Back", home: "Home" },
  zh: { back: "返回", home: "首页" },
  zh_tw: { back: "返回", home: "首頁" },
  th: { back: "กลับ", home: "หน้าแรก" },
  ko: { back: "뒤로", home: "홈" },
  ja: { back: "戻る", home: "ホーム" }, vi: { back: "Quay lại", home: "Trang chủ" },
};

// Pages where the back bar should NOT show (landing page itself)
const HIDE_ON = [/^\/[a-z_]+\/?$/, /^\/[a-z_]+\/home\/?$/];

export function BackButton() {
  const router = useRouter();
  const pathname = usePathname();

  // Extract locale from path
  const segments = pathname.split("/").filter(Boolean);
  const locale = segments[0] || "en";
  const L = LABELS[locale] || LABELS[locale.startsWith("zh") ? "zh" : "en"] || LABELS.en;

  // Hide on landing/home pages
  if (HIDE_ON.some((p) => p.test(pathname))) return null;

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/" + locale);
    }
  };

  const goHome = () => {
    router.push("/" + locale);
  };

  return (
    <div className="sticky top-0 z-40 bg-white border-b-2 border-gray-200 shadow-sm">
      <div className="max-w-lg mx-auto flex items-center justify-between px-4 py-3">
        <button
          onClick={goBack}
          className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-900 rounded-2xl px-5 py-3 min-h-[56px] min-w-[56px] text-xl font-bold transition-colors shadow-sm"
          aria-label={L.back}
        >
          <ChevronLeft className="w-7 h-7 stroke-[3]" />
          <span>{L.back}</span>
        </button>
        <button
          onClick={goHome}
          className="flex items-center gap-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 rounded-2xl px-5 py-3 min-h-[56px] min-w-[56px] text-xl font-bold transition-colors shadow-sm border border-emerald-200"
          aria-label={L.home}
        >
          <Home className="w-6 h-6 stroke-[2.5]" />
          <span>{L.home}</span>
        </button>
      </div>
    </div>
  );
}
