// Screens — Part 1: Home, Services, Booking flow
// All screens are mobile-first 390×844 unless noted; desktop variants use 720px content max-width.

const T = {
  zh: {
    greeting: '你好，王阿姨',
    sub: '今天需要什么帮助？',
    searchPh: '搜服务、地区或师傅',
    cats: ['清洁', '烹饪', '园艺', '个人护理', '维修'],
    recent: '我最近订过',
    recommend: '推荐 Provider',
    perHour: '/小时',
    inclTax: '含 GST',
    book: '立即预订',
    view: '查看',
    bookings: '我的预订',
    services: '服务',
    home: '首页',
    me: '我的',
    msg: '消息',
    askAI: '问一下',
    upcoming: '即将进行',
    history: '历史',
    recurring: '循环'
  },
  en: {
    greeting: 'Hi, Margaret',
    sub: 'What do you need today?',
    searchPh: 'Search services, area, or helper',
    cats: ['Cleaning', 'Cooking', 'Garden', 'Personal Care', 'Repair'],
    recent: 'Recently booked',
    recommend: 'Recommended',
    perHour: '/hr',
    inclTax: 'incl. GST',
    book: 'Book now',
    view: 'View',
    bookings: 'Bookings',
    services: 'Services',
    home: 'Home',
    me: 'Me',
    msg: 'Messages',
    askAI: 'Ask AI',
    upcoming: 'Upcoming',
    history: 'History',
    recurring: 'Recurring'
  }
};

// ─────────── Mobile Frame ───────────
function PhoneFrame({ children, dark = false, label, height = 780, statusBar = true, tabBar = null }) {
  return (
    <div style={{
      width: 390, height, borderRadius: 44, padding: 8,
      background: dark ? '#0A0A0A' : '#1A1A1A',
      boxShadow: '0 30px 60px rgba(0,0,0,0.18), 0 8px 20px rgba(0,0,0,0.10)',
      position: 'relative', flexShrink: 0
    }}>
      <div style={{
        width: '100%', height: '100%', borderRadius: 36, overflow: 'hidden',
        background: 'var(--bg-base)', position: 'relative', display: 'flex', flexDirection: 'column'
      }} className="sc-noscroll">
        {statusBar && <PhoneStatusBar dark={dark} />}
        <div style={{ flex: 1, overflow: 'auto', position: 'relative' }} className="sc-noscroll">
          {children}
        </div>
        {tabBar}
        <div style={{
          position: 'absolute', bottom: 6, left: '50%', transform: 'translateX(-50%)',
          width: 130, height: 5, borderRadius: 3, background: dark ? '#fff' : '#0F172A', opacity: 0.85
        }} />
      </div>
    </div>);

}

function PhoneStatusBar({ dark }) {
  const c = 'var(--text-primary)';
  return (
    <div style={{
      height: 50, padding: '14px 28px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      flexShrink: 0
    }}>
      <span style={{ fontSize: 16, fontWeight: 600, color: c }}>9:41</span>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center', color: c }}>
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor"><rect x="0" y="7" width="3" height="4" rx="0.6" /><rect x="5" y="4" width="3" height="7" rx="0.6" /><rect x="10" y="2" width="3" height="9" rx="0.6" /><rect x="15" y="0" width="3" height="11" rx="0.6" /></svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor"><path d="M8 3a8 8 0 0 1 5.5 2L14.5 4A9.5 9.5 0 0 0 1.5 4l1 1A8 8 0 0 1 8 3z" /><path d="M8 6a5 5 0 0 1 3.5 1.5l1-1A6.5 6.5 0 0 0 3.5 6.5l1 1A5 5 0 0 1 8 6z" /><circle cx="8" cy="9.5" r="1.3" /></svg>
        <svg width="26" height="12" viewBox="0 0 26 12" fill="none" stroke="currentColor" strokeWidth="1"><rect x="0.5" y="0.5" width="22" height="11" rx="3" /><rect x="2" y="2" width="19" height="8" rx="2" fill="currentColor" /><rect x="23.5" y="4" width="1.5" height="4" rx="0.5" fill="currentColor" /></svg>
      </div>
    </div>);

}

// ─────────── Bottom Tab ───────────
function BottomTab({ active = 'home', t = T.zh }) {
  const items = [
  { id: 'home', icon: IconHome, label: t.home },
  { id: 'services', icon: IconGrid, label: t.services },
  { id: 'bookings', icon: IconCal, label: t.bookings },
  { id: 'msg', icon: IconChat, label: t.msg },
  { id: 'me', icon: IconUser, label: t.me }];

  return (
    <div className="sc-tabbar" style={{ flexShrink: 0 }}>
      {items.map((it) => {
        const I = it.icon;
        const a = it.id === active;
        return (
          <button key={it.id} className={`sc-tabbar-item ${a ? 'is-active' : ''}`}>
            <I size={28} strokeWidth={a ? 2.5 : 2} />
            <span>{it.label}</span>
          </button>);

      })}
    </div>);

}

