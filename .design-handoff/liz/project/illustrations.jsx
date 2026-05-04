// illustrations.jsx — SilverConnect v2 character + scene library §1.8
// Hand-drawn feel, stroke 2.5px, round caps, 1-2 fill colors from warm palette.
// All exposed via window.{...} for cross-script access.

const ILLU_FILLS = {
  yellow: '#FDE68A',
  pink: '#FECACA',
  blue: '#BFDBFE',
  green: '#BBF7D0',
};

// Stroke colour adapts to dark mode via CSS var
const sk = 'var(--illu-stroke, #1F2937)';
const ST = { stroke: sk, strokeWidth: 2.5, strokeLinecap: 'round', strokeLinejoin: 'round', fill: 'none' };

// ─────────────────────────── Characters ───────────────────────────
// All headshot characters are 96×96, full-body scenes are larger.

function CharFrame({ size = 96, children, style }) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} style={style} aria-hidden="true">
      {children}
    </svg>
  );
}

// C1 王阿姨 — round face, silver hair, glasses, cardigan, tea cup
function C1Grandma({ size = 96, blink, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* hair bun */}
      <path d={'M28 30 Q30 18 48 16 Q66 18 68 30'} {...ST} fill={ILLU_FILLS.blue}/>
      <circle cx="48" cy="13" r="5" {...ST} fill={ILLU_FILLS.blue}/>
      {/* face */}
      <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...ST}/>
      {/* cheeks */}
      <ellipse cx="35" cy="50" rx="4" ry="2.5" fill={ILLU_FILLS.pink} stroke="none"/>
      <ellipse cx="61" cy="50" rx="4" ry="2.5" fill={ILLU_FILLS.pink} stroke="none"/>
      {/* glasses */}
      <circle cx="38" cy="44" r="6" {...ST}/>
      <circle cx="58" cy="44" r="6" {...ST}/>
      <path d="M44 44 L52 44" {...ST}/>
      {/* eyes */}
      {!blink ? (<>
        <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none"/>
        <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none"/>
      </>) : (<>
        <path d="M35 44 L41 44" {...ST}/>
        <path d="M55 44 L61 44" {...ST}/>
      </>)}
      {/* smile */}
      <path d="M42 56 Q48 60 54 56" {...ST}/>
      {/* cardigan body */}
      <path d="M22 88 Q22 76 30 72 L42 70 Q48 72 54 70 L66 72 Q74 76 74 88" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M48 70 L48 88" {...ST}/>
      {/* button */}
      <circle cx="48" cy="78" r="1.5" fill={sk} stroke="none"/>
      <circle cx="48" cy="84" r="1.5" fill={sk} stroke="none"/>
    </CharFrame>
  );
}

// C2 李爷爷 — thin, baseball cap, vest, walking stick (head only)
function C2Grandpa({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* cap */}
      <path d="M26 32 Q26 18 48 16 Q70 18 70 32" {...ST} fill={ILLU_FILLS.green}/>
      <path d="M70 32 L82 36" {...ST}/>
      {/* face */}
      <path d="M30 32 Q28 52 36 62 Q44 70 48 70 Q52 70 60 62 Q68 52 66 32" {...ST}/>
      {/* eyes */}
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      {/* eye wrinkles */}
      <path d="M35 43 Q37 41 40 42" {...ST}/>
      <path d="M56 42 Q59 41 61 43" {...ST}/>
      {/* smile */}
      <path d="M42 58 Q48 62 54 58" {...ST}/>
      {/* vest */}
      <path d="M28 88 Q28 76 38 72 L48 70 L58 72 Q68 76 68 88" {...ST} fill={ILLU_FILLS.blue}/>
      <path d="M48 70 L48 88" {...ST}/>
    </CharFrame>
  );
}

