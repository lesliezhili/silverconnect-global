import * as React from "react";
import { S3EmptyBookings, S4EmptyChat, S7NetworkError } from "@/components/illustrations";
import { Skeleton } from "@/components/ui/Skeleton";

/**
 * Common page-level states pulled out of the Sprint 1 design canvas
 * so any route can render them via `?state=…`.
 *
 * These are server components; if a state needs interactivity (retry,
 * "go book", etc.) the call site passes a server-rendered button or Link.
 */

export function EmptyState({
  illustration: Illustration = S3EmptyBookings,
  title,
  hint,
  cta,
}: {
  illustration?: React.ComponentType<{ width?: number; height?: number }>;
  title: string;
  hint?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
      <Illustration width={220} height={150} />
      <h2 className="m-0 text-[21px] font-bold text-text-primary">{title}</h2>
      {hint && <p className="m-0 text-[14px] text-text-secondary">{hint}</p>}
      {cta && <div className="mt-1">{cta}</div>}
    </div>
  );
}

export function ErrorState({
  title,
  retryHref,
  retryLabel,
}: {
  title: string;
  retryHref?: string;
  retryLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-5 py-12 text-center">
      <S7NetworkError width={200} height={140} />
      <h2 className="m-0 text-[21px] font-bold text-text-primary">{title}</h2>
      {retryHref && (
        <a
          href={retryHref}
          className="mt-1 inline-flex h-14 items-center justify-center rounded-md bg-brand px-8 text-[17px] font-bold text-white"
        >
          {retryLabel}
        </a>
      )}
    </div>
  );
}

/**
 * Generic vertically stacked skeleton that mimics the rough layout
 * of a list-style page (hero + a few rows).
 */
export function LoadingList({ rows = 4, rowHeight = 100 }: { rows?: number; rowHeight?: number }) {
  return (
    <div className="space-y-3 px-5 py-5">
      <Skeleton className="h-7 w-1/2" />
      <Skeleton className="h-12 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="w-full rounded-md" style={{ height: rowHeight }} />
      ))}
    </div>
  );
}

export { S3EmptyBookings, S4EmptyChat, S7NetworkError };