// ─────────── AI FAB ───────────
function AIFab({ emergency = false, lang = 'zh', style }) {
  return (
    <button className={`sc-ai-fab ${emergency ? 'is-emergency' : ''}`} style={style} aria-label="AI助手">
      {emergency ? <IconAlert size={24} /> : <IconAI size={24} />}
      <span>{emergency ? lang === 'zh' ? '紧急' : 'SOS' : lang === 'zh' ? '问一下' : 'Ask AI'}</span>
    </button>);

}

// ═══════════ 1. HOME ═══════════
function HomeScreen({ lang = 'zh', country = 'AU', desktop = false }) {
  const t = T[lang];
  const cats = [
  { name: t.cats[0], color: '#1F6FEB', soft: '#E8F0FE', Icon: IconClean, count: '230+ ' + (lang === 'zh' ? '位' : 'helpers') },
  { name: t.cats[1], color: '#F59E0B', soft: '#FEF3C7', Icon: IconCook, count: '110+ ' + (lang === 'zh' ? '位' : 'helpers') },
  { name: t.cats[2], color: '#16A34A', soft: '#DCFCE7', Icon: IconGarden, count: '65+ ' + (lang === 'zh' ? '位' : 'helpers') },
  { name: t.cats[3], color: '#DB2777', soft: '#FCE7F3', Icon: IconCare, count: '40+ ' + (lang === 'zh' ? '位' : 'helpers') },
  { name: t.cats[4], color: '#7C3AED', soft: '#EDE9FE', Icon: IconRepair, count: '55+ ' + (lang === 'zh' ? '位' : 'helpers') }];

  const cur = country === 'AU' ? 'A$' : country === 'CN' ? '¥' : 'C$';
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      {/* Header */}
      <div style={{ padding: desktop ? '24px 32px 0' : '16px 20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Logo size={desktop ? 32 : 28} />
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sc-iconbtn" aria-label="通知"><IconBell size={24} /><span style={{ position: 'absolute', top: 10, right: 10, width: 8, height: 8, borderRadius: 999, background: 'var(--danger)' }} /></button>
          <button className="sc-iconbtn" aria-label="搜索"><IconSearch size={24} /></button>
        </div>
      </div>

      {/* Hero greeting */}
      <div style={{ padding: desktop ? '24px 32px 12px' : '20px 20px 8px' }}>
        <h1 className="sc-h1" style={{ margin: 0, fontSize: desktop ? 36 : 30, lineHeight: 1.2 }}>
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{t.greeting.split(/[，,]/)[0]}{t.greeting.includes(',') || t.greeting.includes('，') ? t.greeting.includes('，') ? '，' : ', ' : ''}</span>
          <span style={{ color: 'var(--brand-primary)' }}>{t.greeting.split(/[，,]/).slice(1).join('') || t.greeting}</span> 👋
        </h1>
        <p className="sc-body" style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>{t.sub}</p>
      </div>

      {/* Search */}
      <div style={{ padding: desktop ? '12px 32px' : '12px 20px' }}>
        <div style={{ position: 'relative' }}>
          <IconSearch size={24} style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }} />
          <input className="sc-input" placeholder={t.searchPh} style={{ paddingLeft: 52, height: 60, fontSize: 18, background: 'var(--bg-base)' }} />
        </div>
      </div>

      {/* Category grid */}
      <div style={{ padding: desktop ? '20px 32px 12px' : '16px 20px 8px' }}>
        <h2 className="sc-h3" style={{ margin: '0 0 12px', color: "rgb(240, 235, 235)" }}>{lang === 'zh' ? '选个服务类别' : 'Choose a category'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {cats.slice(0, 4).map((c) => {
            const I = c.Icon;
            return (
              <div key={c.name} style={{
                background: 'var(--bg-base)', borderRadius: 20, padding: 18,
                border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
                cursor: 'pointer', height: 140, display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: c.soft, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={32} />
                </div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>{c.name}</div>
                  <div className="sc-tiny" style={{ marginTop: 2 }}>{c.count}</div>
                </div>
              </div>);

          })}
          <div style={{
            gridColumn: '1 / -1',
            background: 'var(--bg-base)', borderRadius: 20, padding: 18,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
            display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer'
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: cats[4].soft, color: cats[4].color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconRepair size={32} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 22, fontWeight: 700 }}>{cats[4].name}</div>
              <div className="sc-tiny">{cats[4].count}</div>
            </div>
            <IconChev size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>
      </div>

      {/* Recent providers */}
      <div style={{ padding: desktop ? '20px 32px 12px' : '20px 0 8px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingRight: desktop ? 0 : 20 }}>
          <h2 className="sc-h3" style={{ margin: 0 }}>{t.recent}</h2>
          <button className="sc-btn-ghost" style={{ background: 'none', border: 'none', color: 'var(--brand-primary)', fontSize: 16, fontWeight: 600, cursor: 'pointer' }}>{lang === 'zh' ? '全部 →' : 'All →'}</button>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, overflowX: 'auto', paddingRight: desktop ? 0 : 20, paddingBottom: 4 }} className="sc-noscroll">
          {[
          { name: lang === 'zh' ? '李 师傅' : 'Helen Li', rating: 4.9, hue: 0, init: lang === 'zh' ? '李' : 'HL' },
          { name: lang === 'zh' ? '陈 阿姨' : 'May Chen', rating: 4.8, hue: 1, init: lang === 'zh' ? '陈' : 'MC' },
          { name: lang === 'zh' ? '王 师傅' : 'Tom Wang', rating: 5.0, hue: 2, init: lang === 'zh' ? '王' : 'TW' }].
          map((p, i) =>
          <div key={i} style={{
            minWidth: 200, background: 'var(--bg-base)', borderRadius: 20, padding: 16,
            border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)'
          }}>
              <ProviderAvatar size={56} hue={p.hue} initials={p.init} />
              <div style={{ marginTop: 10, fontSize: 18, fontWeight: 700 }}>{p.name}</div>
              <div className="sc-row" style={{ marginTop: 4, gap: 4 }}>
                <IconStar size={16} style={{ color: 'var(--brand-accent)' }} />
                <span style={{ fontSize: 16, fontWeight: 600 }}>{p.rating}</span>
                <span className="sc-tiny" style={{ marginLeft: 4 }}>· {lang === 'zh' ? '清洁' : 'Cleaning'}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recommended */}
      <div style={{ padding: desktop ? '20px 32px 32px' : '20px 20px 32px' }}>
        <h2 className="sc-h3" style={{ margin: '0 0 12px' }}>{t.recommend}</h2>
        <ProviderCard hue={3} initials={lang === 'zh' ? '林' : 'JL'} name={lang === 'zh' ? '林 阿姨' : 'Jane Lin'} cur={cur} lang={lang} rating={4.9} reviews={132} dist="2.1" price="55" />
      </div>

      <AIFab lang={lang} style={{ position: 'sticky', bottom: 100, marginLeft: 'calc(100% - 84px)' }} />
    </div>);

}

// Reusable Provider card
function ProviderCard({ hue = 0, initials = '李', name, cur = 'A$', lang = 'zh', rating = 4.9, reviews = 132, dist = '3.0', price = '55', verified = true, firstAid = true, compact = false }) {
  return (
    <div style={{
      background: 'var(--bg-base)', borderRadius: 20, padding: compact ? 16 : 20,
      border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)',
      display: 'flex', gap: 16, alignItems: 'flex-start'
    }}>
      <ProviderAvatar size={compact ? 64 : 80} hue={hue} initials={initials} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "rgb(248, 247, 247)" }}>{name}</div>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)' }} aria-label="收藏">
            <IconHeart size={24} />
          </button>
        </div>
        <div className="sc-row" style={{ marginTop: 6, gap: 8, flexWrap: 'wrap' }}>
          <span className="sc-row" style={{ gap: 4 }}>
            <IconStar size={16} style={{ color: 'var(--brand-accent)' }} />
            <span style={{ fontWeight: 600 }}>{rating}</span>
            <span className="sc-tiny">({reviews})</span>
          </span>
          <span className="sc-tiny">· 中文 · {dist}km</span>
        </div>
        <div className="sc-row" style={{ marginTop: 10, gap: 6, flexWrap: 'wrap' }}>
          {verified && <span className="sc-badge sc-badge-success"><IconShield size={14} /> {lang === 'zh' ? '已验证' : 'Verified'}</span>}
          {firstAid && <span className="sc-badge sc-badge-info">+{lang === 'zh' ? '急救证' : 'First aid'}</span>}
        </div>
        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <span className="sc-pricetag">{cur}{price}</span>
            <span className="sc-pricetag-tax">/{lang === 'zh' ? '小时' : 'hr'} · {lang === 'zh' ? '含税' : 'incl. tax'}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
          <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flex: 1 }}>{lang === 'zh' ? '查看' : 'View'}</button>
          <button className="sc-btn sc-btn-primary sc-btn-sm" style={{ flex: 1 }}>{lang === 'zh' ? '立即预订' : 'Book now'} →</button>
        </div>
      </div>
    </div>);

}

Object.assign(window, { T, PhoneFrame, PhoneStatusBar, BottomTab, AIFab, HomeScreen, ProviderCard });