// C3 美姐 — ponytail, apron, holding spray bottle
function C3Helper({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* ponytail */}
      <path d="M70 38 Q82 44 80 60" {...ST} fill={ILLU_FILLS.yellow}/>
      {/* face */}
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...ST}/>
      {/* hair fringe */}
      <path d="M30 32 Q40 24 48 26 Q56 24 66 32" {...ST} fill={ILLU_FILLS.yellow}/>
      <ellipse cx="36" cy="52" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <ellipse cx="60" cy="52" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      {/* eyes */}
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      <path d="M42 56 Q48 60 54 56" {...ST}/>
      {/* apron + body */}
      <path d="M24 88 Q24 76 32 72 L42 70 L54 70 L64 72 Q72 76 72 88" {...ST}/>
      <path d="M38 72 L38 88 L58 88 L58 72 Z" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M40 72 L48 78 L56 72" {...ST}/>
    </CharFrame>
  );
}

// C4 张师傅 — chef hat, spatula
function C4Cook({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* chef hat */}
      <path d="M28 28 Q24 14 38 14 Q42 8 48 10 Q54 8 58 14 Q72 14 68 28 Z" {...ST} fill="#FFF" />
      <path d="M28 28 L68 28 L66 32 L30 32 Z" {...ST} fill={ILLU_FILLS.blue}/>
      {/* face */}
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...ST}/>
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <circle cx="40" cy="44" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="44" r="1.5" fill={sk} stroke="none"/>
      {/* mustache */}
      <path d="M40 53 Q44 56 48 54 Q52 56 56 53" {...ST}/>
      <path d="M42 60 Q48 63 54 60" {...ST}/>
      {/* body */}
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill={ILLU_FILLS.yellow}/>
    </CharFrame>
  );
}

// C5 Tom — straw hat, plant on shoulder
function C5Gardener({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* straw hat brim */}
      <ellipse cx="48" cy="28" rx="28" ry="6" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M34 28 Q34 14 48 12 Q62 14 62 28" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M40 20 L56 20" {...ST}/>
      {/* face */}
      <path d="M32 32 Q30 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...ST}/>
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      <path d="M42 58 Q48 62 54 58" {...ST}/>
      {/* shirt */}
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill={ILLU_FILLS.green}/>
      {/* plant on shoulder */}
      <rect x="68" y="58" width="14" height="10" rx="1" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M75 58 L75 50 M71 56 Q72 50 75 50 M79 56 Q78 50 75 50" {...ST}/>
    </CharFrame>
  );
}

// C6 Anna — short hair, stethoscope
function C6Nurse({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* hair */}
      <path d="M28 32 Q26 18 48 14 Q70 18 68 32 L66 36 L60 30 L52 32 L44 30 L36 32 L30 36 Z" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...ST}/>
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      <path d="M42 58 Q48 62 54 58" {...ST}/>
      {/* uniform */}
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill="#fff"/>
      {/* stethoscope */}
      <path d="M42 72 Q40 80 46 84 Q50 86 54 84 Q60 80 58 72" {...ST}/>
      <circle cx="50" cy="85" r="3" {...ST} fill={ILLU_FILLS.blue}/>
    </CharFrame>
  );
}

// C7 Bob — tool belt, wrench
function C7Fixer({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* hair */}
      <path d="M28 30 Q26 18 48 14 Q70 18 68 30" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M30 30 Q28 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 30" {...ST}/>
      <circle cx="40" cy="44" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="44" r="1.5" fill={sk} stroke="none"/>
      {/* beard hint */}
      <path d="M38 60 Q48 66 58 60" {...ST}/>
      <path d="M42 56 Q48 59 54 56" {...ST}/>
      {/* shirt + tool belt */}
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill={ILLU_FILLS.blue}/>
      <rect x="26" y="80" width="44" height="6" {...ST} fill={ILLU_FILLS.yellow}/>
      <rect x="38" y="78" width="6" height="10" {...ST}/>
      <rect x="52" y="78" width="6" height="10" {...ST}/>
    </CharFrame>
  );
}

// C8 daughter — middle-aged, phone
function C8Daughter({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      <path d="M28 30 Q26 16 48 14 Q70 16 68 30 L62 38 L48 36 L34 38 Z" {...ST} fill={ILLU_FILLS.green}/>
      <path d="M32 32 Q30 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...ST}/>
      <ellipse cx="36" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <ellipse cx="60" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      <path d="M42 58 Q48 60 54 58" {...ST}/>
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill={ILLU_FILLS.pink}/>
      {/* phone */}
      <rect x="68" y="48" width="10" height="16" rx="2" {...ST} fill={ILLU_FILLS.blue}/>
      <circle cx="73" cy="62" r="1" fill={sk} stroke="none"/>
    </CharFrame>
  );
}

