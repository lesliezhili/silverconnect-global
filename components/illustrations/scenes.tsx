import * as React from "react";
import { ILLU_FILL as F, ILLU_STROKE_PROPS as S } from "./Placeholder";

type SceneProps = { width?: number; height?: number; className?: string };

const sk = "var(--illu-stroke, #1F2937)";

export function S1TeaTime({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 320 200" width={width} height={height} className={className} aria-hidden>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s1-steam { animation: s1steam 2.5s ease-in-out infinite; transform-origin: 235px 110px; }
          .s1-steam-2 { animation: s1steam 2.5s ease-in-out infinite .8s; }
          @keyframes s1steam {
            0% { opacity: 0; transform: translateY(0) scaleX(.8); }
            40% { opacity: .9; }
            100% { opacity: 0; transform: translateY(-22px) scaleX(1.2); }
          }
        }
      `}</style>
      <rect x="200" y="20" width="100" height="80" rx="4" {...S} fill={F.yellow} />
      <path d="M250 20 L250 100 M200 60 L300 60" {...S} />
      <circle cx="280" cy="40" r="8" {...S} fill={F.yellow} />
      <path d="M280 28 L280 24 M268 40 L264 40 M292 40 L296 40 M271 31 L268 28 M289 31 L292 28" {...S} />
      <path d="M30 180 Q30 130 60 124 L180 124 Q210 130 210 180 Z" {...S} fill={F.pink} />
      <path d="M30 144 L210 144" {...S} />
      <g transform="translate(60,80)">
        <path d="M28 30 Q30 18 48 16 Q66 18 68 30" {...S} fill={F.blue} />
        <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...S} />
        <ellipse cx="36" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
        <ellipse cx="60" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
        <circle cx="38" cy="44" r="6" {...S} />
        <circle cx="58" cy="44" r="6" {...S} />
        <path d="M44 44 L52 44" {...S} />
        <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none" />
        <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none" />
        <path d="M42 56 Q48 60 54 56" {...S} />
        <path d="M14 100 Q14 80 32 72 L48 70 L64 72 Q82 80 82 100" {...S} fill={F.yellow} />
      </g>
      <rect x="220" y="110" width="36" height="22" rx="3" {...S} fill={F.pink} />
      <path d="M256 114 Q264 116 264 122 Q264 128 256 130" {...S} />
      <path d="M226 110 L226 106 L250 106 L250 110" {...S} />
      <path className="s1-steam" d="M232 108 Q228 100 232 92 Q236 88 232 80" {...S} />
      <path className="s1-steam s1-steam-2" d="M244 108 Q240 100 244 92 Q248 88 244 80" {...S} />
    </svg>
  );
}

// Stub the rest as simpler scenes referencing their key motif.
export function S2CleaningTogether({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <path d="M0 150 L240 150" {...S} />
      <text x="120" y="80" textAnchor="middle" fontSize="11" fill={sk} opacity={0.4}>S2</text>
    </svg>
  );
}

export function S3EmptyBookings({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s3-tail { animation: s3tail 3s ease-in-out infinite; transform-origin: 200px 130px; }
          @keyframes s3tail { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(20deg); } }
        }
      `}</style>
      <rect x="100" y="30" width="80" height="60" rx="4" {...S} fill={F.blue} />
      <path d="M100 46 L180 46" {...S} />
      <circle cx="115" cy="38" r="2" fill={sk} stroke="none" />
      <circle cx="165" cy="38" r="2" fill={sk} stroke="none" />
      {[0, 1, 2].map((r) =>
        [0, 1, 2, 3].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={108 + c * 18}
            y={54 + r * 10}
            width="12"
            height="6"
            rx="1"
            {...S}
          />
        ))
      )}
      <g transform="translate(20,30)">
        <path d="M26 22 Q26 8 48 6 Q70 8 70 22" {...S} fill={F.green} />
        <path d="M70 22 L82 26" {...S} />
        <path d="M30 22 Q28 42 36 52 Q44 60 48 60 Q52 60 60 52 Q68 42 66 22" {...S} />
        <circle cx="40" cy="36" r="1.5" fill={sk} stroke="none" />
        <circle cx="56" cy="36" r="1.5" fill={sk} stroke="none" />
        <path d="M42 48 Q48 50 54 48" {...S} />
        <path d="M48 60 Q56 66 60 70" {...S} />
        <circle cx="61" cy="71" r="4" {...S} fill={F.pink} />
      </g>
      <g transform="translate(180,110)">
        <ellipse cx="20" cy="30" rx="20" ry="12" {...S} fill={F.yellow} />
        <circle cx="6" cy="22" r="8" {...S} fill={F.yellow} />
        <path d="M2 16 L4 12 L8 16 Z M10 14 L12 10 L14 14 Z" {...S} />
        <circle cx="4" cy="22" r=".8" fill={sk} stroke="none" />
        <circle cx="8" cy="22" r=".8" fill={sk} stroke="none" />
        <path d="M5 25 L7 25" {...S} />
        <g className="s3-tail">
          <path d="M40 30 Q50 24 48 14" {...S} />
        </g>
      </g>
      <path d="M0 150 L240 150" {...S} />
    </svg>
  );
}

