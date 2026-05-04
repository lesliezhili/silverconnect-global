// Sprint 1 — shared shell: PhoneFrame, DesktopFrame, Header, BottomTab, AIFab, mini-helpers
// Per UI_DESIGN.md §2 + Sprint 1 brief baseline rules.

const SP1_T = {
  zh: {
    home: '首页', services: '服务', bookings: '预订', messages: '消息', profile: '我的',
    askAI: '问一下', talkHuman: '转人工',
    incl: { AU: '（含 GST）', CN: '（含 VAT）', CA: '（含 HST）' },
    inclTip: { AU: '所有价格已含 GST', CN: '所有价格已含 VAT', CA: '所有价格已含 HST' },
    emTitle: '需要紧急帮助？',
    emSub: { AU: '澳洲紧急服务 — 综合', CN: '中国 120 医疗急救', CA: '加拿大 911 综合紧急' },
    emSubLine2: { CN: '火警 119 / 报警 110' },
    emCall: { AU: '立即拨打 000', CN: '立即拨打 120', CA: '立即拨打 911' },
    emNotify: '通知紧急联系人',
    emClose: '长按 2 秒关闭',
  },
  en: {
    home: 'Home', services: 'Services', bookings: 'Bookings', messages: 'Messages', profile: 'Profile',
    askAI: 'Ask AI', talkHuman: 'Talk to a human',
    incl: { AU: ' (incl. GST)', CN: ' (incl. VAT)', CA: ' (incl. HST)' },
    inclTip: { AU: 'All prices include GST', CN: 'All prices include VAT', CA: 'All prices include HST' },
    emTitle: 'Need emergency help?',
    emSub: { AU: 'Australian Emergency — combined', CN: 'China 120 Medical Emergency', CA: 'Canada 911 Combined Emergency' },
    emSubLine2: { CN: 'Fire 119 / Police 110' },
    emCall: { AU: 'Call 000 now', CN: 'Call 120 now', CA: 'Call 911 now' },
    emNotify: 'Notify my emergency contact',
    emClose: 'Hold 2s to close',
  },
};

const SP1_CUR = { AU: 'A$', CN: '¥', CA: 'C$' };
const SP1_TAX = { AU: 'GST 10%', CN: 'VAT 6%', CA: 'HST 13%' };
const SP1_FLAG = { AU: '🇦🇺', CN: '🇨🇳', CA: '🇨🇦' };