// C9 AI — rounded square robot, single eye, headphones, heart
function C9AI({ size = 96, blink = false, talk = false, style }) {
  return (
    <CharFrame size={size} style={style}>
      {/* antenna */}
      <path d="M48 12 L48 6" {...ST}/>
      <circle cx="48" cy="6" r="2.5" fill={ILLU_FILLS.yellow} {...ST}/>
      {/* head */}
      <rect x="22" y="14" width="52" height="44" rx="14" {...ST} fill={ILLU_FILLS.blue}/>
      {/* headphones band on top */}
      <path d="M24 28 Q24 18 30 16" {...ST}/>
      <path d="M72 28 Q72 18 66 16" {...ST}/>
      <rect x="16" y="28" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
      <rect x="70" y="28" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
      {/* single eye */}
      {!blink
        ? <circle cx="48" cy="34" r="6" {...ST} fill="#fff"/>
        : <path d="M42 34 L54 34" {...ST}/>}
      {!blink && <circle cx="49" cy="33" r="2.5" fill={sk} stroke="none"/>}
      {/* mouth */}
      {talk
        ? <ellipse cx="48" cy="48" rx="5" ry="2.5" fill={sk} stroke="none"/>
        : <path d="M42 48 Q48 51 54 48" {...ST}/>}
      {/* body */}
      <rect x="28" y="60" width="40" height="28" rx="8" {...ST} fill={ILLU_FILLS.yellow}/>
      {/* heart on chest */}
      <path d="M48 70 L42 76 Q40 80 44 82 L48 78 L52 82 Q56 80 54 76 Z" fill={ILLU_FILLS.pink} stroke={sk} strokeWidth="2"/>
      {/* arms */}
      <path d="M28 68 L20 72" {...ST}/>
      <path d="M68 68 L76 72" {...ST}/>
    </CharFrame>
  );
}

// C10 admin — neutral, headset, laptop hinted
function C10Admin({ size = 96, style }) {
  return (
    <CharFrame size={size} style={style}>
      <path d="M28 30 Q26 16 48 14 Q70 16 68 30" {...ST} fill={ILLU_FILLS.green}/>
      <path d="M30 32 Q28 50 36 60 Q44 68 48 68 Q52 68 60 60 Q66 50 64 32" {...ST}/>
      {/* headset */}
      <path d="M28 38 Q28 26 48 24 Q68 26 68 38" {...ST}/>
      <rect x="24" y="36" width="6" height="10" rx="2" {...ST} fill={ILLU_FILLS.pink}/>
      <rect x="66" y="36" width="6" height="10" rx="2" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M70 44 Q74 50 70 56" {...ST}/>
      <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
      <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
      <path d="M42 58 Q48 61 54 58" {...ST}/>
      <path d="M26 88 Q26 76 36 72 L48 70 L60 72 Q70 76 70 88" {...ST} fill={ILLU_FILLS.blue}/>
    </CharFrame>
  );
}

// ─────────────────────────── Scenes ───────────────────────────

