// v2-screens.jsx — SilverConnect v2 screens that integrate the illustration system
// Reuses tokens.css, icons.jsx, and existing PhoneFrame from ios-frame.jsx.

const T2 = {
  zh: { greet: '你好，王阿姨', sub: '今天需要什么帮助？', search: '🔍 搜服务或地址',
    cats: ['清洁', '烹饪', '园艺', '个人护理', '维修'],
    recent: '我最近订过', recommend: '推荐 Provider', tabs: ['首页', '服务', '预订', '消息', '我的'],
    askAI: '问一下', emptyBookings: '还没有预订', browse: '浏览服务 →',
    paid: '已支付', orderNo: '订单号 SC-1284', noNet: '连不上网', retry: '重试',
    aiHello: '您好王阿姨，需要什么帮助？', emergency: '请立即拨打',
    weekIncome: '本周收入', heldFunds: '托管中', received: '已到账',
    todayTasks: '今日任务（3 单）', start: '开始当前任务',
    rateAsk: '请评价 周三的清洁服务',
  },
  en: { greet: 'Hi, Margaret', sub: 'What do you need today?', search: '🔍 Search services or address',
    cats: ['Cleaning', 'Cooking', 'Garden', 'Personal care', 'Repair'],
    recent: 'Recently booked', recommend: 'Recommended', tabs: ['Home', 'Services', 'Bookings', 'Inbox', 'Me'],
    askAI: 'Ask AI', emptyBookings: 'No bookings yet', browse: 'Browse services →',
    paid: 'Paid', orderNo: 'Order SC-1284', noNet: "Can't connect", retry: 'Retry',
    aiHello: 'Hi Margaret, how can I help?', emergency: 'CALL NOW',
    weekIncome: 'This week', heldFunds: 'Held', received: 'Received',
    todayTasks: "Today's tasks (3)", start: 'Start current task',
    rateAsk: 'Rate Wed cleaning service',
  },
};

