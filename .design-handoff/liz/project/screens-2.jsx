// Screens — Part 2: Services list, Bookings list, Booking detail, Notifications

function ServicesScreen({ lang = 'zh', desktop = false }) {
  const t = T[lang];
  const [filters, setFilters] = React.useState({ rating: true, dist: false, lang: true });
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      <div style={{ padding: '16px 20px 8px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="sc-row" style={{ gap: 8 }}>
          <button className="sc-iconbtn" aria-label="返回"><IconBack size={24} /></button>
          <div style={{ flex: 1 }}>
            <h1 className="sc-h2" style={{ margin: 0, fontSize: 24, color: "rgb(246, 241, 241)" }}>{lang === 'zh' ? '清洁服务' : 'Cleaning'}</h1>
            <div className="sc-tiny" style={{ marginTop: 2 }}>{lang === 'zh' ? '澳洲 · 价格区间 A$45–80/小时（含 GST）' : 'AU · A$45–80/hr (incl. GST)'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 14, overflowX: 'auto', paddingBottom: 4 }} className="sc-noscroll">
          <button className={`sc-chip ${filters.rating ? 'sc-chip-active' : ''}`} onClick={() => setFilters((f) => ({ ...f, rating: !f.rating }))}>
            <IconStar size={14} /> {lang === 'zh' ? '评分 4.5+' : 'Rating 4.5+'}
          </button>
          <button className={`sc-chip ${filters.dist ? 'sc-chip-active' : ''}`} onClick={() => setFilters((f) => ({ ...f, dist: !f.dist }))}>
            <IconPin size={14} /> {lang === 'zh' ? '5km 内' : 'Within 5km'}
          </button>
          <button className={`sc-chip ${filters.lang ? 'sc-chip-active' : ''}`} onClick={() => setFilters((f) => ({ ...f, lang: !f.lang }))}>
            🗣 {lang === 'zh' ? '说中文' : 'Mandarin'}
          </button>
          <button className="sc-chip">
            {lang === 'zh' ? '更多' : 'More'} <IconChevDown size={14} />
          </button>
        </div>
      </div>

      <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ProviderCard hue={0} initials={lang === 'zh' ? '李' : 'HL'} name={lang === 'zh' ? '李 师傅' : 'Helen Li'} lang={lang} rating={4.9} reviews={132} dist="3.0" price="55" />
        <ProviderCard hue={1} initials={lang === 'zh' ? '陈' : 'MC'} name={lang === 'zh' ? '陈 阿姨' : 'May Chen'} lang={lang} rating={4.8} reviews={89} dist="4.2" price="48" />
        <ProviderCard hue={2} initials={lang === 'zh' ? '王' : 'TW'} name={lang === 'zh' ? '王 师傅' : 'Tom Wang'} lang={lang} rating={5.0} reviews={210} dist="1.5" price="70" />
        <ProviderCard hue={3} initials={lang === 'zh' ? '林' : 'JL'} name={lang === 'zh' ? '林 阿姨' : 'Jane Lin'} lang={lang} rating={4.7} reviews={56} dist="2.8" price="52" />
      </div>
      <AIFab lang={lang} style={{ position: 'absolute', right: 20, bottom: 100 }} />
    </div>);

}