// S1 tea-time — Grandma on sofa, window, steam loop
function S1TeaTime({ width = 320, height = 200, style }) {
  return (
    <svg viewBox="0 0 320 200" width={width} height={height} style={style} aria-hidden="true">
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
      {/* window */}
      <rect x="200" y="20" width="100" height="80" rx="4" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M250 20 L250 100 M200 60 L300 60" {...ST}/>
      {/* sun rays */}
      <circle cx="280" cy="40" r="8" {...ST} fill={ILLU_FILLS.yellow}/>
      <path d="M280 28 L280 24 M268 40 L264 40 M292 40 L296 40 M271 31 L268 28 M289 31 L292 28" {...ST}/>
      {/* sofa */}
      <path d="M30 180 Q30 130 60 124 L180 124 Q210 130 210 180 Z" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M30 144 L210 144" {...ST}/>
      {/* grandma seated */}
      <g transform="translate(60,80)">
        <path d="M28 30 Q30 18 48 16 Q66 18 68 30" {...ST} fill={ILLU_FILLS.blue}/>
        <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...ST}/>
        <ellipse cx="36" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
        <ellipse cx="60" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
        <circle cx="38" cy="44" r="6" {...ST}/>
        <circle cx="58" cy="44" r="6" {...ST}/>
        <path d="M44 44 L52 44" {...ST}/>
        <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none"/>
        <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none"/>
        <path d="M42 56 Q48 60 54 56" {...ST}/>
        {/* cardigan body, hugs cup */}
        <path d="M14 100 Q14 80 32 72 L48 70 L64 72 Q82 80 82 100" {...ST} fill={ILLU_FILLS.yellow}/>
      </g>
      {/* tea cup on side */}
      <rect x="220" y="110" width="36" height="22" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
      <path d="M256 114 Q264 116 264 122 Q264 128 256 130" {...ST}/>
      <path d="M226 110 L226 106 L250 106 L250 110" {...ST}/>
      {/* steam */}
      <path className="s1-steam" d="M232 108 Q228 100 232 92 Q236 88 232 80" {...ST}/>
      <path className="s1-steam s1-steam-2" d="M244 108 Q240 100 244 92 Q248 88 244 80" {...ST}/>
    </svg>
  );
}

// S3 empty bookings — Grandpa with calendar, cat tail wag
function S3EmptyBookings({ width = 240, height = 160, style }) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} style={style} aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s3-tail { animation: s3tail 3s ease-in-out infinite; transform-origin: 200px 130px; }
          @keyframes s3tail { 0%, 100% { transform: rotate(-8deg); } 50% { transform: rotate(20deg); } }
        }
      `}</style>
      {/* calendar */}
      <rect x="100" y="30" width="80" height="60" rx="4" {...ST} fill={ILLU_FILLS.blue}/>
      <path d="M100 46 L180 46" {...ST}/>
      <circle cx="115" cy="38" r="2" fill={sk} stroke="none"/>
      <circle cx="165" cy="38" r="2" fill={sk} stroke="none"/>
      {[0,1,2].map(r => [0,1,2,3].map(c => (
        <rect key={`${r}-${c}`} x={108 + c*18} y={54 + r*10} width="12" height="6" rx="1" {...ST}/>
      )))}
      {/* grandpa */}
      <g transform="translate(20,30)">
        <path d="M26 22 Q26 8 48 6 Q70 8 70 22" {...ST} fill={ILLU_FILLS.green}/>
        <path d="M70 22 L82 26" {...ST}/>
        <path d="M30 22 Q28 42 36 52 Q44 60 48 60 Q52 60 60 52 Q68 42 66 22" {...ST}/>
        <circle cx="40" cy="36" r="1.5" fill={sk} stroke="none"/>
        <circle cx="56" cy="36" r="1.5" fill={sk} stroke="none"/>
        <path d="M42 48 Q48 50 54 48" {...ST}/>
        {/* hand on chin */}
        <path d="M48 60 Q56 66 60 70" {...ST}/>
        <circle cx="61" cy="71" r="4" {...ST} fill={ILLU_FILLS.pink}/>
      </g>
      {/* cat */}
      <g transform="translate(180,110)">
        <ellipse cx="20" cy="30" rx="20" ry="12" {...ST} fill={ILLU_FILLS.yellow}/>
        <circle cx="6" cy="22" r="8" {...ST} fill={ILLU_FILLS.yellow}/>
        <path d="M2 16 L4 12 L8 16 Z M10 14 L12 10 L14 14 Z" {...ST}/>
        <circle cx="4" cy="22" r=".8" fill={sk} stroke="none"/>
        <circle cx="8" cy="22" r=".8" fill={sk} stroke="none"/>
        <path d="M5 25 L7 25" {...ST}/>
        <g className="s3-tail">
          <path d="M40 30 Q50 24 48 14" {...ST}/>
        </g>
      </g>
      {/* floor line */}
      <path d="M0 150 L240 150" {...ST}/>
    </svg>
  );
}

// S4 empty chat — AI waving
function S4EmptyChat({ width = 240, height = 160, style }) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} style={style} aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s4-wave { animation: s4wave 2s ease-in-out infinite; transform-origin: 165px 75px; }
          @keyframes s4wave { 0%,100% { transform: rotate(-10deg); } 50% { transform: rotate(20deg); } }
        }
      `}</style>
      <g transform="translate(70,30)">
        <path d="M48 12 L48 4" {...ST}/>
        <circle cx="48" cy="4" r="2.5" fill={ILLU_FILLS.yellow} {...ST}/>
        <rect x="22" y="14" width="52" height="44" rx="14" {...ST} fill={ILLU_FILLS.blue}/>
        <rect x="16" y="28" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
        <rect x="70" y="28" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
        <circle cx="48" cy="34" r="6" {...ST} fill="#fff"/>
        <circle cx="49" cy="33" r="2.5" fill={sk} stroke="none"/>
        <path d="M42 48 Q48 51 54 48" {...ST}/>
        <rect x="28" y="60" width="40" height="28" rx="8" {...ST} fill={ILLU_FILLS.yellow}/>
        <path d="M48 70 L42 76 Q40 80 44 82 L48 78 L52 82 Q56 80 54 76 Z" fill={ILLU_FILLS.pink} stroke={sk} strokeWidth="2"/>
        <path d="M28 68 L18 72" {...ST}/>
        <g className="s4-wave">
          <path d="M68 68 Q82 64 90 50" {...ST}/>
          <circle cx="92" cy="48" r="4" {...ST} fill={ILLU_FILLS.pink}/>
        </g>
      </g>
    </svg>
  );
}