// ── Home v2 — hero with S1 illustration ─────────────────────────
function HomeV2({ lang = 'zh', country = 'AU' }) {
  const t = T2[lang];
  const cur = country === 'AU' ? 'A$' : country === 'CN' ? '¥' : country === 'US' ? '$' : country === 'CA' ? 'C$' : country === 'UZ' ? "so'm " : 'A$';
  const flag = country === 'AU' ? '🇦🇺' : country === 'CN' ? '🇨🇳' : country === 'US' ? '🇺🇸' : country === 'CA' ? '🇨🇦' : country === 'UZ' ? '🇺🇿' : '🇦🇺';
  const langLabel = lang === 'zh' ? '中文' : lang === 'uz' ? "O'zbek" : 'English';
  const cats = [
    { Char: C3Helper, name: t.cats[0], price: cur + '55' },
    { Char: C4Cook, name: t.cats[1], price: cur + '40' },
    { Char: C5Gardener, name: t.cats[2], price: cur + '60' },
    { Char: C6Nurse, name: t.cats[3], price: cur + '70' },
    { Char: C7Fixer, name: t.cats[4], price: cur + '80' },
  ];
  const fromTxt = lang === 'zh' ? '/小时起' : 'from';
  return (
    <div style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', minHeight: '100%', position: 'relative' }}>
      {/* Hero */}
      <div style={{ background: 'var(--bg-base)', padding: '20px 20px 8px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Logo size={28}/>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="sc-chip" style={{ height: 36, fontSize: 14, gap: 6 }}>{flag} <span style={{ fontWeight: 600 }}>{country}</span></span>
            <span className="sc-chip" style={{ height: 36, fontSize: 14 }}>🌐 {langLabel}</span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1, paddingTop: 8 }}>
            <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>{lang === 'zh' ? '你好，' : 'Hi, '}</span>
              <span style={{ color: 'var(--brand-primary)' }}>{lang === 'zh' ? '王阿姨' : 'Margaret'}</span> 👋
            </h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: 16 }}>{t.sub}</p>
          </div>
          <S1TeaTime width={150} height={94}/>
        </div>
        <div style={{ marginTop: 16, position: 'relative' }}>
          <input className="sc-input" placeholder={t.search} style={{ height: 56, fontSize: 17, paddingLeft: 18 }}/>
        </div>
      </div>
      {/* Categories — 5 equal-height 160 cards in 2-col grid, 5th spans full row */}
      <div style={{ padding: '16px 20px 8px' }}>
        <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>{lang === 'zh' ? '选择服务类别' : 'Choose a category'}</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {cats.map((c, i) => {
            const C = c.Char;
            const span = i === 4 ? '1 / -1' : 'auto';
            return (
              <div key={i} style={{ gridColumn: span, height: 160, background: 'var(--bg-base)', color: 'var(--text-primary)', borderRadius: 16, padding: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <C size={96}/>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{c.name}</div>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 4 }}>
                    {lang === 'zh' ? c.price + '/小时起' : 'from ' + c.price + '/h'}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Recent */}
      <div style={{ padding: '12px 20px 80px' }}>
        <h2 style={{ margin: '4px 0 12px', fontSize: 20, fontWeight: 700 }}>{t.recent}</h2>
        <div style={{ background: 'var(--bg-base)', borderRadius: 16, padding: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <C3Helper size={56}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16 }}>{lang === 'zh' ? '美姐 · 清洁' : 'May · Cleaning'}</div>
            <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>⭐ 4.9 · 3km · {cur}55/h</div>
          </div>
          <button className="sc-btn sc-btn-primary" style={{ height: 40, fontSize: 14, padding: '0 14px' }}>{lang === 'zh' ? '再约' : 'Rebook'}</button>
        </div>
      </div>
      {/* AI floating button */}
      <button style={{ position: 'absolute', right: 16, bottom: 16, width: 64, height: 64, borderRadius: 999, background: 'var(--brand-primary)', color: '#fff', border: 'none', boxShadow: '0 8px 24px rgba(31,111,235,0.4)', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0 }}>
        <C9AI size={32}/>
      </button>
    </div>
  );
}

// ── Empty bookings v2 ─────────────────────────
function EmptyBookingsV2({ lang = 'zh' }) {
  const t = T2[lang];
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
      <S3EmptyBookings width={220} height={150}/>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 24, color: 'var(--text-primary)' }}>{t.emptyBookings}</div>
      <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 280 }}>
        {lang === 'zh' ? '李爷爷在等您 — 浏览服务开始第一次预订' : 'Browse services to start your first booking'}
      </div>
      <button className="sc-btn sc-btn-primary" style={{ marginTop: 24, height: 56, padding: '0 28px', fontSize: 17, borderRadius: 12 }}>{t.browse}</button>
    </div>
  );
}

