import * as React from "react";
import { CharFrame, ILLU_FILL as F, ILLU_STROKE_PROPS as S } from "./Placeholder";

type Props = { size?: number; className?: string };

const sk = "var(--illu-stroke, #1F2937)";

export function C1GrandmaWang({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d={"M28 30 Q30 18 48 16 Q66 18 68 30"} {...S} fill={F.blue} />
      <circle cx="48" cy="13" r="5" {...S} fill={F.blue} />
      <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...S} />
      <ellipse cx="35" cy="50" rx="4" ry="2.5" fill={F.pink} stroke="none" />
      <ellipse cx="61" cy="50" rx="4" ry="2.5" fill={F.pink} stroke="none" />
      <circle cx="38" cy="44" r="6" {...S} />
      <circle cx="58" cy="44" r="6" {...S} />
      <path d="M44 44 L52 44" {...S} />
      <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none" />
      <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none" />
      <path d="M42 56 Q48 60 54 56" {...S} />
      <path d="M22 88 Q22 76 30 72 L42 70 Q48 72 54 70 L66 72 Q74 76 74 88" {...S} fill={F.yellow} />
      <path d="M48 70 L48 88" {...S} />
    </CharFrame>
  );
}

export function C2GrandpaLi({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M26 32 Q26 18 48 16 Q70 18 70 32" {...S} fill={F.green} />
      <path d="M70 32 L82 36" {...S} />
      <path d="M30 32 Q28 52 36 62 Q44 70 48 70 Q52 70 60 62 Q68 52 66 32" {...S} />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M35 43 Q37 41 40 42" {...S} />
      <path d="M56 42 Q59 41 61 43" {...S} />
      <path d="M42 58 Q48 62 54 58" {...S} />
      <path d="M28 88 Q28 76 38 72 L48 70 L58 72 Q68 76 68 88" {...S} fill={F.blue} />
      <path d="M48 70 L48 88" {...S} />
    </CharFrame>
  );
}

export function C3HelperMei({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M70 38 Q82 44 80 60" {...S} fill={F.yellow} />
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...S} />
      <path d="M30 32 Q40 24 48 26 Q56 24 66 32" {...S} fill={F.yellow} />
      <ellipse cx="36" cy="52" rx="3" ry="2" fill={F.pink} stroke="none" />
      <ellipse cx="60" cy="52" rx="3" ry="2" fill={F.pink} stroke="none" />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M42 56 Q48 60 54 56" {...S} />
      <path d="M24 88 Q24 76 32 72 L42 70 L54 70 L64 72 Q72 76 72 88" {...S} />
      <path d="M38 72 L38 88 L58 88 L58 72 Z" {...S} fill={F.pink} />
      <path d="M40 72 L48 78 L56 72" {...S} />
    </CharFrame>
  );
}

export function C4CookZhang({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M28 28 Q24 14 38 14 Q42 8 48 10 Q54 8 58 14 Q72 14 68 28 Z" {...S} fill="#FFF" />
      <path d="M28 28 L68 28 L66 32 L30 32 Z" {...S} fill={F.blue} />
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...S} />
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <circle cx="40" cy="44" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="44" r="1.5" fill={sk} stroke="none" />
      <path d="M40 53 Q44 56 48 54 Q52 56 56 53" {...S} />
      <path d="M42 60 Q48 63 54 60" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill={F.yellow} />
    </CharFrame>
  );
}

export function C5GardenerTom({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <ellipse cx="48" cy="28" rx="28" ry="6" {...S} fill={F.yellow} />
      <path d="M34 28 Q34 14 48 12 Q62 14 62 28" {...S} fill={F.yellow} />
      <path d="M40 20 L56 20" {...S} />
      <path d="M32 32 Q30 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...S} />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M42 58 Q48 62 54 58" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill={F.green} />
      <rect x="68" y="58" width="14" height="10" rx="1" {...S} fill={F.pink} />
      <path d="M75 58 L75 50 M71 56 Q72 50 75 50 M79 56 Q78 50 75 50" {...S} />
    </CharFrame>
  );
}

export function C6NurseAnna({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M28 32 Q26 18 48 14 Q70 18 68 32 L66 36 L60 30 L52 32 L44 30 L36 32 L30 36 Z" {...S} fill={F.pink} />
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...S} />
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M42 58 Q48 62 54 58" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill="#fff" />
      <path d="M42 72 Q40 80 46 84 Q50 86 54 84 Q60 80 58 72" {...S} />
      <circle cx="50" cy="85" r="3" {...S} fill={F.blue} />
    </CharFrame>
  );
}

export function C7FixerBob({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M28 30 Q26 18 48 14 Q70 18 68 30" {...S} fill={F.yellow} />
      <path d="M30 30 Q28 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 30" {...S} />
      <circle cx="40" cy="44" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="44" r="1.5" fill={sk} stroke="none" />
      <path d="M38 60 Q48 66 58 60" {...S} />
      <path d="M42 56 Q48 59 54 56" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill={F.blue} />
      <rect x="26" y="80" width="44" height="6" {...S} fill={F.yellow} />
      <rect x="38" y="78" width="6" height="10" {...S} />
      <rect x="52" y="78" width="6" height="10" {...S} />
    </CharFrame>
  );
}

export function C8FamilyDaughter({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M28 30 Q26 16 48 14 Q70 16 68 30 L62 38 L48 36 L34 38 Z" {...S} fill={F.green} />
      <path d="M32 32 Q30 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...S} />
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={F.pink} stroke="none" />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M42 58 Q48 60 54 58" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill={F.pink} />
      <rect x="68" y="48" width="10" height="16" rx="2" {...S} fill={F.blue} />
      <circle cx="73" cy="62" r="1" fill={sk} stroke="none" />
    </CharFrame>
  );
}

export function C9AICompanion({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M48 12 L48 6" {...S} />
      <circle cx="48" cy="6" r="2.5" fill={F.yellow} {...S} />
      <rect x="22" y="14" width="52" height="44" rx="14" {...S} fill={F.blue} />
      <path d="M24 28 Q24 18 30 16" {...S} />
      <path d="M72 28 Q72 18 66 16" {...S} />
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
      <path d="M28 68 L20 72" {...S} />
      <path d="M68 68 L76 72" {...S} />
    </CharFrame>
  );
}

export function C10Admin({ size = 96, className }: Props) {
  return (
    <CharFrame size={size} className={className}>
      <path d="M28 30 Q26 16 48 14 Q70 16 68 30" {...S} fill={F.green} />
      <path d="M30 32 Q28 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...S} />
      <path d="M28 38 Q28 26 48 24 Q68 26 68 38" {...S} />
      <rect x="24" y="36" width="6" height="10" rx="2" {...S} fill={F.pink} />
      <rect x="66" y="36" width="6" height="10" rx="2" {...S} fill={F.pink} />
      <path d="M70 44 Q74 50 70 56" {...S} />
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none" />
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none" />
      <path d="M42 58 Q48 61 54 58" {...S} />
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...S} fill={F.blue} />
    </CharFrame>
  );
}