export function S4EmptyChat({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s4-wave { animation: s4wave 2s ease-in-out infinite; transform-origin: 165px 75px; }
          @keyframes s4wave { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(20deg); } }
        }
      `}</style>
      <g transform="translate(70,30)">
        <path d="M48 12 L48 4" {...S} />
        <circle cx="48" cy="4" r="2.5" fill={F.yellow} {...S} />
        <rect x="22" y="14" width="52" height="44" rx="14" {...S} fill={F.blue} />
        <rect x="16" y="28" width="10" height="14" rx="3" {...S} fill={F.pink} />
        <rect x="70" y="28" width="10" height="14" rx="3" {...S} fill={F.pink} />
        <circle cx="48" cy="34" r="6" {...S} fill="#fff" />
        <circle cx="49" cy="33" r="2.5" fill={sk} stroke="none" />
        <path d="M42 48 Q48 51 54 48" {...S} />
        <rect x="28" y="60" width="40" height="28" rx="8" {...S} fill={F.yellow} />
        <path
          d="M48 70 L42 76 Q40 80 44 82 L48 78 L52 82 Q56 80 54 76 Z"
          fill={F.pink}
          stroke={sk}
          strokeWidth={2}
        />
        <path d="M28 68 L18 72" {...S} />
        <g className="s4-wave">
          <path d="M68 68 Q82 64 90 50" {...S} />
          <circle cx="92" cy="48" r="4" {...S} fill={F.pink} />
        </g>
      </g>
    </svg>
  );
}

export function S5PaymentSuccess({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 280 200" width={width} height={height} className={className} aria-hidden>
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s5-check { stroke-dasharray: 60; stroke-dashoffset: 60; animation: s5draw .6s .2s ease-out forwards; }
          @keyframes s5draw { to { stroke-dashoffset: 0; } }
        }
      `}</style>
      <circle cx="140" cy="40" r="22" {...S} fill={F.green} />
      <path
        className="s5-check"
        d="M130 40 L138 48 L152 34"
        stroke="var(--success, #16A34A)"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <g transform="translate(30,80)">
        <path d="M70 38 Q82 44 80 60" {...S} fill={F.yellow} />
        <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...S} />
        <path d="M30 32 Q40 24 48 26 Q56 24 66 32" {...S} fill={F.yellow} />
        <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
        <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
        <path d="M42 58 Q48 60 54 58" {...S} />
        <path d="M24 100 Q24 80 32 72 L42 70 L54 70 L64 72 Q72 80 72 100" {...S} />
        <path d="M38 72 L38 100 L58 100 L58 72" {...S} fill={F.pink} />
        <path d="M64 80 L92 88" {...S} />
        <ellipse cx="96" cy="89" rx="6" ry="4" {...S} fill={F.pink} />
      </g>
      <g transform="translate(150,80)">
        <path d="M28 30 Q30 18 48 16 Q66 18 68 30" {...S} fill={F.blue} />
        <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...S} />
        <ellipse cx="36" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
        <ellipse cx="60" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
        <circle cx="38" cy="44" r="6" {...S} />
        <circle cx="58" cy="44" r="6" {...S} />
        <path d="M44 44 L52 44" {...S} />
        <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none" />
        <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none" />
        <path d="M42 56 Q48 60 54 56" {...S} />
        <path d="M22 100 Q22 80 32 72 L48 70 L64 72 Q74 80 74 100" {...S} fill={F.yellow} />
        <path d="M30 80 L4 88" {...S} />
        <ellipse cx="0" cy="89" rx="6" ry="4" {...S} fill={F.pink} />
      </g>
      <path d="M0 190 L280 190" {...S} />
    </svg>
  );
}

export function S6EmergencyCare({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <text x="120" y="80" textAnchor="middle" fontSize="11" fill={sk} opacity={0.4}>S6</text>
    </svg>
  );
}

export function S7NetworkError({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <path d="M50 50 Q50 38 62 38 Q66 30 76 32 Q86 30 90 40 Q102 40 102 52 L48 52 Z" {...S} fill={F.blue} />
      <g transform="translate(120,30)">
        <path d="M48 8 L52 2" {...S} />
        <circle cx="53" cy="1" r="2" fill={F.yellow} {...S} />
        <path d="M48 18 L48 14" {...S} />
        <path d="M44 14 L52 14" {...S} />
        <rect x="22" y="22" width="52" height="44" rx="14" {...S} fill={F.blue} />
        <rect x="16" y="36" width="10" height="14" rx="3" {...S} fill={F.pink} />
        <rect x="70" y="36" width="10" height="14" rx="3" {...S} fill={F.pink} />
        <path d="M42 42 Q48 38 54 42" {...S} />
        <path d="M42 56 Q48 52 54 56" {...S} />
        <rect x="28" y="68" width="40" height="28" rx="8" {...S} fill={F.yellow} />
        <path
          d="M48 78 L42 84 Q40 88 44 90 L48 86 L52 90 Q56 88 54 84 Z"
          fill={F.pink}
          stroke={sk}
          strokeWidth={2}
        />
      </g>
      <path d="M0 150 L240 150" {...S} />
    </svg>
  );
}

export function S8ProviderOnboarding({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <text x="120" y="80" textAnchor="middle" fontSize="11" fill={sk} opacity={0.4}>S8</text>
    </svg>
  );
}

export function S9RecurringBooking({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <text x="120" y="80" textAnchor="middle" fontSize="11" fill={sk} opacity={0.4}>S9</text>
    </svg>
  );
}

export function S10FamilyInvite({ width = 240, height = 160, className }: SceneProps) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} className={className} aria-hidden>
      <text x="120" y="80" textAnchor="middle" fontSize="11" fill={sk} opacity={0.4}>S10</text>
    </svg>
  );
}