// ── AI chat v2 with C9 avatar that blinks ─────────────────────────
function AIChatV2({ lang = 'zh', emergency = false, empty = false, country = 'AU' }) {
  const t = T2[lang];
  const emNum = country === 'AU' ? '000' : country === 'CN' ? '120' : country === 'UZ' ? '103' : '911';
  const [blink, setBlink] = React.useState(false);
  React.useEffect(() => {
    const id = setInterval(() => { setBlink(true); setTimeout(() => setBlink(false), 200); }, 4000);
    return () => clearInterval(id);
  }, []);
  const [input, setInput] = React.useState('');
  const [msgs, setMsgs] = React.useState(emergency ? [
    { role: 'assistant', text: t.aiHello },
    { role: 'user', text: lang === 'zh' ? '我妈妈胸痛！' : 'My mum has chest pain!' },
  ] : [
    { role: 'assistant', text: t.aiHello },
  ]);

  if (empty) {
    return (
      <div style={{ minHeight: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '60px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <S4EmptyChat width={220} height={160}/>
        <div style={{ fontSize: 22, fontWeight: 700, marginTop: 16 }}>{lang === 'zh' ? '小伴在这里' : 'Hi, I\'m here'}</div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 300 }}>{lang === 'zh' ? '我可以帮您改约、查询价格、紧急联系…' : 'I can reschedule, check prices, get help…'}</div>
        <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {(lang === 'zh' ? ['改下次预订', `帮我打 ${emNum}`, '查看本月账单'] : ['Reschedule', `Call ${emNum} for me`, 'This month bill']).map(s => (
            <button key={s} className="sc-chip" style={{ height: 40 }}>{s}</button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <C9AI size={40} blink={blink}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 17 }}>{lang === 'zh' ? 'AI 小伴' : 'AI Buddy'}</div>
          <div style={{ fontSize: 13, color: 'var(--success)' }}>● {lang === 'zh' ? '在线' : 'Online'}</div>
        </div>
      </div>
      {emergency && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: .9 }}>{t.emergency}</div>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, margin: '6px 0' }}>{emNum}</div>
          <button style={{ marginTop: 12, width: '100%', height: 80, borderRadius: 14, border: 'none', background: '#fff', color: 'var(--danger)', fontSize: 22, fontWeight: 800, cursor: 'pointer' }}>
            📞 {lang === 'zh' ? `一键拨打 ${emNum}` : `Call ${emNum}`}
          </button>
        </div>
      )}
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {msgs.map((m, i) => m.role === 'assistant' ? (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <C9AI size={36} blink={i === msgs.length - 1 && blink}/>
            <div style={{ background: 'var(--bg-surface)', padding: '12px 14px', borderRadius: 16, borderTopLeftRadius: 4, fontSize: 16, maxWidth: '78%' }}>{m.text}</div>
          </div>
        ) : (
          <div key={i} style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{ background: 'var(--brand-primary)', color: '#fff', padding: '12px 14px', borderRadius: 16, borderTopRightRadius: 4, fontSize: 16, maxWidth: '78%' }}>{m.text}</div>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setMsgs([...msgs, { role: 'user', text: input }]); setInput(''); } }} className="sc-input" placeholder={lang === 'zh' ? '说点什么...' : 'Say something...'} style={{ flex: 1, height: 48, fontSize: 16 }}/>
        <button onClick={() => { if (input.trim()) { setMsgs([...msgs, { role: 'user', text: input }]); setInput(''); } }} style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 20, cursor: 'pointer' }}>↑</button>
      </div>
    </div>
  );
}

// ── Payment success v2 ─────────────────────────
function PaymentSuccessV2({ lang = 'zh' }) {
  const t = T2[lang];
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '60px 24px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <S5PaymentSuccess width={280} height={200}/>
      <div style={{ fontSize: 32, fontWeight: 800, marginTop: 24, color: 'var(--success)' }}>{t.paid}</div>
      <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 6 }}>{t.orderNo}</div>
      <div style={{ marginTop: 24, padding: 20, background: 'var(--bg-surface)', borderRadius: 16, width: '100%', maxWidth: 320, textAlign: 'left' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 10 }}>
          <span style={{ color: 'var(--text-secondary)' }}>{lang === 'zh' ? '服务' : 'Service'}</span>
          <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '深度清洁 4h' : 'Deep clean 4h'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, marginBottom: 10 }}>
          <span style={{ color: 'var(--text-secondary)' }}>Provider</span>
          <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '美姐' : 'May Chen'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}>
          <span style={{ fontWeight: 700 }}>{lang === 'zh' ? '已托管' : 'Held in escrow'}</span>
          <span style={{ fontWeight: 800 }}>A$247.50</span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{lang === 'zh' ? '服务完成后释放' : 'Released after service done'}</div>
      </div>
      <button className="sc-btn sc-btn-primary" style={{ marginTop: 24, width: '100%', maxWidth: 320, height: 56 }}>{lang === 'zh' ? '查看预订' : 'View booking'}</button>
    </div>
  );
}