// ═══════════ My Bookings ═══════════
function BookingsScreen({ lang = 'zh' }) {
  const [tab, setTab] = React.useState('upcoming');
  const t = T[lang];
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      <div style={{ padding: '20px 20px 0', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <h1 className="sc-h2" style={{ margin: '0 0 14px' }}>{lang === 'zh' ? '我的预订' : 'My Bookings'}</h1>
        <div style={{ display: 'flex', gap: 0, borderBottom: '0' }}>
          {[
          ['upcoming', t.upcoming], ['history', t.history], ['recurring', t.recurring]].
          map(([id, label]) =>
          <button key={id} onClick={() => setTab(id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '14px 0', marginRight: 24, fontSize: 18, fontWeight: 600,
            color: tab === id ? 'var(--brand-primary)' : 'var(--text-secondary)',
            borderBottom: tab === id ? '3px solid var(--brand-primary)' : '3px solid transparent',
            fontFamily: 'inherit'
          }}>
              {label}
            </button>
          )}
        </div>
      </div>
      <div style={{ padding: '16px 20px 100px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <BookingCard lang={lang} status="confirmed" date={lang === 'zh' ? '5月 8 周三' : 'Wed 8 May'} time="14:00"
        provider={lang === 'zh' ? '李 师傅' : 'Helen Li'} svc={lang === 'zh' ? '4 小时深度清洁' : '4-hr deep clean'} amount="220.00" hue={0} />
        <BookingCard lang={lang} status="pending" date={lang === 'zh' ? '5月 12 周日' : 'Sun 12 May'} time="09:00"
        provider={lang === 'zh' ? '陈 阿姨' : 'May Chen'} svc={lang === 'zh' ? '2 小时基础清洁' : '2-hr basic clean'} amount="96.00" hue={1} />
        <BookingCard lang={lang} status="inprogress" date={lang === 'zh' ? '今天' : 'Today'} time="10:30"
        provider={lang === 'zh' ? '王 师傅' : 'Tom Wang'} svc={lang === 'zh' ? '园艺修整' : 'Garden trim'} amount="140.00" hue={2} />
      </div>
    </div>);

}

function BookingCard({ status, date, time, provider, svc, amount, hue, lang }) {
  const statusInfo = {
    pending: { cls: 'sc-badge-warning', label: lang === 'zh' ? '待支付' : 'Pending' },
    confirmed: { cls: 'sc-badge-info', label: lang === 'zh' ? '已确认' : 'Confirmed' },
    inprogress: { cls: 'sc-badge-success', label: lang === 'zh' ? '进行中' : 'In progress' },
    done: { cls: 'sc-badge-neutral', label: lang === 'zh' ? '已完成' : 'Done' }
  }[status];
  return (
    <div className="sc-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div style={{ fontSize: 24, fontWeight: 700 }}>{date} · {time}</div>
        <span className={`sc-badge ${statusInfo.cls}`}>{statusInfo.label}</span>
      </div>
      <div className="sc-row" style={{ marginTop: 14, gap: 12 }}>
        <ProviderAvatar size={48} hue={hue} initials={provider[0]} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{provider}</div>
          <div className="sc-small" style={{ marginTop: 2 }}>{svc}</div>
        </div>
        <div className="sc-pricetag">A${amount}</div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
        <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flex: 1 }}>{lang === 'zh' ? '改约' : 'Reschedule'}</button>
        <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flex: 1 }}>
          <IconChat size={18} /> {lang === 'zh' ? '联系' : 'Message'}
        </button>
        {status === 'pending' && <button className="sc-btn sc-btn-primary sc-btn-sm" style={{ flex: 1.2 }}>{lang === 'zh' ? '去支付' : 'Pay'}</button>}
      </div>
    </div>);

}

// ═══════════ Booking Detail ═══════════
function BookingDetailScreen({ lang = 'zh' }) {
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)' }}>
        <div className="sc-row">
          <button className="sc-iconbtn"><IconBack size={24} /></button>
          <div style={{ flex: 1, fontSize: 20, fontWeight: 700, textAlign: 'center', paddingRight: 48 }}>{lang === 'zh' ? '预订详情' : 'Booking detail'}</div>
        </div>
        <div style={{ marginTop: 12, padding: '14px 16px', background: 'var(--brand-primary-soft)', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 24, fontWeight: 800, color: 'var(--brand-primary)' }}>{lang === 'zh' ? '已确认' : 'Confirmed'}</span>
          <span className="sc-small" style={{ color: 'var(--brand-primary)', marginLeft: 'auto' }}>{lang === 'zh' ? '托管中' : 'Held'}</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 0 }}>
          {['paid', 'confirmed', 'inprogress', 'pending', 'done'].map((s, i) => {
            const labels = lang === 'zh' ?
            ['待支付', '已确认', '进行中', '待确认', '已完成'] :
            ['Paid', 'Confirmed', 'Going', 'Verify', 'Done'];
            const cls = i < 1 ? 'done' : i === 1 ? 'active' : '';
            return (
              <React.Fragment key={s}>
                <div className={`sc-flow-step ${cls}`}>
                  <div className="sc-flow-dot">{i < 1 ? <IconCheck size={16} /> : i + 1}</div>
                  <div className="sc-flow-label">{labels[i]}</div>
                </div>
                {i < 4 && <div className={`sc-flow-line ${i < 1 ? 'done' : ''}`} />}
              </React.Fragment>);

          })}
        </div>
      </div>

      <div style={{ padding: '16px 20px 120px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="sc-card">
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{lang === 'zh' ? '服务' : 'Service'}</div>
          <div style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>{lang === 'zh' ? '4 小时深度清洁' : '4-hr deep clean'}</div>
          <div className="sc-small" style={{ marginTop: 4 }}>{lang === 'zh' ? '5月 8 周三 · 14:00–18:00' : 'Wed 8 May · 14:00–18:00'}</div>
          <div className="sc-row" style={{ marginTop: 14, gap: 12 }}>
            <ProviderAvatar size={56} hue={0} initials={lang === 'zh' ? '李' : 'HL'} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{lang === 'zh' ? '李 师傅' : 'Helen Li'}</div>
              <div className="sc-row" style={{ gap: 4, marginTop: 2 }}>
                <IconStar size={14} style={{ color: 'var(--brand-accent)' }} />
                <span className="sc-small">4.9 · 132 {lang === 'zh' ? '评价' : 'reviews'}</span>
              </div>
            </div>
            <IconChev size={24} style={{ color: 'var(--text-tertiary)' }} />
          </div>
        </div>

        <div className="sc-card">
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{lang === 'zh' ? '地址' : 'Address'}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginTop: 6 }}>{lang === 'zh' ? '12 Lygon St, Carlton VIC 3053' : '12 Lygon St, Carlton VIC 3053'}</div>
          <div className="sc-small" style={{ marginTop: 4 }}>{lang === 'zh' ? '到 Provider 约 3.0km · 12 分钟车程' : '3.0km · ~12 min drive'}</div>
          <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ marginTop: 12 }}>
            <IconNav size={18} /> {lang === 'zh' ? '打开地图' : 'Open map'}
          </button>
        </div>

        <div className="sc-card">
          <div style={{ fontSize: 14, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{lang === 'zh' ? '价格明细' : 'Price'}</div>
          {[
          [lang === 'zh' ? '服务费 4小时 × A$55' : 'Service 4h × A$55', 'A$220.00'],
          [lang === 'zh' ? '平台费' : 'Platform fee', 'A$5.00'],
          [lang === 'zh' ? 'GST (10%)' : 'GST (10%)', 'A$22.50']].
          map(([k, v]) =>
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 16 }}>
              <span style={{ color: 'var(--text-secondary)' }}>{k}</span>
              <span style={{ fontWeight: 600 }}>{v}</span>
            </div>
          )}
          <div className="sc-divider" style={{ margin: '14px 0' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{lang === 'zh' ? '总计（含税）' : 'Total (incl. tax)'}</span>
            <span style={{ fontSize: 26, fontWeight: 800 }}>A$247.50</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="sc-btn sc-btn-secondary" style={{ flex: 1 }}>{lang === 'zh' ? '改约' : 'Reschedule'}</button>
          <button className="sc-btn sc-btn-primary" style={{ flex: 1 }}>
            <IconChat size={20} /> {lang === 'zh' ? '联系师傅' : 'Message'}
          </button>
        </div>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 16, padding: 12, fontFamily: 'inherit', textAlign: 'center' }}>
          {lang === 'zh' ? '我有问题 →' : 'I have a problem →'}
        </button>
      </div>
    </div>);

}

