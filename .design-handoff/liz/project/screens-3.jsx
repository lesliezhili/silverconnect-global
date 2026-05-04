// Screens — Part 3: BookingForm 4-step flow + AI Chat + Emergency

function BookingForm({ lang = 'zh', step: initialStep = 2 }) {
  const [step, setStep] = React.useState(initialStep);
  const [pkg, setPkg] = React.useState(1);
  const [day, setDay] = React.useState(8);
  const [slot, setSlot] = React.useState('14:00');
  const [recur, setRecur] = React.useState('once');
  const [addr, setAddr] = React.useState(0);
  const [pay, setPay] = React.useState('apple');

  const stepLabels = lang === 'zh' ? ['服务', '时间', '地址', '确认'] : ['Service', 'Time', 'Address', 'Confirm'];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Top header */}
      <div style={{ padding: '12px 20px 8px', borderBottom: '1px solid var(--border)' }}>
        <div className="sc-row">
          <button className="sc-iconbtn" onClick={() => step > 1 ? setStep(step - 1) : null}><IconBack size={24}/></button>
          <div style={{ flex: 1, fontSize: 18, fontWeight: 700, textAlign: 'center', paddingRight: 48 }}>{lang === 'zh' ? '预订服务' : 'Book service'}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 16 }}>
          {stepLabels.map((label, i) => {
            const idx = i + 1;
            const done = idx < step;
            const active = idx === step;
            return (
              <React.Fragment key={label}>
                <div className={`sc-flow-step ${done ? 'done' : ''} ${active ? 'active' : ''}`} style={{ flex: 1 }}>
                  <div className="sc-flow-dot">{done ? <IconCheck size={16}/> : idx}</div>
                  <div className="sc-flow-label">{label}</div>
                </div>
                {i < 3 && <div className={`sc-flow-line ${done ? 'done' : ''}`}/>}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 120px' }} className="sc-noscroll">
        {step === 1 && <Step1 lang={lang} pkg={pkg} setPkg={setPkg}/>}
        {step === 2 && <Step2 lang={lang} day={day} setDay={setDay} slot={slot} setSlot={setSlot} recur={recur} setRecur={setRecur}/>}
        {step === 3 && <Step3 lang={lang} addr={addr} setAddr={setAddr}/>}
        {step === 4 && <Step4 lang={lang} pay={pay} setPay={setPay}/>}
      </div>

      {/* Sticky footer */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px 24px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
        {step === 4 ? (
          <button className="sc-btn sc-btn-primary sc-btn-block sc-btn-lg">
            {lang === 'zh' ? '确认并支付 A$247.50' : 'Confirm & pay A$247.50'}
          </button>
        ) : (
          <button className="sc-btn sc-btn-primary sc-btn-block sc-btn-lg" onClick={() => setStep(Math.min(4, step + 1))}>
            {lang === 'zh' ? '下一步' : 'Next'} →
          </button>
        )}
      </div>
    </div>
  );
}

function Step1({ lang, pkg, setPkg }) {
  const opts = lang === 'zh' ? [
    { name: '2 小时基础清洁', desc: '吸尘 · 拖地 · 卫生间', price: 110, hours: 2 },
    { name: '4 小时深度清洁', desc: '基础 + 厨房深度 + 窗户', price: 220, hours: 4 },
    { name: '全屋整理收纳', desc: '6 小时 · 含整理咨询', price: 330, hours: 6 },
  ] : [
    { name: '2-hr basic clean', desc: 'Vacuum · mop · bathroom', price: 110, hours: 2 },
    { name: '4-hr deep clean', desc: 'Basic + kitchen + windows', price: 220, hours: 4 },
    { name: '6-hr full tidy', desc: 'Full home + organising', price: 330, hours: 6 },
  ];
  return (
    <div>
      <h2 className="sc-h3" style={{ margin: '0 0 14px' }}>{lang === 'zh' ? '选个服务包' : 'Choose a package'}</h2>
      <div className="sc-stack" style={{ gap: 12 }}>
        {opts.map((o, i) => (
          <button key={i} onClick={() => setPkg(i)} style={{
            border: pkg === i ? '2.5px solid var(--brand-primary)' : '1.5px solid var(--border)',
            background: pkg === i ? 'var(--brand-primary-soft)' : 'var(--bg-base)',
            borderRadius: 18, padding: 18, textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit',
          }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, border: '2px solid var(--border-strong)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: pkg === i ? 'var(--brand-primary)' : 'transparent', borderColor: pkg === i ? 'var(--brand-primary)' : 'var(--border-strong)', flexShrink: 0 }}>
              {pkg === i && <div style={{ width: 12, height: 12, borderRadius: 999, background: '#fff' }}/>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 19, fontWeight: 700 }}>{o.name}</div>
              <div className="sc-small" style={{ marginTop: 4 }}>{o.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="sc-pricetag">A${o.price}</div>
              <div className="sc-tiny">{lang === 'zh' ? '含 GST' : 'incl. GST'}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function Step2({ lang, day, setDay, slot, setSlot, recur, setRecur }) {
  const slots = ['9:00', '11:00', '14:00', '16:00'];
  const recurOpts = lang === 'zh' ? ['单次', '每周', '每两周', '每月'] : ['Once', 'Weekly', 'Bi-weekly', 'Monthly'];
  const days = lang === 'zh' ? ['日', '一', '二', '三', '四', '五', '六'] : ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return (
    <div>
      <h2 className="sc-h3" style={{ margin: '0 0 12px' }}>{lang === 'zh' ? '选个时间' : 'Pick a time'}</h2>

      {/* Recurrence */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, padding: 4, background: 'var(--bg-surface)', borderRadius: 14, marginBottom: 18 }}>
        {recurOpts.map((r, i) => {
          const id = ['once', 'weekly', 'biweekly', 'monthly'][i];
          return (
            <button key={r} onClick={() => setRecur(id)} style={{
              padding: '12px 6px', borderRadius: 10, border: 'none',
              background: recur === id ? 'var(--bg-base)' : 'transparent',
              color: recur === id ? 'var(--brand-primary)' : 'var(--text-secondary)',
              fontWeight: recur === id ? 700 : 500, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: recur === id ? 'var(--shadow-card)' : 'none',
            }}>{r}</button>
          );
        })}
      </div>

      {/* Calendar */}
      <div className="sc-card" style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <button className="sc-iconbtn" style={{ width: 36, height: 36 }}><IconBack size={20}/></button>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{lang === 'zh' ? '5月 2026' : 'May 2026'}</div>
          <button className="sc-iconbtn" style={{ width: 36, height: 36 }}><IconChev size={20}/></button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
          {days.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-tertiary)', fontWeight: 600, paddingBottom: 8 }}>{d}</div>
          ))}
          {[...Array(35)].map((_, i) => {
            const dnum = i - 4; // start offset
            const isCurrent = dnum >= 1 && dnum <= 31;
            const past = dnum < 6;
            const unavailable = [10, 13, 17, 24].includes(dnum);
            const selected = dnum === day;
            const enabled = isCurrent && !past && !unavailable;
            return (
              <button key={i} onClick={() => enabled && setDay(dnum)} disabled={!enabled}
                style={{
                  aspectRatio: '1', borderRadius: 10, border: 'none', cursor: enabled ? 'pointer' : 'default',
                  background: selected ? 'var(--brand-primary)' : enabled ? 'var(--success-soft)' : 'transparent',
                  color: selected ? '#fff' : !isCurrent ? 'transparent' : past || unavailable ? 'var(--text-tertiary)' : 'var(--success)',
                  fontWeight: selected ? 700 : 600, fontSize: 16, fontFamily: 'inherit',
                  textDecoration: unavailable && isCurrent ? 'line-through' : 'none',
                  opacity: past ? 0.4 : 1,
                }}>
                {isCurrent ? dnum : ''}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? `${day} 日可预约时段` : `Slots for ${day} May`}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {slots.map(s => (
          <button key={s} onClick={() => setSlot(s)} style={{
            height: 80, borderRadius: 14, border: slot === s ? '2.5px solid var(--brand-primary)' : '1.5px solid var(--border)',
            background: slot === s ? 'var(--brand-primary)' : 'var(--bg-base)',
            color: slot === s ? '#fff' : 'var(--text-primary)',
            fontSize: 24, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          }}>
            <IconClock size={20} style={{ opacity: 0.7, marginBottom: 2 }}/>
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}

function Step3({ lang, addr, setAddr }) {
  const items = lang === 'zh' ? [
    { label: '家', addr: '12 Lygon St, Carlton VIC 3053', dist: '3.0km · 12 分钟' },
    { label: '女儿家', addr: '88 Spring St, Melbourne VIC 3000', dist: '5.5km · 18 分钟' },
  ] : [
    { label: 'Home', addr: '12 Lygon St, Carlton VIC 3053', dist: '3.0km · 12 min' },
    { label: "Daughter's", addr: '88 Spring St, Melbourne VIC 3000', dist: '5.5km · 18 min' },
  ];
  return (
    <div>
      <h2 className="sc-h3" style={{ margin: '0 0 14px' }}>{lang === 'zh' ? '选个地址' : 'Choose address'}</h2>
      <div className="sc-stack" style={{ gap: 12 }}>
        {items.map((it, i) => (
          <button key={i} onClick={() => setAddr(i)} style={{
            border: addr === i ? '2.5px solid var(--brand-primary)' : '1.5px solid var(--border)',
            background: addr === i ? 'var(--brand-primary-soft)' : 'var(--bg-base)',
            borderRadius: 16, padding: 16, textAlign: 'left', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit', minHeight: 80,
          }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand-primary)', flexShrink: 0 }}>
              <IconPin size={24}/>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{it.label}</div>
              <div className="sc-small" style={{ marginTop: 2 }}>{it.addr}</div>
              <div className="sc-tiny" style={{ marginTop: 4 }}>{it.dist}</div>
            </div>
          </button>
        ))}
        <button className="sc-btn sc-btn-secondary sc-btn-block">
          <IconPlus size={20}/> {lang === 'zh' ? '新增地址' : 'Add address'}
        </button>
      </div>
    </div>
  );
}

function Step4({ lang, pay, setPay }) {
  const pays = [
    { id: 'apple', label: 'Apple Pay', sub: '••• Visa 4242', icon: '' },
    { id: 'google', label: 'Google Pay', sub: lang === 'zh' ? '快速支付' : 'Quick checkout', icon: 'G' },
    { id: 'card', label: lang === 'zh' ? '信用卡 ••8801' : 'Card ••8801', sub: 'Visa · 12/27', icon: 'V' },
  ];
  return (
    <div>
      <h2 className="sc-h3" style={{ margin: '0 0 14px' }}>{lang === 'zh' ? '确认并支付' : 'Confirm & pay'}</h2>

      {/* Summary */}
      <div className="sc-card" style={{ padding: 18 }}>
        <div className="sc-row" style={{ gap: 12 }}>
          <ProviderAvatar size={48} hue={0} initials={lang === 'zh' ? '李' : 'HL'}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 17, fontWeight: 700 }}>{lang === 'zh' ? '李 师傅 · 4 小时深度清洁' : 'Helen Li · 4-hr deep clean'}</div>
            <div className="sc-small" style={{ marginTop: 2 }}>{lang === 'zh' ? '5月 8 周三 · 14:00–18:00' : 'Wed 8 May · 14:00–18:00'}</div>
          </div>
        </div>
        <div className="sc-divider" style={{ margin: '14px 0' }}/>
        {[
          [lang === 'zh' ? '服务费 4h × A$55' : 'Service 4h × A$55', 'A$220.00'],
          [lang === 'zh' ? '平台费' : 'Platform', 'A$5.00'],
          [lang === 'zh' ? 'GST 10%' : 'GST 10%', 'A$22.50'],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span className="sc-small">{k}</span>
            <span style={{ fontSize: 16, fontWeight: 600 }}>{v}</span>
          </div>
        ))}
        <div className="sc-divider" style={{ margin: '14px 0' }}/>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span style={{ fontSize: 18, fontWeight: 700 }}>{lang === 'zh' ? '总计（含 GST）' : 'Total'}</span>
          <span style={{ fontSize: 26, fontWeight: 800 }}>A$247.50</span>
        </div>
      </div>

      {/* Cancel policy */}
      <div style={{ marginTop: 14, padding: 14, background: 'var(--brand-accent-soft)', borderRadius: 14, display: 'flex', gap: 12 }}>
        <IconShield size={24} style={{ color: 'var(--brand-accent)', flexShrink: 0, marginTop: 2 }}/>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-accent)' }}>{lang === 'zh' ? '取消政策' : 'Cancellation'}</div>
          <div className="sc-small" style={{ marginTop: 2, color: 'var(--brand-accent)' }}>{lang === 'zh' ? '距开始 > 24 小时取消可全额退款' : 'Free cancel up to 24h before start'}</div>
        </div>
      </div>

      <h3 className="sc-h3" style={{ margin: '20px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '支付方式' : 'Payment'}</h3>
      <div className="sc-stack" style={{ gap: 10 }}>
        {pays.map(p => (
          <button key={p.id} onClick={() => setPay(p.id)} style={{
            border: pay === p.id ? '2.5px solid var(--brand-primary)' : '1.5px solid var(--border)',
            background: pay === p.id ? 'var(--brand-primary-soft)' : 'var(--bg-base)',
            borderRadius: 14, padding: '14px 16px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, fontFamily: 'inherit',
          }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--text-primary)', color: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 16 }}>
              {p.id === 'apple' ? '' : p.icon}
            </div>
            <div style={{ flex: 1, textAlign: 'left' }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{p.label}</div>
              <div className="sc-small">{p.sub}</div>
            </div>
            {pay === p.id && <IconCheck size={24} style={{ color: 'var(--brand-primary)' }}/>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ═══════════ AI Chat ═══════════
function AIChat({ lang = 'zh', emergency = false }) {
  const [msgs, setMsgs] = React.useState(() => emergency ? [
    { role: 'ai', text: lang === 'zh' ? '您好王阿姨，需要什么帮助？' : 'Hi Margaret, how can I help?' },
    { role: 'user', text: lang === 'zh' ? '我老伴突然胸痛，怎么办' : 'My husband has sudden chest pain' },
  ] : [
    { role: 'ai', text: lang === 'zh' ? '您好王阿姨，需要什么帮助？' : 'Hi Margaret, how can I help?' },
    { role: 'user', text: lang === 'zh' ? '我想改下周三的预订' : 'I want to reschedule Wednesday' },
    { role: 'ai', text: lang === 'zh' ? '找到了：周三 14:00 清洁。想改到几点？' : 'Found: Wed 14:00 cleaning. New time?', suggestions: ['10:00', '16:00', lang === 'zh' ? '其他' : 'Other'] },
  ]);
  const [input, setInput] = React.useState('');

  return (
    <div style={{ background: 'var(--bg-base)', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12, background: emergency ? 'var(--danger)' : 'var(--bg-base)', color: emergency ? '#fff' : 'var(--text-primary)' }}>
        <div style={{ width: 44, height: 44, borderRadius: 999, background: emergency ? 'rgba(255,255,255,0.2)' : 'var(--brand-primary-soft)', color: emergency ? '#fff' : 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {emergency ? <IconAlert size={24}/> : <IconAI size={24}/>}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>{emergency ? (lang === 'zh' ? '紧急模式' : 'Emergency') : (lang === 'zh' ? 'AI 助手' : 'AI helper')}</div>
          <div style={{ fontSize: 13, opacity: 0.8 }}>{emergency ? (lang === 'zh' ? '已检测到紧急关键词' : 'Emergency detected') : (lang === 'zh' ? '24 小时在线' : '24/7 online')}</div>
        </div>
        <button className="sc-iconbtn" style={{ color: 'inherit' }} aria-label="关闭"><IconClose size={24}/></button>
      </div>

      {/* Emergency banner */}
      {emergency && (
        <div style={{ background: 'var(--danger)', color: '#fff', padding: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: 14, fontWeight: 600, opacity: 0.9, letterSpacing: '0.05em' }}>{lang === 'zh' ? '请立即拨打' : 'CALL NOW'}</div>
          <div style={{ fontSize: 56, fontWeight: 900, lineHeight: 1, margin: '6px 0' }}>000</div>
          <div style={{ fontSize: 14, opacity: 0.9 }}>{lang === 'zh' ? '澳洲紧急电话' : 'Australia emergency'}</div>
          <button style={{ marginTop: 16, width: '100%', height: 80, borderRadius: 16, border: 'none', background: '#fff', color: 'var(--danger)', fontSize: 26, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, fontFamily: 'inherit' }}>
            <IconPhone size={28}/> {lang === 'zh' ? '一键拨打 000' : 'Call 000 now'}
          </button>
          <button style={{ marginTop: 10, width: '100%', height: 56, borderRadius: 14, border: '2px solid rgba(255,255,255,0.5)', background: 'transparent', color: '#fff', fontSize: 16, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            {lang === 'zh' ? '同时通知紧急联系人（女儿 王女士）' : 'Notify emergency contact'}
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }} className="sc-noscroll">
        {msgs.map((m, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexDirection: m.role === 'user' ? 'row-reverse' : 'row' }}>
            {m.role === 'ai' && (
              <div style={{ width: 32, height: 32, borderRadius: 999, background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <IconAI size={18}/>
              </div>
            )}
            <div style={{ maxWidth: '78%' }}>
              <div style={{
                padding: '12px 16px', borderRadius: 18,
                borderBottomRightRadius: m.role === 'user' ? 4 : 18,
                borderBottomLeftRadius: m.role === 'ai' ? 4 : 18,
                background: m.role === 'user' ? 'var(--brand-primary)' : 'var(--bg-surface)',
                color: m.role === 'user' ? '#fff' : 'var(--text-primary)',
                fontSize: 17, lineHeight: 1.5,
              }}>{m.text}</div>
              {m.suggestions && (
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  {m.suggestions.map(s => (
                    <button key={s} onClick={() => setMsgs(prev => [...prev, { role: 'user', text: s }, { role: 'ai', text: lang === 'zh' ? `好的，已申请改到 ${s}，等师傅确认。` : `OK, requested ${s}, awaiting confirmation.` }])} className="sc-chip sc-chip-warm" style={{ height: 44, fontSize: 16, fontWeight: 600 }}>{s}</button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div style={{ padding: '12px 16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && input.trim()) { setMsgs(prev => [...prev, { role: 'user', text: input }]); setInput(''); }}}
          className="sc-input" placeholder={lang === 'zh' ? '说点什么...' : 'Say something...'} style={{ flex: 1, height: 52 }}/>
        <button className="sc-iconbtn" style={{ width: 52, height: 52, background: 'var(--bg-surface)', borderRadius: 14 }}><IconMic size={24}/></button>
        <button onClick={() => { if (input.trim()) { setMsgs(prev => [...prev, { role: 'user', text: input }]); setInput(''); }}} style={{ width: 52, height: 52, borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <IconSend size={24}/>
        </button>
      </div>
    </div>
  );
}

Object.assign(window, { BookingForm, AIChat });