// ── Network error v2 ─────────────────────────
function NetworkErrorV2({ lang = 'zh' }) {
  const t = T2[lang];
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
      <S7Network width={220} height={150}/>
      <div style={{ fontSize: 22, fontWeight: 700, marginTop: 24 }}>{t.noNet}</div>
      <div style={{ fontSize: 15, color: 'var(--text-secondary)', marginTop: 8 }}>{lang === 'zh' ? '请检查 Wi-Fi 或移动网络' : 'Check Wi-Fi or mobile data'}</div>
      <button className="sc-btn sc-btn-primary" style={{ marginTop: 24, height: 56, padding: '0 32px', fontSize: 17 }}>{t.retry}</button>
      <div style={{ marginTop: 16, fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>err.NET-CONN-1003</div>
    </div>
  );
}

// ── Provider home v2 with C3 avatar header + earnings ─────────────────────────
function ProviderHomeV2({ lang = 'zh' }) {
  const t = T2[lang];
  return (
    <div style={{ background: 'var(--bg-surface)', color: 'var(--text-primary)', minHeight: '100%' }}>
      <div style={{ background: 'var(--bg-base)', padding: '20px 20px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <C3Helper size={56}/>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{lang === 'zh' ? '你好，李师傅' : 'Hi, Helen'}</div>
          <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{lang === 'zh' ? '今天 5/2' : 'Today 2 May'}</div>
        </div>
      </div>
      <div style={{ padding: 16 }}>
        {/* Earnings card — light: #EFF6FF + dark text; dark: #1E3A8A + white */}
        <div className="sc-earnings" style={{ borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ position: 'absolute', right: -10, top: -10, opacity: .8 }}><C3Helper size={70}/></div>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '.05em', color: 'var(--earn-label)' }}>{t.weekIncome.toUpperCase()}</div>
          <div style={{ fontSize: 36, fontWeight: 800, marginTop: 4, color: 'var(--earn-text)' }}>A$1,240.00</div>
          <div style={{ display: 'flex', gap: 24, marginTop: 14, fontSize: 14 }}>
            <div><div style={{ color: 'var(--earn-label)' }}>{t.heldFunds}</div><div style={{ fontWeight: 700, fontSize: 18, marginTop: 2, color: 'var(--earn-text)' }}>A$320</div></div>
            <div><div style={{ color: 'var(--earn-label)' }}>{t.received}</div><div style={{ fontWeight: 700, fontSize: 18, marginTop: 2, color: 'var(--earn-text)' }}>A$920</div></div>
          </div>
        </div>
        {/* Today task */}
        <h3 style={{ margin: '20px 0 10px', fontSize: 17, fontWeight: 700 }}>{t.todayTasks}</h3>
        <div style={{ background: 'var(--bg-base)', borderRadius: 14, padding: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>09:00 · {lang === 'zh' ? '王阿姨' : 'Margaret'}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{lang === 'zh' ? '清洁 · Carlton 3km · 2h' : 'Cleaning · Carlton 3km · 2h'}</div>
            </div>
            <span className="sc-badge sc-badge-info">{lang === 'zh' ? '已确认' : 'Confirmed'}</span>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="sc-btn sc-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14 }}>📍 {lang === 'zh' ? '导航' : 'Map'}</button>
            <button className="sc-btn sc-btn-secondary" style={{ flex: 1, height: 44, fontSize: 14 }}>📞 {lang === 'zh' ? '电话' : 'Call'}</button>
          </div>
        </div>
        <button className="sc-btn sc-btn-primary sc-btn-block" style={{ marginTop: 16, height: 56 }}>▶ {t.start}</button>
      </div>
    </div>
  );
}

// ── Loading state ─────────────────────────
function LoadingV2({ lang = 'zh' }) {
  return (
    <div style={{ minHeight: '100%', background: 'var(--bg-base)', color: 'var(--text-primary)', padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <LoadingDots size={120}/>
      <div style={{ marginTop: 24, fontSize: 18, color: 'var(--text-secondary)' }}>{lang === 'zh' ? '稍等一下…' : 'One moment…'}</div>
    </div>
  );
}

Object.assign(window, {
  HomeV2, EmptyBookingsV2, AIChatV2, PaymentSuccessV2, NetworkErrorV2, ProviderHomeV2, LoadingV2, T2,
});
