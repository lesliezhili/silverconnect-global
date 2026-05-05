"use client";

import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { Link } from "@/i18n/navigation";

/**
 * Floating "Ask AI" entry point. Visible on every locale-scoped page so
 * the AI helper is always one tap away from anywhere in the app — the
 * cross-page entry point that UI_PAGES.md specced as an overlay.
 *
 * Implemented as a navigation link rather than an inline overlay because
 * the chat conversation is server-rendered: a floating modal would have
 * to duplicate the conversation/message machinery as a client component.
 * Tapping this jumps straight into /chat where the full helper lives,
 * carrying the current path as ?from= so the user can hop back.
 */
export function AskAIButton({
  locale,
  label,
}: {
  locale: string;
  label: string;
}) {
  const pathname = usePathname();
  const stripped = pathname.replace(new RegExp(`^/${locale}`), "") || "/";
  const hidden =
    stripped === "/chat" ||
    stripped.startsWith("/auth/") ||
    stripped.startsWith("/admin/");
  if (hidden) return null;

  return (
    <Link
      href={`/chat?from=${encodeURIComponent(stripped)}`}
      aria-label={label}
      className="fixed bottom-[88px] right-4 z-40 inline-flex h-14 items-center gap-2 rounded-pill bg-brand px-5 text-[15px] font-bold text-white shadow-lg sm:bottom-6"
    >
      <Sparkles size={18} aria-hidden />
      <span className="hidden sm:inline">{label}</span>
    </Link>
  );
}
