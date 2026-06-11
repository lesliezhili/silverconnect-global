"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import { Sparkles, X } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Floating "Ask AI" entry point with dismiss/minimize capability.
 * Seniors can close it if it blocks reading; it minimizes to a tiny
 * icon that's easy to re-open but stays out of the reading path.
 */
export function AskAIButton({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  const pathname = usePathname();
  const [minimized, setMinimized] = React.useState(false);

  const stripped = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const hidden =
    stripped === "/chat" ||
    stripped.startsWith("/auth/") ||
    stripped.startsWith("/admin/");
  if (hidden) return null;

  const chatHref = `/chat?from=${encodeURIComponent(stripped)}`;

  // Minimized state: tiny sparkle icon, bottom-right, unobtrusive
  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        aria-label="Show AI assistant"
        className="fixed bottom-[184px] right-4 z-30 inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand/80 text-white shadow-md hover:bg-brand transition-all sm:bottom-6"
      >
        <Sparkles size={16} aria-hidden />
      </button>
    );
  }

  return (
    <div className="fixed bottom-[184px] right-4 z-30 group sm:bottom-6">
      {/* Dismiss button — visible on hover/focus */}
      <button
        onClick={() => setMinimized(true)}
        className="absolute -top-2 -left-2 w-7 h-7 bg-white border border-gray-200 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 shadow-sm opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity"
        aria-label="Minimize AI assistant"
      >
        <X className="w-3.5 h-3.5" />
      </button>

      <Link
        href={chatHref}
        aria-label={label}
        className="inline-flex h-14 items-center gap-2 rounded-pill bg-brand px-5 text-[17px] font-bold text-white shadow-xl ring-1 ring-black/5"
      >
        <Sparkles size={18} aria-hidden />
        <span className="hidden sm:inline">{label}</span>
      </Link>
    </div>
  );
}
