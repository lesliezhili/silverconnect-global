const TEAL = "#0F766E";
const BLUE = "#2D6FA3";

const LEFT_LOBE = "M12 20C12 20 3 13.5 3 8.5C3 5.42 5.42 3 8.5 3C10.24 3 11.5 3.9 12 5.09L12 20Z";
const RIGHT_LOBE = "M12 5.09C12.5 3.9 13.76 3 15.5 3C18.58 3 21 5.42 21 8.5C21 13.5 12 20 12 20L12 5.09Z";

/** Two-figure heart mark: a smaller teal head/shoulder merging into a larger blue one. */
export function SilverConnectMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="8" cy="1.9" r="1.7" fill={TEAL} />
      <path d={LEFT_LOBE} fill={TEAL} />
      <circle cx="16" cy="1.9" r="1.7" fill={BLUE} />
      <path d={RIGHT_LOBE} fill={BLUE} />
    </svg>
  );
}

export function SilverConnectLogo({
  size = 28,
  className,
  wordmarkClassName,
}: {
  size?: number;
  className?: string;
  wordmarkClassName?: string;
}) {
  return (
    <span className={className} style={{ display: "inline-flex", alignItems: "center", gap: size * 0.28 }}>
      <SilverConnectMark size={size} />
      <span className={wordmarkClassName}>SilverConnect</span>
    </span>
  );
}
