import * as React from "react";
import { cn } from "@/components/ui/cn";

/**
 * Centered auth card — full-screen on mobile, 480-wide card on desktop
 * (UI_DESIGN.md §7.5). Uses bg-bg-base everywhere so it sits cleanly
 * against the surrounding bg-surface.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  className,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-stretch justify-center bg-bg-surface sm:items-center sm:px-4 sm:py-10"
    >
      <section
        className={cn(
          "flex w-full max-w-[480px] flex-col bg-bg-base px-5 pb-10 pt-8 sm:rounded-lg sm:border sm:border-border sm:px-8 sm:py-10 sm:shadow-card",
          className
        )}
      >
        <h1 className="text-[26px] font-extrabold leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-1.5 text-[15px] text-text-secondary">{subtitle}</p>
        )}
        <div className="mt-6">{children}</div>
      </section>
    </main>
  );
}
