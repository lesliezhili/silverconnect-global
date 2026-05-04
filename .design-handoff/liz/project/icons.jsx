// Icons.jsx — Linear stroke=2 SVG icon set for SilverConnect.
// All icons render at 24/32/48 sizes via the size prop.

const Icon = ({ children, size = 24, color = 'currentColor', strokeWidth = 2, fill = 'none', style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color}
       strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
       style={{ flexShrink: 0, ...style }}>
    {children}
  </svg>
);

// Service category icons (warm, friendly, slightly rounded)
const IconClean = (p) => (
  <Icon {...p}>
    <path d="M19 4l-3 3M16 7l1 1M4 20l5-5M9 15l1 1M14 5l5 5-9 9-3-3 9-9z M11 11l3 3" />
    <circle cx="6" cy="18" r="0.5" fill="currentColor"/>
  </Icon>
);
const IconCook = (p) => (
  <Icon {...p}>
    <path d="M3 11h18a0 0 0 0 1 0 0v1a8 8 0 0 1-8 8h-2a8 8 0 0 1-8-8v-1z"/>
    <path d="M7 8c0-1 1-2 2-2M12 8c0-1 1-2 2-2M17 8c0-1 1-2 2-2"/>
    <path d="M2 20h20"/>
  </Icon>
);
const IconGarden = (p) => (
  <Icon {...p}>
    <path d="M12 22V8"/>
    <path d="M12 8C12 4 8 3 5 4c0 4 4 6 7 4z"/>
    <path d="M12 10c0-3 4-4 7-3 0 4-4 5-7 3z"/>
    <path d="M5 22h14"/>
  </Icon>
);
const IconCare = (p) => (
  <Icon {...p}>
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
  </Icon>
);
const IconRepair = (p) => (
  <Icon {...p}>
    <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-.5-.5-2.5 2.5-2.5z"/>
  </Icon>
);

