import * as React from "react";

const FILL = {
  yellow: "#FDE68A",
  pink: "#FECACA",
  blue: "#BFDBFE",
  green: "#BBF7D0",
} as const;

const STROKE: React.SVGAttributes<SVGElement> = {
  stroke: "var(--illu-stroke, #1F2937)",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  fill: "none",
};

export const ILLU_FILL = FILL;
export const ILLU_STROKE_PROPS = STROKE;

export function CharFrame({
  size = 96,
  className,
  children,
}: React.PropsWithChildren<{ size?: number; className?: string }>) {
  return (
    <svg
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}