// S5 payment success — handshake + draw-on check
function S5PaymentSuccess({ width = 280, height = 200, style }) {
  return (
    <svg viewBox="0 0 280 200" width={width} height={height} style={style} aria-hidden="true">
      <style>{`
        @media (prefers-reduced-motion: no-preference) {
          .s5-check { stroke-dasharray: 60; stroke-dashoffset: 60; animation: s5draw .6s .2s ease-out forwards; }
          @keyframes s5draw { to { stroke-dashoffset: 0; } }
        }
      `}</style>
      {/* check circle */}
      <circle cx="140" cy="40" r="22" {...ST} fill={ILLU_FILLS.green}/>
      <path className="s5-check" d="M130 40 L138 48 L152 34" stroke="var(--success, #16A34A)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* helper left */}
      <g transform="translate(30,80)">
        <path d="M70 38 Q82 44 80 60" {...ST} fill={ILLU_FILLS.yellow}/>
        <path d="M30 32 Q28 50 34 60 Q42 68 48 68 Q54 68 62 60 Q68 50 66 32" {...ST}/>
        <path d="M30 32 Q40 24 48 26 Q56 24 66 32" {...ST} fill={ILLU_FILLS.yellow}/>
        <circle cx="40" cy="46" r="1.5" fill={sk} stroke="none"/>
        <circle cx="56" cy="46" r="1.5" fill={sk} stroke="none"/>
        <path d="M42 58 Q48 60 54 58" {...ST}/>
        <path d="M24 100 Q24 80 32 72 L42 70 L54 70 L64 72 Q72 80 72 100" {...ST}/>
        <path d="M38 72 L38 100 L58 100 L58 72" {...ST} fill={ILLU_FILLS.pink}/>
        {/* extending right hand */}
        <path d="M64 80 L92 88" {...ST}/>
        <ellipse cx="96" cy="89" rx="6" ry="4" {...ST} fill={ILLU_FILLS.pink}/>
      </g>
      {/* grandma right */}
      <g transform="translate(150,80)">
        <path d="M28 30 Q30 18 48 16 Q66 18 68 30" {...ST} fill={ILLU_FILLS.blue}/>
        <path d="M28 32 Q26 50 32 60 Q40 70 48 70 Q56 70 64 60 Q70 50 68 32" {...ST}/>
        <ellipse cx="36" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
        <ellipse cx="60" cy="50" rx="3" ry="2" fill={ILLU_FILLS.pink} stroke="none"/>
        <circle cx="38" cy="44" r="6" {...ST}/>
        <circle cx="58" cy="44" r="6" {...ST}/>
        <path d="M44 44 L52 44" {...ST}/>
        <circle cx="38" cy="44" r="1.5" fill={sk} stroke="none"/>
        <circle cx="58" cy="44" r="1.5" fill={sk} stroke="none"/>
        <path d="M42 56 Q48 60 54 56" {...ST}/>
        <path d="M22 100 Q22 80 32 72 L48 70 L64 72 Q74 80 74 100" {...ST} fill={ILLU_FILLS.yellow}/>
        {/* extending left hand */}
        <path d="M30 80 L4 88" {...ST}/>
        <ellipse cx="0" cy="89" rx="6" ry="4" {...ST} fill={ILLU_FILLS.pink}/>
      </g>
      <path d="M0 190 L280 190" {...ST}/>
    </svg>
  );
}