// Nav / UI
const IconHome = (p) => (<Icon {...p}><path d="M3 11l9-8 9 8v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V11z"/></Icon>);
const IconGrid = (p) => (<Icon {...p}><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></Icon>);
const IconCal = (p) => (<Icon {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></Icon>);
const IconChat = (p) => (<Icon {...p}><path d="M21 12a8 8 0 0 1-8 8H8l-5 3 1.5-5.5A8 8 0 1 1 21 12z"/></Icon>);
const IconUser = (p) => (<Icon {...p}><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></Icon>);
const IconSearch = (p) => (<Icon {...p}><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></Icon>);
const IconBell = (p) => (<Icon {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9z"/><path d="M10 21a2 2 0 0 0 4 0"/></Icon>);
const IconArrow = (p) => (<Icon {...p}><path d="M5 12h14M13 5l7 7-7 7"/></Icon>);
const IconBack = (p) => (<Icon {...p}><path d="M19 12H5M11 5l-7 7 7 7"/></Icon>);
const IconClose = (p) => (<Icon {...p}><path d="M6 6l12 12M6 18L18 6"/></Icon>);
const IconCheck = (p) => (<Icon {...p}><path d="M4 12l5 5L20 6"/></Icon>);
const IconStar = (p) => (<Icon {...p} fill="currentColor"><path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/></Icon>);
const IconStarOutline = (p) => (<Icon {...p}><path d="M12 2l3 7 7 .5-5.5 4.5 2 7L12 17l-6.5 4 2-7L2 9.5 9 9z"/></Icon>);
const IconHeart = (p) => (<Icon {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></Icon>);
const IconShield = (p) => (<Icon {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/></Icon>);
const IconPin = (p) => (<Icon {...p}><path d="M20 10c0 6-8 13-8 13S4 16 4 10a8 8 0 0 1 16 0z"/><circle cx="12" cy="10" r="3"/></Icon>);
const IconPhone = (p) => (<Icon {...p}><path d="M21 16.5v3a2 2 0 0 1-2.2 2 19 19 0 0 1-8.3-3 19 19 0 0 1-6-6 19 19 0 0 1-3-8.3A2 2 0 0 1 3.5 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.6 2.6a2 2 0 0 1-.5 2.1L7.3 9.7a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.8.3 1.7.5 2.6.6a2 2 0 0 1 1.7 2z"/></Icon>);
const IconNav = (p) => (<Icon {...p}><polygon points="3 11 22 2 13 21 11 13 3 11"/></Icon>);
const IconAlert = (p) => (<Icon {...p}><path d="M12 3l10 17H2L12 3z"/><path d="M12 9v5M12 17v.01"/></Icon>);
const IconClock = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></Icon>);
const IconCard = (p) => (<Icon {...p}><rect x="2" y="5" width="20" height="14" rx="2.5"/><path d="M2 10h20M6 15h4"/></Icon>);
const IconPlus = (p) => (<Icon {...p}><path d="M12 5v14M5 12h14"/></Icon>);
const IconMic = (p) => (<Icon {...p}><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></Icon>);
const IconSend = (p) => (<Icon {...p}><path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z"/></Icon>);
const IconChev = (p) => (<Icon {...p}><path d="M9 6l6 6-6 6"/></Icon>);
const IconChevDown = (p) => (<Icon {...p}><path d="M6 9l6 6 6-6"/></Icon>);
const IconCamera = (p) => (<Icon {...p}><path d="M3 8a2 2 0 0 1 2-2h2l2-2h6l2 2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8z"/><circle cx="12" cy="13" r="4"/></Icon>);
const IconLock = (p) => (<Icon {...p}><rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></Icon>);
const IconLogout = (p) => (<Icon {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></Icon>);
const IconGift = (p) => (<Icon {...p}><path d="M3 12h18v9H3z"/><path d="M3 8h18v4H3zM12 8v13M12 8c-2-3-5-2-5 0s3 2 5 0zM12 8c2-3 5-2 5 0s-3 2-5 0z"/></Icon>);
const IconWarn = (p) => (<Icon {...p}><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16v.01"/></Icon>);
const IconWifi = (p) => (<Icon {...p}><path d="M3 9a15 15 0 0 1 18 0M6 12a10 10 0 0 1 12 0M9 15a5 5 0 0 1 6 0M12 18v.01"/></Icon>);
const IconWifiOff = (p) => (<Icon {...p}><path d="M3 3l18 18M9 15a5 5 0 0 1 6 0M6 12a10 10 0 0 1 7-2.7M3 9a15 15 0 0 1 5-3.5M16 9c1.5.6 3 1.5 5 3M12 18v.01"/></Icon>);
const IconSun = (p) => (<Icon {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M5 5l1.5 1.5M17.5 17.5L19 19M2 12h2M20 12h2M5 19l1.5-1.5M17.5 6.5L19 5"/></Icon>);
const IconAI = (p) => (<Icon {...p}><path d="M12 2v3M12 19v3M5 5l2 2M17 17l2 2M2 12h3M19 12h3M5 19l2-2M17 7l2-2"/><circle cx="12" cy="12" r="5"/></Icon>);
const IconSettings = (p) => (<Icon {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></Icon>);

// Provider portrait — abstract circular avatar (no AI faces).
// Generates a calm friendly portrait silhouette for placeholders.
function ProviderAvatar({ size = 80, hue = 0, initials = '李' }) {
  const palettes = [
    ['#FEF3C7', '#F59E0B', '#92590A'],
    ['#E8F0FE', '#1F6FEB', '#1858C4'],
    ['#DCFCE7', '#16A34A', '#166534'],
    ['#FCE7F3', '#DB2777', '#9D174D'],
    ['#EDE9FE', '#7C3AED', '#5B21B6'],
  ];
  const [bg, mid, fg] = palettes[hue % palettes.length];
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, background: bg,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: fg, fontWeight: 700, fontSize: size * 0.4, position: 'relative', overflow: 'hidden',
      flexShrink: 0,
    }}>
      <svg viewBox="0 0 80 80" width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="40" cy="32" r="14" fill={mid} opacity="0.25"/>
        <path d="M12 80c0-15 12-22 28-22s28 7 28 22z" fill={mid} opacity="0.25"/>
      </svg>
      <span style={{ position: 'relative', zIndex: 1 }}>{initials}</span>
    </div>
  );
}

// Brand wordmark
function Logo({ size = 28, mono = false }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 32 32">
        <circle cx="16" cy="16" r="14" fill={mono ? 'currentColor' : 'var(--brand-primary)'}/>
        <path d="M10 18c1.5 2 4 3 6 3s4.5-1 6-3M11 13c.5-.5 1.2-1 2-1M19 12c.8 0 1.5.5 2 1" stroke="#fff" strokeWidth="2" strokeLinecap="round" fill="none"/>
        <circle cx="22" cy="9" r="2" fill={mono ? 'currentColor' : 'var(--brand-accent)'}/>
      </svg>
      <span style={{ fontWeight: 800, fontSize: size * 0.6, letterSpacing: '-0.01em', color: 'var(--text-primary)' }}>
        Silver<span style={{ color: 'var(--brand-primary)' }}>Connect</span>
      </span>
    </div>
  );
}

// Empty-state illustrations — line + warm orange accent
function IllusEmpty({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="20" y="30" width="80" height="60" rx="6" stroke="var(--border-strong)"/>
      <path d="M30 50h30M30 60h40M30 70h25" stroke="var(--border-strong)"/>
      <circle cx="85" cy="32" r="10" fill="var(--brand-accent)" stroke="none" opacity="0.8"/>
      <path d="M85 28v8M81 32h8" stroke="#fff" strokeWidth="2.5"/>
    </svg>
  );
}
function IllusOffline({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 50a40 40 0 0 1 80 0" stroke="var(--border-strong)"/>
      <path d="M35 65a25 25 0 0 1 50 0" stroke="var(--border-strong)"/>
      <path d="M50 80a10 10 0 0 1 20 0" stroke="var(--border-strong)"/>
      <circle cx="60" cy="95" r="3" fill="var(--text-tertiary)"/>
      <path d="M30 30l60 60" stroke="var(--danger)" strokeWidth="3"/>
    </svg>
  );
}
function IllusError({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="60" cy="60" r="40" stroke="var(--border-strong)"/>
      <path d="M45 50l30 20M75 50l-30 20" stroke="var(--danger)" strokeWidth="3"/>
      <path d="M40 90c8-4 32-4 40 0" stroke="var(--text-tertiary)"/>
    </svg>
  );
}
function IllusPaid({ size = 120 }) {
  return (
    <svg viewBox="0 0 120 120" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="25" y="35" width="70" height="50" rx="6" fill="var(--danger-soft)" stroke="var(--danger)"/>
      <path d="M40 55l15 10 25-20" stroke="var(--danger)" strokeWidth="3"/>
    </svg>
  );
}
function IllusHero({ size = 200 }) {
  // friendly hand-drawn helping hand + heart for hero spots
  return (
    <svg viewBox="0 0 200 140" width={size} height={size * 0.7} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="100" cy="70" r="55" fill="var(--brand-accent-soft)" stroke="none"/>
      <path d="M70 95c0-15 10-25 30-25s30 10 30 25" stroke="var(--brand-primary)" strokeWidth="3"/>
      <circle cx="100" cy="55" r="14" fill="var(--bg-base)" stroke="var(--brand-primary)" strokeWidth="3"/>
      <path d="M55 55c-5 0-8 4-8 9 0 7 13 14 13 14s13-7 13-14c0-5-3-9-8-9-2 0-4 1-5 3-1-2-3-3-5-3z" fill="var(--brand-accent)" stroke="none"/>
      <path d="M145 55c-5 0-8 4-8 9 0 7 13 14 13 14s13-7 13-14c0-5-3-9-8-9-2 0-4 1-5 3-1-2-3-3-5-3z" fill="var(--brand-accent)" stroke="none"/>
    </svg>
  );
}

Object.assign(window, {
  Icon, IconClean, IconCook, IconGarden, IconCare, IconRepair,
  IconHome, IconGrid, IconCal, IconChat, IconUser, IconSearch, IconBell,
  IconArrow, IconBack, IconClose, IconCheck, IconStar, IconStarOutline, IconHeart,
  IconShield, IconPin, IconPhone, IconNav, IconAlert, IconClock, IconCard,
  IconPlus, IconMic, IconSend, IconChev, IconChevDown, IconCamera, IconLock,
  IconLogout, IconGift, IconWarn, IconWifi, IconWifiOff, IconSun, IconAI, IconSettings,
  ProviderAvatar, Logo,
  IllusEmpty, IllusOffline, IllusError, IllusPaid, IllusHero,
});