// ═══════════ Notifications ═══════════
function NotificationsScreen({ lang = 'zh' }) {
  const items = lang === 'zh' ? [
  { icon: IconCheck, color: '#16A34A', soft: '#DCFCE7', title: '李师傅 接受了您的预订', body: '5月 8 周三 14:00 清洁服务', time: '10 分钟前', unread: true },
  { icon: IconCard, color: '#1F6FEB', soft: '#E8F0FE', title: '支付成功', body: 'A$247.50 已托管，服务完成后释放', time: '12 分钟前', unread: true },
  { icon: IconBell, color: '#F59E0B', soft: '#FEF3C7', title: '请评价 周三的清洁服务', body: '完成后请打分以释放托管款项', time: '昨天', unread: false },
  { icon: IconShield, color: '#7C3AED', soft: '#EDE9FE', title: '紧急联系人已更新', body: '已添加 王女士 (女儿)', time: '3天前', unread: false }] :
  [
  { icon: IconCheck, color: '#16A34A', soft: '#DCFCE7', title: 'Helen accepted your booking', body: 'Wed 8 May 14:00 cleaning', time: '10 min ago', unread: true },
  { icon: IconCard, color: '#1F6FEB', soft: '#E8F0FE', title: 'Payment received', body: 'A$247.50 held until service done', time: '12 min ago', unread: true }];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="sc-iconbtn"><IconBack size={24} /></button>
        <h1 className="sc-h2" style={{ margin: 0, fontSize: 24, flex: 1 }}>{lang === 'zh' ? '通知' : 'Notifications'}</h1>
        <button className="sc-iconbtn"><IconSettings size={24} /></button>
      </div>
      <div style={{ display: 'flex', gap: 8, padding: '12px 20px', overflowX: 'auto' }} className="sc-noscroll">
        {(lang === 'zh' ? ['全部', '预订', '支付', '系统'] : ['All', 'Bookings', 'Payments', 'System']).map((tag, i) =>
        <button key={tag} className={`sc-chip ${i === 0 ? 'sc-chip-active' : ''}`}>{tag}</button>
        )}
      </div>
      <div style={{ padding: '0 0 100px' }}>
        {items.map((it, i) => {
          const I = it.icon;
          return (
            <div key={i} style={{ padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start', borderBottom: '1px solid var(--border)', background: it.unread ? 'var(--brand-primary-soft)' : 'var(--bg-base)', minHeight: 80 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: it.soft, color: it.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <I size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.3 }}>{it.title}</div>
                  {it.unread && <div style={{ width: 10, height: 10, borderRadius: 999, background: 'var(--danger)', flexShrink: 0, marginTop: 4 }} />}
                </div>
                <div className="sc-small" style={{ marginTop: 4, lineHeight: 1.4 }}>{it.body}</div>
                <div className="sc-tiny" style={{ marginTop: 6 }}>{it.time}</div>
              </div>
            </div>);

        })}
      </div>
    </div>);

}

Object.assign(window, { ServicesScreen, BookingsScreen, BookingCard, BookingDetailScreen, NotificationsScreen });