// S7 network error — robot with broken antenna + cloud
function S7Network({ width = 240, height = 160, style }) {
  return (
    <svg viewBox="0 0 240 160" width={width} height={height} style={style} aria-hidden="true">
      {/* cloud */}
      <path d="M50 50 Q50 38 62 38 Q66 30 76 32 Q86 30 90 40 Q102 40 102 52 L48 52 Z" {...ST} fill={ILLU_FILLS.blue}/>
      <g transform="translate(120,30)">
        {/* broken antenna - top piece */}
        <path d="M48 8 L52 2" {...ST}/>
        <circle cx="53" cy="1" r="2" fill={ILLU_FILLS.yellow} {...ST}/>
        {/* base */}
        <path d="M48 18 L48 14" {...ST}/>
        <path d="M44 14 L52 14" {...ST}/>
        <rect x="22" y="22" width="52" height="44" rx="14" {...ST} fill={ILLU_FILLS.blue}/>
        <rect x="16" y="36" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
        <rect x="70" y="36" width="10" height="14" rx="3" {...ST} fill={ILLU_FILLS.pink}/>
        {/* sad eye */}
        <path d="M42 42 Q48 38 54 42" {...ST}/>
        <path d="M42 56 Q48 52 54 56" {...ST}/>
        <rect x="28" y="68" width="40" height="28" rx="8" {...ST} fill={ILLU_FILLS.yellow}/>
        <path d="M48 78 L42 84 Q40 88 44 90 L48 86 L52 90 Q56 88 54 84 Z" fill={ILLU_FILLS.pink} stroke={sk} strokeWidth="2"/>
      </g>
      <path d="M0 150 L240 150" {...ST}/>
    </svg>
  );
}

// Loading dots
function LoadingDots({ size = 80, style }) {
  return (
    <svg viewBox="0 0 96 60" width={size} height={size * 60 / 96} style={style} aria-hidden="true">
      <style>{`
        .ld-d { animation: lddot 1.2s ease-in-out infinite; transform-origin: center; }
        .ld-d2 { animation-delay: .15s; }
        .ld-d3 { animation-delay: .3s; }
        @keyframes lddot { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-8px); } }
      `}</style>
      <rect x="22" y="14" width="52" height="34" rx="12" {...ST} fill={ILLU_FILLS.blue}/>
      <circle cx="48" cy="30" r="5" {...ST} fill="#fff"/>
      <circle cx="49" cy="29" r="2" fill={sk} stroke="none"/>
      <circle className="ld-d" cx="36" cy="56" r="3" fill={ILLU_FILLS.yellow} stroke={sk} strokeWidth="2"/>
      <circle className="ld-d ld-d2" cx="48" cy="56" r="3" fill={ILLU_FILLS.pink} stroke={sk} strokeWidth="2"/>
      <circle className="ld-d ld-d3" cx="60" cy="56" r="3" fill={ILLU_FILLS.green} stroke={sk} strokeWidth="2"/>
    </svg>
  );
}

Object.assign(window, {
  C1Grandma, C2Grandpa, C3Helper, C4Cook, C5Gardener, C6Nurse, C7Fixer, C8Daughter, C9AI, C10Admin,
  S1TeaTime, S3EmptyBookings, S4EmptyChat, S5PaymentSuccess, S7Network, LoadingDots,
  ILLU_FILLS,
});