function fmt(country, n) {
  const cur = SP1_CUR[country];
  return cur + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

// Phone frame — 390×812 inner, with status bar but NO home indicator (clean for canvas)
function Sp1Phone({ children, label, theme = 'light', height = 812 }) {
  return (
    <div className={'sc-root sc-' + theme} style={{
      width: 390, height,
      background: 'var(--bg-base)',
      borderRadius: 36,
      border: '8px solid #1a1a1a',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 24px 48px rgba(15,23,42,.18)',
      flexShrink: 0,
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', zIndex: 5 }}>
        <span>9:41</span>
        <span>•••• ▲ 100%</span>
      </div>
      <div style={{ position: 'absolute', top: 36, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>{children}</div>
    </div>
  );
}

// Desktop frame — 1280×800 with browser chrome stripped, content centered with 720 max-width
function Sp1Desktop({ children, theme = 'light', height = 800 }) {
  return (
    <div className={'sc-root sc-' + theme} style={{
      width: 1280, height,
      background: 'var(--bg-surface)',
      borderRadius: 12,
      border: '1px solid var(--border)',
      overflow: 'hidden',
      position: 'relative',
      boxShadow: '0 24px 48px rgba(15,23,42,.18)',
      flexShrink: 0,
    }}>
      {children}
    </div>
  );
}

// Mobile Header §2.1 — 64px, sticky in real life, here just first row
function Sp1MobileHeader({ lang = 'zh', country = 'AU', back = false, onBack, right = null, theme = 'light' }) {
  return (
    <div style={{
      height: 64, padding: '0 16px',
      background: 'var(--bg-base)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {back ? (
          <button className="sc-iconbtn" onClick={onBack} aria-label={lang === 'zh' ? '返回' : 'Back'} style={{ marginLeft: -8 }}>
            <IconBack size={24}/>
          </button>
        ) : (
          <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '-0.01em' }}>SilverConnect</span>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {right}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 10px', height: 36, borderRadius: 999, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          {SP1_FLAG[country]} {country}
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0 10px', height: 36, borderRadius: 999, background: 'var(--bg-surface)', border: '1.5px solid var(--border)', fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>
          🌐 {lang === 'zh' ? '中文' : 'EN'}
        </span>
      </div>
    </div>
  );
}

// Desktop Header — full SilverConnect logo + nav + chips + avatar
function Sp1DesktopHeader({ lang = 'zh', country = 'AU', currentRoute = 'home' }) {
  const nav = lang === 'zh'
    ? [['home', '首页'], ['services', '服务'], ['bookings', '预订'], ['messages', '消息']]
    : [['home', 'Home'], ['services', 'Services'], ['bookings', 'Bookings'], ['messages', 'Messages']];
  return (
    <div style={{ height: 80, padding: '0 32px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 40 }}>
        <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-primary)', letterSpacing: '-0.01em' }}>SilverConnect</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {nav.map(([k, n]) => (
            <a key={k} href="#" style={{ padding: '0 16px', height: 40, display: 'inline-flex', alignItems: 'center', borderRadius: 10, fontSize: 16, fontWeight: 600, textDecoration: 'none', color: currentRoute === k ? 'var(--brand-primary)' : 'var(--text-secondary)', background: currentRoute === k ? 'var(--brand-primary-soft)' : 'transparent' }}>{n}</a>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="sc-chip" style={{ height: 40 }}>{SP1_FLAG[country]} {country}</span>
        <span className="sc-chip" style={{ height: 40 }}>🌐 {lang === 'zh' ? '中文' : 'EN'}</span>
        <button className="sc-iconbtn"><IconBell size={22}/></button>
        <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--brand-accent-soft)', color: '#92590A', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>M</div>
      </div>
    </div>
  );
}

// Bottom tab bar §2.2 — mobile only
function Sp1Tabs({ active = 'home', lang = 'zh' }) {
  const t = SP1_T[lang];
  const items = [
    { id: 'home', icon: IconHome, label: t.home },
    { id: 'services', icon: IconGrid, label: t.services },
    { id: 'bookings', icon: IconCal, label: t.bookings },
    { id: 'messages', icon: IconChat, label: t.messages },
    { id: 'profile', icon: IconUser, label: t.profile },
  ];
  return (
    <div className="sc-tabbar" style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
      {items.map(it => {
        const I = it.icon;
        const on = it.id === active;
        return (
          <button key={it.id} className={'sc-tabbar-item' + (on ? ' is-active' : '')}>
            <I size={26} strokeWidth={on ? 2.5 : 2}/>
            <span>{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// AI Float button §2.3
function Sp1AIFab({ lang = 'zh', label, bottom = 96, right = 16 }) {
  return (
    <button className="sc-ai-fab" style={{ bottom, right, position: 'absolute' }} aria-label={label || (lang === 'zh' ? '问一下' : 'Ask AI')}>
      <IconChat size={26}/>
      <span style={{ fontSize: 11, fontWeight: 700 }}>{label || (lang === 'zh' ? '问一下' : 'Ask AI')}</span>
    </button>
  );
}

// 4-step progress bar (booking wizard)
function Sp1Progress({ step = 1, lang = 'zh' }) {
  const labels = lang === 'zh'
    ? ['服务', '时间', '地址', '确认']
    : ['Service', 'Time', 'Address', 'Confirm'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 16px', background: 'var(--bg-base)', gap: 4 }}>
      {labels.map((l, i) => {
        const idx = i + 1;
        const done = idx < step;
        const active = idx === step;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flex: '0 0 auto' }}>
              <div style={{
                width: 28, height: 28, borderRadius: 999,
                background: done ? 'var(--success)' : active ? 'var(--brand-primary)' : 'var(--bg-surface-2)',
                color: done || active ? '#fff' : 'var(--text-tertiary)',
                fontSize: 13, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: active ? '0 0 0 4px var(--brand-primary-soft)' : 'none',
              }}>{done ? '✓' : idx}</div>
              <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>{l}</span>
            </div>
            {i < labels.length - 1 && <div style={{ flex: 1, height: 2, background: idx < step ? 'var(--success)' : 'var(--border)', marginBottom: 18 }}/>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// Status badge per §1.5 + booking states
function Sp1Badge({ kind, children }) {
  const cls = {
    pending: 'sc-badge-warning',
    confirmed: 'sc-badge-info',
    in_progress: 'sc-badge-info',
    awaiting: 'sc-badge-warning',
    completed: 'sc-badge-success',
    cancelled: 'sc-badge-danger',
    refunded: 'sc-badge-neutral',
  }[kind] || 'sc-badge-neutral';
  return <span className={'sc-badge ' + cls}>{children}</span>;
}

// Skeleton
function Sp1Skel({ w = '100%', h = 18, r = 8, mt = 0, style }) {
  return <div className="sc-skel" style={{ width: w, height: h, borderRadius: r, marginTop: mt, ...style }}/>;
}

Object.assign(window, {
  SP1_T, SP1_CUR, SP1_TAX, SP1_FLAG, fmt,
  Sp1Phone, Sp1Desktop, Sp1MobileHeader, Sp1DesktopHeader,
  Sp1Tabs, Sp1AIFab, Sp1Progress, Sp1Badge, Sp1Skel,
});
