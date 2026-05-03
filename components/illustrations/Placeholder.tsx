import * as React from "react";
import { cn } from "@/components/ui/cn";

export interface IllustrationProps extends React.SVGAttributes<SVGSVGElement> {
  id: string;
  label: string;
  variant?: "character" | "scene";
  size?: number;
}

/**
 * Placeholder line-illustration. Will be replaced by Claude Design final art
 * in P5. Uses UI_DESIGN.md §1.8.1 line spec (stroke 2.5, round caps).
 */
export function Illustration({
  id,
  label,
  variant = "character",
  size = 96,
  className,
  ...props
}: IllustrationProps) {
  const isCharacter = variant === "character";
  const w = isCharacter ? size : size * 1.6;
  const h = size;
  return (
    <svg
      role="img"
      aria-label={label}
      viewBox={`0 0 ${w} ${h}`}
      width={w}
      height={h}
      className={cn("text-text-primary", className)}
      fill="none"
      {...props}
    >
      <rect
        x="2"
        y="2"
        width={w - 4}
        height={h - 4}
        rx="12"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="6 6"
        opacity="0.5"
      />
      {isCharacter ? (
        <>
          <circle
            cx={w / 2}
            cy={h * 0.32}
            r={h * 0.18}
            stroke="currentColor"
            strokeWidth="2.5"
          />
          <path
            d={`M ${w * 0.25} ${h * 0.95} Q ${w / 2} ${h * 0.55} ${w * 0.75} ${h * 0.95}`}
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </>
      ) : (
        <path
          d={`M ${w * 0.1} ${h * 0.7} Q ${w * 0.3} ${h * 0.4} ${w * 0.5} ${h * 0.6} T ${w * 0.9} ${h * 0.5}`}
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
      )}
      <text
        x={w / 2}
        y={h - 8}
        textAnchor="middle"
        fontSize="11"
        fill="currentColor"
        opacity="0.6"
      >
        {id}
      </text>
    </svg>
  );
}
