"use client";
import * as React from "react";

export function ProgressBar({ pct }: { pct: number }) {
  const [width, setWidth] = React.useState(0);
  const target = Math.max(0, Math.min(100, pct));
  React.useEffect(() => {
    const id = requestAnimationFrame(() => setWidth(target));
    return () => cancelAnimationFrame(id);
  }, [target]);
  return (
    <div className="h-3 rounded-full bg-bg-surface-2 overflow-hidden">
      <div
        className="h-full rounded-full transition-[width] duration-1000 ease-out"
        style={{
          width: `${width}%`,
          background: "linear-gradient(90deg, var(--brand-primary), #3B82F6)",
        }}
      />
    </div>
  );
}
