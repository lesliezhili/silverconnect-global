import * as React from "react";
import { cn } from "./cn";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className={cn("animate-pulse rounded-md bg-bg-surface", className)}
      {...props}
    />
  );
}
