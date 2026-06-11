import * as React from "react";
import { cn } from "@/components/ui/cn";
import { Link } from "@/i18n/navigation";

/**
 * Centered auth card — full-screen on mobile, 480-wide card on desktop.
 * Elder-first: large text, generous spacing, high contrast.
 * Includes logo link back to landing page for navigation.
 */
export function AuthCard({
  title,
  subtitle,
  children,
  className,
  locale,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  locale?: string;
}) {
  const isChinese = locale === "zh" || locale === "zh_tw";

  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-stretch justify-center bg-bg-surface sm:items-center sm:px-4 sm:py-10"
    >
      <section
        className={cn(
          "flex w-full max-w-[480px] flex-col bg-bg-base px-6 pb-10 pt-8 sm:rounded-lg sm:border sm:border-border sm:px-8 sm:py-10 sm:shadow-card",
          className
        )}
      >
        {/* Logo — tap to go back to landing */}
        <Link
          href="/"
          className="mb-6 flex items-baseline gap-1.5 self-start text-[20px] font-extrabold tracking-tight text-brand hover:opacity-80"
          aria-label="Back to home"
        >
          SilverConnect
          {isChinese && <span className="text-[14px] font-bold text-brand/70">和润</span>}
        </Link>

        <h1 className="text-elder-heading font-extrabold leading-tight">{title}</h1>
        {subtitle && (
          <p className="mt-2 text-elder-small text-text-secondary">{subtitle}</p>
        )}
        <div className="mt-7 flex flex-col gap-5">{children}</div>
      </section>
    </main>
  );
}
