// Sprint 1 — remaining screens: #10 Provider detail · #12 Booking wizard wrappers ·
// #13 Payment · #14 Success · #15-16 Booking list/detail wrappers · #28 Notif · #29 Chat · Compliance

const SP1_EMERGENCY = {
  AU: { num: '000', label: { zh: '澳洲紧急服务', en: 'Australian Emergency' } },
  CN: { num: '120', label: { zh: '中国 120 医疗急救（火警 119 / 报警 110）', en: 'China 120 Medical (Fire 119 / Police 110)' } },
  CA: { num: '911', label: { zh: '加拿大 911 综合紧急', en: 'Canada 911 Combined Emergency' } },
};

// ════════════════════════════════════════════════════════════════════
// #10 PROVIDER DETAIL — net-new screen
// ════════════════════════════════════════════════════════════════════
function Sp1ProviderDetail({ lang = 'zh', country = 'AU', loading = false, noReviews = false, noSlots = false, offline = false }) {
  const isZh = lang === 'zh';
  const cur = SP1_CUR[country];
  const taxAbbr = country === 'AU' ? 'GST' : country === 'CN' ? 'VAT' : 'HST';

  if (loading) {
    return (
      <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
        <Sp1MobileHeader lang={lang} country={country} back/>
        <div style={{ flex: 1, padding: 20 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <Sp1Skel h={100} w={100} r={50}/>
            <div style={{ flex: 1 }}>
              <Sp1Skel h={26} w="70%"/>
              <Sp1Skel h={16} mt={10} w="50%"/>
              <Sp1Skel h={16} mt={6} w="40%"/>
            </div>
          </div>
          <Sp1Skel h={120} mt={20} r={14}/>
          <Sp1Skel h={20} mt={20} w="40%"/>
          {[0, 1, 2].map(i => <Sp1Skel key={i} h={70} mt={12} r={12}/>)}
          <Sp1Skel h={200} mt={20} r={14}/>
        </div>
      </div>
    );
  }

  const services = isZh
    ? [
        { n: '基础清洁 2 小时', d: '客厅 + 厨房 + 1 卫', p: 110 },
        { n: '深度清洁 3 小时', d: '全屋 + 玻璃 + 油烟机', p: 195 },
        { n: '换季大扫除 4 小时', d: '全屋整理 + 收纳', p: 280 },
      ]
    : [
        { n: 'Basic clean · 2h', d: 'Living + kitchen + 1 bath', p: 110 },
        { n: 'Deep clean · 3h', d: 'Whole home + windows + range', p: 195 },
        { n: 'Seasonal · 4h', d: 'Whole home + organising', p: 280 },
      ];

  // 7-day x 4 slots grid
  const days = isZh ? ['今', '周二', '周三', '周四', '周五', '周六', '周日'] : ['Today', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const slots = ['09:00', '11:00', '14:00', '16:00'];

  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country} back/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px' }}>
        {offline && (
          <div style={{ padding: 14, background: 'var(--warning-soft)', borderRadius: 12, marginBottom: 16, border: '1.5px solid var(--warning)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <IconWarn size={20} style={{ color: '#92590A', flexShrink: 0, marginTop: 2 }}/>
            <div>
              <div style={{ fontWeight: 700, color: '#92590A', fontSize: 16 }}>{isZh ? '该 Provider 暂未上线' : 'This provider is offline'}</div>
              <div style={{ fontSize: 14, color: '#92590A', marginTop: 2 }}>{isZh ? '可收藏并查看最近的可预订时段' : 'You can favourite and view their earliest availability'}</div>
            </div>
          </div>
        )}

        {/* Provider header */}
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          <ProviderAvatar size={100} hue={0} initials={isZh ? '李' : 'HL'}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>{isZh ? '李 师傅 (Helen Li)' : 'Helen Li'}</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
              <IconStar size={18} style={{ color: 'var(--brand-accent)' }}/>
              <span style={{ fontWeight: 700 }}>4.9</span>
              <span style={{ fontSize: 14, color: 'var(--text-tertiary)' }}>(132 {isZh ? '条评价' : 'reviews'})</span>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
              <span className="sc-badge sc-badge-success"><IconShield size={14}/>{isZh ? '已验证' : 'Verified'}</span>
              <span className="sc-badge sc-badge-info">{isZh ? '急救证' : 'First-aid'}</span>
              <span className="sc-badge sc-badge-info">{isZh ? '中文' : 'Mandarin'}</span>
            </div>
          </div>
        </div>

        {/* Bio */}
        <div style={{ marginTop: 16, padding: 14, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            {isZh
              ? '8 年家政经验，细心耐心，擅长老人居家清洁。已通过背景核查与急救认证。'
              : '8 years of home-care experience. Patient, detail-oriented, specialised in elderly homes. Background-checked and first-aid certified.'}
          </div>
        </div>

        {/* Service list */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>{isZh ? '提供的服务' : 'Services offered'}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {services.map((s, i) => (
            <label key={i} style={{
              display: 'flex', gap: 12, alignItems: 'center', padding: 14,
              background: 'var(--bg-base)', borderRadius: 12,
              border: i === 1 ? '2px solid var(--brand-primary)' : '1.5px solid var(--border)',
              cursor: 'pointer', minHeight: 64,
            }}>
              <span style={{
                width: 24, height: 24, borderRadius: 999,
                border: '2px solid ' + (i === 1 ? 'var(--brand-primary)' : 'var(--border-strong)'),
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {i === 1 && <span style={{ width: 12, height: 12, borderRadius: 999, background: 'var(--brand-primary)' }}/>}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{s.n}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{s.d}</div>
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, color: 'var(--brand-primary)', flexShrink: 0 }}>
                {country === 'CN' ? `¥${s.p * 8}` : `${cur}${s.p}`}
              </div>
            </label>
          ))}
        </div>

        {/* 7-day availability */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>{isZh ? '可预订时段（未来 7 天）' : 'Available next 7 days'}</h3>
        {noSlots ? (
          <div style={{ padding: 24, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>{isZh ? '本周已约满' : 'Fully booked this week'}</div>
            <button style={{ marginTop: 12, height: 48, padding: '0 24px', borderRadius: 12, border: '1.5px solid var(--brand-primary)', background: 'transparent', color: 'var(--brand-primary)', fontSize: 15, fontWeight: 700 }}>
              {isZh ? '查看下周' : 'See next week'}
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
            {days.map((d, di) => (
              <div key={di} style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>{d}</div>
                {slots.map((s, si) => {
                  const avail = (di + si) % 3 !== 0;
                  const sel = di === 1 && si === 2;
                  return (
                    <button key={si} disabled={!avail} style={{
                      width: '100%', height: 36, borderRadius: 8,
                      border: sel ? 'none' : '1px solid ' + (avail ? 'var(--border)' : 'transparent'),
                      background: sel ? 'var(--brand-primary)' : avail ? 'var(--bg-base)' : 'var(--bg-surface-2)',
                      color: sel ? '#fff' : avail ? 'var(--text-primary)' : 'var(--text-tertiary)',
                      fontSize: 12, fontWeight: 600,
                      opacity: avail ? 1 : 0.5,
                    }}>{avail ? s : '—'}</button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Reviews */}
        <h3 style={{ fontSize: 18, fontWeight: 700, marginTop: 24, marginBottom: 10 }}>{isZh ? '评价' : 'Reviews'}</h3>
        {noReviews ? (
          <div style={{ padding: 24, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)' }}>{isZh ? '暂无评价' : 'No reviews yet'}</div>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', marginTop: 4 }}>{isZh ? '成为第一个预订并评价的客户' : 'Be the first to book and review'}</div>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', padding: 14, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>4.9</div>
              <div style={{ flex: 1 }}>
                {[5, 4, 3, 2, 1].map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)', width: 12 }}>{n}</span>
                    <IconStar size={12} style={{ color: 'var(--brand-accent)' }}/>
                    <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--bg-surface-2)', overflow: 'hidden' }}>
                      <div style={{ width: [85, 12, 2, 1, 0][5 - n] + '%', height: '100%', background: 'var(--brand-accent)' }}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginTop: 12, padding: 14, background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', gap: 4, color: 'var(--brand-accent)' }}>
                {[1, 2, 3, 4, 5].map(i => <IconStar key={i} size={14}/>)}
              </div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.5 }}>
                {isZh ? '李师傅非常细心，把家里打扫得干干净净，老妈很满意。下次还会再约。' : 'Helen was thorough and kind to my mum. Will book again — she felt very comfortable.'}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 6 }}>{isZh ? '— Sarah W. · 2 周前' : '— Sarah W. · 2 weeks ago'}</div>
            </div>
          </>
        )}
      </div>

      {/* Sticky CTA */}
      <div style={{ padding: 12, background: 'var(--bg-base)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        <button style={{ width: 56, height: 56, borderRadius: 14, border: '1.5px solid var(--border-strong)', background: 'var(--bg-base)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={isZh ? '消息' : 'Message'}>
          <IconChat size={22} style={{ color: 'var(--text-secondary)' }}/>
        </button>
        <button disabled={offline || noSlots} style={{
          flex: 1, height: 56, borderRadius: 14, border: 'none',
          background: (offline || noSlots) ? 'var(--bg-surface-2)' : 'var(--brand-primary)',
          color: (offline || noSlots) ? 'var(--text-tertiary)' : '#fff',
          fontSize: 17, fontWeight: 700,
        }}>
          {offline ? (isZh ? '该服务者暂未上线' : 'Currently offline')
            : noSlots ? (isZh ? '本周无空' : 'Fully booked')
            : (isZh ? `下一步 · ${country === 'CN' ? '¥1,560' : `${cur}195.00`} 含 ${taxAbbr}` : `Continue · ${country === 'CN' ? '¥1,560' : `${cur}195.00`} incl. ${taxAbbr}`)}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #12 BOOKING WIZARD wrappers
// ════════════════════════════════════════════════════════════════════
function Sp1BookingWrap({ lang = 'zh', step = 1, country = 'AU' }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country} back/>
      <Sp1Progress step={step} lang={lang}/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <BookingForm lang={lang} step={step}/>
      </div>
    </div>
  );
}

function Sp1BookingS2State({ lang = 'zh', state = 'loading' }) {
  const isZh = lang === 'zh';
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU" back/>
      <Sp1Progress step={2} lang={lang}/>
      <div style={{ flex: 1, padding: 20, overflow: 'auto' }}>
        {state === 'loading' && (<>
          <Sp1Skel h={26} w="50%"/>
          <Sp1Skel h={48} mt={20} r={12}/>
          <Sp1Skel h={20} mt={20} w="30%"/>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginTop: 12 }}>
            {Array.from({ length: 28 }).map((_, i) => <Sp1Skel key={i} h={36} r={8}/>)}
          </div>
        </>)}
        {state === 'noSlot' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, paddingTop: 40 }}>
            <S3EmptyBookings width={200} height={140}/>
            <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{isZh ? '该日已约满' : 'Fully booked'}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0 }}>{isZh ? '请选择其他日期，或换一位 Provider' : 'Pick another date or another provider'}</p>
            <button style={{ marginTop: 8, height: 56, padding: '0 24px', borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700 }}>
              {isZh ? '看其他时间' : 'See other times'}
            </button>
          </div>
        )}
        {state === 'recurring' && (
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700 }}>{isZh ? '设置循环预订' : 'Set up recurring'}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
              {[isZh ? '每周一次' : 'Weekly', isZh ? '每两周一次' : 'Bi-weekly', isZh ? '每月一次' : 'Monthly'].map((l, i) => (
                <label key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 16, borderRadius: 12, border: i === 0 ? '2px solid var(--brand-primary)' : '1.5px solid var(--border)', background: 'var(--bg-base)', cursor: 'pointer' }}>
                  <span style={{ width: 24, height: 24, borderRadius: 999, border: '2px solid ' + (i === 0 ? 'var(--brand-primary)' : 'var(--border-strong)'), display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {i === 0 && <span style={{ width: 12, height: 12, borderRadius: 999, background: 'var(--brand-primary)' }}/>}
                  </span>
                  <span style={{ fontSize: 17, fontWeight: 600 }}>{l}</span>
                </label>
              ))}
            </div>
            <div style={{ marginTop: 20, padding: 14, background: 'var(--brand-primary-soft)', borderRadius: 12, fontSize: 14, color: 'var(--brand-primary)' }}>
              {isZh ? 'ℹ️ 循环预订享 5% 折扣' : 'ℹ️ Save 5% on recurring bookings'}
            </div>
          </div>
        )}
        {state === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12, paddingTop: 40 }}>
            <S7Network width={200} height={140}/>
            <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '加载失败' : "Couldn't load times"}</h2>
            <button style={{ height: 56, padding: '0 24px', borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700 }}>{isZh ? '重试' : 'Retry'}</button>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #13 PAYMENT — net-new
// ════════════════════════════════════════════════════════════════════
function Sp1Payment({ lang = 'zh', country = 'AU', method = 'card', state = 'default' }) {
  const isZh = lang === 'zh';
  const cur = SP1_CUR[country];
  const taxAbbr = country === 'AU' ? 'GST' : country === 'CN' ? 'VAT' : 'HST';
  const total = country === 'CN' ? '¥1,560.00' : `${cur}195.00`;

  if (state === 'success') {
    return (
      <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
        <Sp1MobileHeader lang={lang} country={country} back/>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: 24, gap: 16 }}>
          <div style={{ width: 96, height: 96, borderRadius: 999, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconCheck size={56} strokeWidth={3}/>
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{isZh ? '支付成功' : 'Payment confirmed'}</h2>
          <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: 0 }}>{isZh ? `已扣款 ${total}` : `Charged ${total}`}</p>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>{isZh ? '正在跳转预订详情…' : 'Redirecting to booking…'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country} back/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 20px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0 }}>{isZh ? '支付方式' : 'Payment'}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: '4px 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <IconLock size={14}/>{isZh ? '由 Stripe 安全处理' : 'Securely processed by Stripe'}
        </p>

        {/* Payment method buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Apple Pay */}
          <button style={{
            height: 56, borderRadius: 14,
            border: method === 'apple' ? '2px solid var(--brand-primary)' : '1.5px solid var(--border)',
            background: '#000', color: '#fff',
            fontSize: 18, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
             {isZh ? '使用 Apple Pay 付款' : 'Pay with Apple Pay'}
          </button>
          {/* Google Pay */}
          <button style={{
            height: 56, borderRadius: 14,
            border: '1.5px solid var(--border)',
            background: 'var(--bg-base)', color: 'var(--text-primary)',
            fontSize: 17, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            G Pay {isZh ? '· Google Pay' : '· Google Pay'}
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
            <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{isZh ? '或刷卡' : 'or card'}</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          </div>
          {/* Card form */}
          <div style={{ padding: 14, borderRadius: 14, border: method === 'card' ? '2px solid var(--brand-primary)' : '1.5px solid var(--border)', background: 'var(--bg-base)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <IconCard size={22} style={{ color: 'var(--brand-primary)' }}/>
              <span style={{ fontSize: 16, fontWeight: 700 }}>{isZh ? '信用卡 / 借记卡' : 'Credit / Debit card'}</span>
            </div>
            <input placeholder={isZh ? '卡号' : 'Card number'} defaultValue="4242 4242 4242 4242" style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-strong)', fontSize: 16, fontFamily: 'monospace', background: 'var(--bg-base)', color: 'var(--text-primary)' }}/>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
              <input placeholder="MM / YY" defaultValue="12 / 28" style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-strong)', fontSize: 16, fontFamily: 'monospace', background: 'var(--bg-base)', color: 'var(--text-primary)' }}/>
              <input placeholder="CVV" defaultValue="123" style={{ height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-strong)', fontSize: 16, fontFamily: 'monospace', background: 'var(--bg-base)', color: 'var(--text-primary)' }}/>
            </div>
            <input placeholder={isZh ? '持卡人姓名' : 'Cardholder name'} defaultValue="MARGARET WANG" style={{ width: '100%', height: 48, padding: '0 14px', borderRadius: 10, border: '1.5px solid var(--border-strong)', fontSize: 16, marginTop: 10, background: 'var(--bg-base)', color: 'var(--text-primary)' }}/>
          </div>
        </div>

        {/* Error / 3DS overlay */}
        {state === 'failed' && (
          <div style={{ marginTop: 14, padding: 14, borderRadius: 12, background: 'var(--danger-soft)', border: '1.5px solid var(--danger)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <IconAlert size={20} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: 2 }}/>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--danger)' }}>{isZh ? '卡片被拒绝' : 'Card declined'}</div>
              <div style={{ fontSize: 14, color: 'var(--danger)', marginTop: 2 }}>{isZh ? '请尝试其他支付方式或联系发卡行' : 'Try another payment method or contact your bank'}</div>
            </div>
          </div>
        )}
        {state === 'threeDS' && (
          <div style={{ marginTop: 14, padding: 16, borderRadius: 12, background: 'var(--brand-primary-soft)', border: '1.5px solid var(--brand-primary)', textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--brand-primary)' }}>{isZh ? '银行验证中…' : '3D Secure verification…'}</div>
            <div style={{ fontSize: 14, color: 'var(--brand-primary)', marginTop: 6 }}>{isZh ? '请在弹出的银行页面完成验证' : 'Complete the prompt from your bank'}</div>
          </div>
        )}

        {/* Tax breakdown */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)' }}>
            <span>{isZh ? '小计' : 'Subtotal'}</span>
            <span>{country === 'CN' ? '¥1,471.70' : `${cur}177.27`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: 'var(--text-secondary)', marginTop: 6 }}>
            <span>{taxAbbr}{country === 'AU' ? ' 10%' : country === 'CN' ? ' 6%' : ' 13%'}</span>
            <span>{country === 'CN' ? '¥88.30' : `${cur}17.73`}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 18, fontWeight: 800, marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
            <span>{isZh ? '合计' : 'Total'}</span>
            <span style={{ color: 'var(--brand-primary)' }}>{total}</span>
          </div>
        </div>
      </div>
      {/* Sticky pay button */}
      <div style={{ padding: 12, background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
        <button disabled={state === 'loading' || state === 'threeDS'} style={{
          width: '100%', height: 56, borderRadius: 14, border: 'none',
          background: state === 'loading' ? 'var(--bg-surface-2)' : 'var(--brand-primary)',
          color: state === 'loading' ? 'var(--text-tertiary)' : '#fff',
          fontSize: 17, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          {state === 'loading' && <span style={{ display: 'inline-block', width: 18, height: 18, borderRadius: 999, border: '2.5px solid currentColor', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }}/>}
          {state === 'loading' ? (isZh ? '处理中…' : 'Processing…')
            : state === 'threeDS' ? (isZh ? '等待银行确认' : 'Waiting for bank')
            : <><IconLock size={18}/>{isZh ? `安全支付 ${total}` : `Pay securely ${total}`}</>}
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #14 SUCCESS — light + dark
// ════════════════════════════════════════════════════════════════════
function Sp1Success({ lang = 'zh', country = 'AU', processing = false }) {
  const isZh = lang === 'zh';
  const cur = SP1_CUR[country];
  const total = country === 'CN' ? '¥1,560.00' : `${cur}195.00`;
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country}/>
      <div style={{ flex: 1, overflow: 'auto', padding: 20, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ marginTop: 10 }}>
          <S5PaymentSuccess width={240} height={170}/>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: '8px 0 0' }}>
          {processing ? (isZh ? '正在确认 Provider…' : 'Confirming with provider…') : (isZh ? '预订成功！' : 'Booking confirmed!')}
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-secondary)', margin: '6px 0 0' }}>
          {processing
            ? (isZh ? '通常 2 分钟内确认' : 'Usually confirmed within 2 minutes')
            : (isZh ? '李师傅 已确认接单' : 'Helen Li has accepted')}
        </p>

        {/* Booking summary card */}
        <div style={{ marginTop: 20, padding: 18, background: 'var(--bg-base)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ProviderAvatar size={48} hue={0} initials={isZh ? '李' : 'HL'}/>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{isZh ? '李 师傅' : 'Helen Li'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{isZh ? '深度清洁 3 小时' : 'Deep clean · 3h'}</div>
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row icon={IconCal} text={isZh ? '5 月 8 日 周三 · 14:00' : 'Wed 8 May · 2:00pm'}/>
            <Row icon={IconPin} text={isZh ? '12 Park Ave, Sydney NSW 2000' : '12 Park Ave, Sydney NSW 2000'}/>
            <Row icon={IconCard} text={isZh ? `已支付 ${total}` : `Paid ${total}`}/>
          </div>
        </div>

        {/* Add to calendar + ICS */}
        <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
          <button style={{ height: 56, borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <IconCal size={20}/>{isZh ? '加入我的日历' : 'Add to calendar'}
          </button>
          <button style={{ height: 56, borderRadius: 14, background: 'var(--bg-base)', color: 'var(--text-primary)', border: '1.5px solid var(--border-strong)', fontSize: 16, fontWeight: 600 }}>
            {isZh ? '下载 .ics 文件' : 'Download .ics file'}
          </button>
          <button style={{ height: 48, background: 'transparent', color: 'var(--brand-primary)', border: 'none', fontSize: 15, fontWeight: 600 }}>
            {isZh ? '查看预订详情' : 'View booking details'} →
          </button>
        </div>
      </div>
    </div>
  );
}
function Row({ icon: I, text }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <I size={18} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}/>
      <span style={{ fontSize: 15, color: 'var(--text-primary)' }}>{text}</span>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #15 BOOKINGS LIST — wrap + states
// ════════════════════════════════════════════════════════════════════
function Sp1BookingsListWrap({ lang = 'zh' }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <BookingsScreen lang={lang}/>
      </div>
      <Sp1Tabs active="bookings" lang={lang}/>
    </div>
  );
}

function Sp1BookingsListState({ lang = 'zh', state }) {
  const isZh = lang === 'zh';
  const tabs = [
    { id: 'upcoming', zh: '即将进行', en: 'Upcoming', n: 0 },
    { id: 'past', zh: '历史', en: 'Past', n: 0 },
    { id: 'recurring', zh: '循环', en: 'Recurring', n: 0 },
  ];
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', background: 'var(--bg-base)' }}>
        {tabs.map(t => {
          const on = state.toLowerCase().includes(t.id);
          return (
            <div key={t.id} style={{ flex: 1, height: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: on ? 700 : 500, color: on ? 'var(--brand-primary)' : 'var(--text-secondary)', borderBottom: on ? '3px solid var(--brand-primary)' : 'none' }}>
              {isZh ? t.zh : t.en}
            </div>
          );
        })}
      </div>
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
        {state === 'loading' && (<div style={{ width: '100%' }}>
          {[0, 1, 2].map(i => <Sp1Skel key={i} h={140} mt={i * 12} r={14}/>)}
        </div>)}
        {state === 'emptyUpcoming' && (<>
          <S3EmptyBookings width={220} height={150}/>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{isZh ? '还没有即将进行的预订' : 'No upcoming bookings'}</h2>
          <button style={{ marginTop: 4, height: 56, padding: '0 28px', borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700 }}>
            {isZh ? '订一次清洁' : 'Book a clean'}
          </button>
        </>)}
        {state === 'emptyHistory' && (<>
          <S3EmptyBookings width={220} height={150}/>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{isZh ? '暂无历史预订' : 'No past bookings'}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-tertiary)', margin: 0 }}>{isZh ? '完成的服务会显示在这里' : 'Completed services will appear here'}</p>
        </>)}
        {state === 'emptyRecurring' && (<>
          <S3EmptyBookings width={220} height={150}/>
          <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{isZh ? '还没有循环预订' : 'No recurring bookings'}</h2>
          <p style={{ fontSize: 14, color: 'var(--text-secondary)', margin: 0 }}>{isZh ? '设置每周清洁可享 5% 折扣' : 'Save 5% with weekly cleans'}</p>
        </>)}
        {state === 'error' && (<>
          <S7Network width={200} height={140}/>
          <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '加载失败' : "Couldn't load"}</h2>
          <button style={{ height: 56, padding: '0 28px', borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700 }}>{isZh ? '重试' : 'Retry'}</button>
        </>)}
      </div>
      <Sp1Tabs active="bookings" lang={lang}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #16 BOOKING DETAIL — wrap + 8 status
// ════════════════════════════════════════════════════════════════════
const SP1_STATUS = {
  pending:           { zh: '等待支付',     en: 'Awaiting payment',     k: 'pending'    },
  confirmed:        { zh: '已确认',       en: 'Confirmed',            k: 'confirmed'  },
  inProgress:       { zh: '进行中',       en: 'In progress',          k: 'in_progress'},
  awaitingConfirm:  { zh: '等待您确认完成', en: 'Awaiting confirmation', k: 'awaiting'   },
  completed:        { zh: '已完成',       en: 'Completed',            k: 'completed'  },
  cancelledFull:    { zh: '已取消 · 全额退款', en: 'Cancelled · Full refund', k: 'cancelled' },
  cancelledPartial: { zh: '已取消 · 部分退款', en: 'Cancelled · Partial refund', k: 'cancelled' },
  refunded:         { zh: '已退款',       en: 'Refunded',             k: 'refunded'   },
};

function Sp1BookingDetailWrap({ lang = 'zh', country = 'AU', status = 'confirmed' }) {
  const isZh = lang === 'zh';
  const s = SP1_STATUS[status];
  const cur = SP1_CUR[country];
  const total = country === 'CN' ? '¥1,560.00' : `${cur}195.00`;
  const ctaPrimary = {
    pending:          isZh ? '立即支付' : 'Pay now',
    confirmed:        isZh ? '改约' : 'Reschedule',
    inProgress:       isZh ? '联系 Provider' : 'Contact provider',
    awaitingConfirm:  isZh ? '确认完成 · 释放押金' : 'Confirm completion',
    completed:        isZh ? '写评价' : 'Leave review',
    cancelledFull:    isZh ? '查看退款详情' : 'See refund details',
    cancelledPartial: isZh ? '查看退款详情' : 'See refund details',
    refunded:         isZh ? '查看退款详情' : 'See refund details',
  }[status];

  // Cancellation policy bar — dynamic
  const cancelBar = status === 'confirmed' ? (
    <div style={{ padding: 12, background: 'var(--brand-primary-soft)', borderRadius: 12, fontSize: 14, color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
      <IconClock size={16}/>{isZh ? '24 小时前免费取消（剩余 47 小时）' : 'Free cancel until 24h before (47h left)'}
    </div>
  ) : status === 'inProgress' || status === 'awaitingConfirm' ? (
    <div style={{ padding: 12, background: 'var(--warning-soft)', borderRadius: 12, fontSize: 14, color: '#92590A' }}>
      {isZh ? '⚠️ 服务进行中，无法取消' : '⚠️ In progress — cannot cancel'}
    </div>
  ) : null;

  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country} back/>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 20px 16px' }}>
        {/* Status badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Sp1Badge kind={s.k}>{isZh ? s.zh : s.en}</Sp1Badge>
          <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>#BK-2024-{1840 + Object.keys(SP1_STATUS).indexOf(status)}</span>
        </div>

        {cancelBar}

        {/* Service summary card */}
        <div style={{ marginTop: 16, padding: 16, background: 'var(--bg-base)', borderRadius: 14, border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ProviderAvatar size={56} hue={0} initials={isZh ? '李' : 'HL'}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{isZh ? '李 师傅 (Helen Li)' : 'Helen Li'}</div>
              <div style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>{isZh ? '深度清洁 · 3 小时' : 'Deep clean · 3h'}</div>
            </div>
          </div>
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Row icon={IconCal} text={isZh ? '5 月 8 日 周三 · 14:00' : 'Wed 8 May · 2:00pm'}/>
            <Row icon={IconPin} text={isZh ? '12 Park Ave, Sydney NSW 2000' : '12 Park Ave, Sydney NSW 2000'}/>
            <Row icon={IconCard} text={total}/>
          </div>
        </div>

        {/* Status timeline */}
        <h3 style={{ fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 10 }}>{isZh ? '状态时间线' : 'Status timeline'}</h3>
        <div style={{ padding: 16, background: 'var(--bg-base)', borderRadius: 14, border: '1px solid var(--border)' }}>
          {[
            { k: 'pending',          zh: '已下单',     en: 'Booked' },
            { k: 'confirmed',        zh: '已确认',     en: 'Confirmed' },
            { k: 'inProgress',       zh: '服务进行中', en: 'In progress' },
            { k: 'completed',        zh: '已完成',     en: 'Completed' },
          ].map((step, i, arr) => {
            const order = ['pending', 'confirmed', 'inProgress', 'awaitingConfirm', 'completed', 'cancelledFull', 'cancelledPartial', 'refunded'];
            const stepIdx = ['pending', 'confirmed', 'inProgress', 'completed'].indexOf(step.k);
            const currentIdx = ({ pending: 0, confirmed: 1, inProgress: 2, awaitingConfirm: 2, completed: 3, cancelledFull: -1, cancelledPartial: -1, refunded: -1 })[status];
            const cancelled = status.startsWith('cancelled') || status === 'refunded';
            const done = !cancelled && currentIdx !== undefined && stepIdx <= currentIdx;
            const cur = !cancelled && stepIdx === currentIdx;
            return (
              <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'center', paddingTop: i ? 10 : 0, paddingBottom: i < arr.length - 1 ? 10 : 0, borderTop: i ? '1px solid var(--border)' : 'none' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 999,
                  background: cancelled ? 'var(--bg-surface-2)' : done ? (cur ? 'var(--brand-primary)' : 'var(--success)') : 'var(--bg-surface-2)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {done ? <IconCheck size={16} strokeWidth={3}/> : <span style={{ width: 8, height: 8, borderRadius: 999, background: cancelled ? 'var(--text-tertiary)' : 'var(--text-tertiary)' }}/>}
                </div>
                <span style={{ fontSize: 15, fontWeight: cur ? 700 : 500, color: cancelled ? 'var(--text-tertiary)' : done ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
                  {isZh ? step.zh : step.en}
                </span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Sticky CTA */}
      <div style={{ padding: 12, background: 'var(--bg-base)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
        {(status === 'confirmed' || status === 'pending') && (
          <button style={{ width: 56, height: 56, borderRadius: 14, border: '1.5px solid var(--danger)', background: 'transparent', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={isZh ? '取消' : 'Cancel'}>
            <IconClose size={22}/>
          </button>
        )}
        <button style={{
          flex: 1, height: 56, borderRadius: 14, border: 'none',
          background: status === 'awaitingConfirm' ? 'var(--success)' : 'var(--brand-primary)',
          color: '#fff', fontSize: 17, fontWeight: 700,
        }}>{ctaPrimary}</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #28 NOTIFICATIONS — wrap + states
// ════════════════════════════════════════════════════════════════════
function Sp1NotifWrap({ lang = 'zh' }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ flex: 1, overflow: 'auto' }}>
        <NotificationsScreen lang={lang}/>
      </div>
      <Sp1Tabs active="messages" lang={lang}/>
    </div>
  );
}

function Sp1NotifState({ lang = 'zh', state }) {
  const isZh = lang === 'zh';
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ height: 56, padding: '0 16px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {(isZh ? ['全部', '预订', 'AI', '系统'] : ['All', 'Bookings', 'AI', 'System']).map((l, i) => (
            <span key={i} style={{ fontSize: 14, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? 'var(--brand-primary)' : 'var(--text-secondary)' }}>{l}</span>
          ))}
        </div>
        <button style={{ background: 'none', border: 'none', fontSize: 13, color: 'var(--brand-primary)', fontWeight: 600 }}>{isZh ? '全部已读' : 'Mark all read'}</button>
      </div>
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
        {state === 'loading' && (<div style={{ width: '100%' }}>{[0, 1, 2, 3].map(i => <Sp1Skel key={i} h={70} mt={i * 8} r={12}/>)}</div>)}
        {state === 'empty' && (<>
          <S4EmptyChat width={200} height={140}/>
          <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '没有通知' : 'No notifications'}</h2>
        </>)}
        {state === 'allRead' && (<>
          <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--success-soft)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconCheck size={48} strokeWidth={3}/></div>
          <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '已全部读完' : 'All caught up'}</h2>
        </>)}
        {state === 'error' && (<>
          <S7Network width={200} height={140}/>
          <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '加载失败' : "Couldn't load"}</h2>
        </>)}
      </div>
      <Sp1Tabs active="messages" lang={lang}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #29 AI CHAT — wrap with theme + state + emergency
// ════════════════════════════════════════════════════════════════════
function Sp1ChatWrap({ lang = 'zh', country = 'AU', state, emergency = false }) {
  const isZh = lang === 'zh';
  const em = SP1_EMERGENCY[country];

  if (emergency) {
    // Full-screen emergency overlay
    return (
      <div className="sc-root" style={{ height: '100%', background: '#0F1729', display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' }}>
        <div style={{ height: 36 }}/>{/* status bar offset */}
        <div style={{ flex: 1, padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, textAlign: 'center' }}>
          <div style={{ width: 120, height: 120, borderRadius: 999, background: 'rgba(220,38,38,0.18)', color: '#FCA5A5', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'sc-pulse 1.5s ease-in-out infinite' }}>
            <IconAlert size={68}/>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, margin: 0, color: '#fff' }}>{isZh ? '需要紧急帮助？' : 'Need emergency help?'}</h1>
          <p style={{ fontSize: 18, color: '#CBD5E1', margin: 0, lineHeight: 1.5 }}>{em.label[lang]}</p>
          <button style={{
            width: '100%', maxWidth: 320, height: 80, borderRadius: 16,
            background: '#DC2626', color: '#fff', border: 'none',
            fontSize: 28, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            boxShadow: '0 8px 24px rgba(220,38,38,0.5)',
          }}>
            <IconPhone size={32}/>{isZh ? `立即拨打 ${em.num}` : `Call ${em.num} now`}
          </button>
          <button style={{ width: '100%', maxWidth: 320, height: 56, borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1.5px solid rgba(255,255,255,0.3)', fontSize: 16, fontWeight: 600 }}>
            {isZh ? '通知紧急联系人 · 女儿 Sarah' : 'Notify emergency contact · Sarah'}
          </button>
          <p style={{ fontSize: 14, color: '#94A3B8', margin: 0 }}>{isZh ? '长按 2 秒返回 AI 聊天' : 'Hold 2s to return to AI chat'}</p>
        </div>
        <style>{`@keyframes sc-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.06); } }`}</style>
      </div>
    );
  }

  // Empty / streaming / waiting / escalated / error states
  if (state) {
    return (
      <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
        <Sp1ChatHeader lang={lang} country={country}/>
        <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: state === 'streaming' || state === 'waiting' ? 'flex-start' : 'center', gap: 12, textAlign: 'center' }}>
          {state === 'empty' && (<>
            <C9AI size={120}/>
            <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{isZh ? '我能帮您什么？' : 'How can I help?'}</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', margin: 0, maxWidth: 280 }}>{isZh ? '试试问：「下次预订是什么时候？」「怎么改约？」' : 'Try: "When is my next booking?" or "How do I reschedule?"'}</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8, width: '100%' }}>
              {(isZh ? ['查看预订', '改约', '取消政策', '联系真人客服'] : ['View bookings', 'Reschedule', 'Cancellation policy', 'Talk to a human']).map((q, i) => (
                <button key={i} style={{ height: 48, borderRadius: 999, border: '1.5px solid var(--brand-primary)', background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', fontSize: 15, fontWeight: 600, padding: '0 16px' }}>{q}</button>
              ))}
            </div>
          </>)}
          {state === 'streaming' && (<div style={{ width: '100%', maxWidth: 320, alignSelf: 'flex-start', textAlign: 'left' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
              <C9AI size={44}/>
              <div style={{ padding: 12, background: 'var(--bg-base)', borderRadius: 16, border: '1px solid var(--border)', maxWidth: 240 }}>
                <span style={{ fontSize: 15 }}>{isZh ? '让我看看您的下次预订…' : 'Let me check your next booking…'}<span className="sc-skel" style={{ display: 'inline-block', width: 8, height: 14, marginLeft: 4, verticalAlign: 'text-bottom' }}/></span>
              </div>
            </div>
          </div>)}
          {state === 'waiting' && (<>
            <div style={{ display: 'flex', gap: 8, alignSelf: 'flex-start', alignItems: 'flex-end' }}>
              <C9AI size={44}/>
              <div style={{ padding: 12, background: 'var(--bg-base)', borderRadius: 16, border: '1px solid var(--border)' }}>
                <span style={{ display: 'inline-flex', gap: 4 }}>
                  {[0, 1, 2].map(i => <span key={i} style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--text-tertiary)', animation: `sc-blink 1.2s ${i * 0.2}s infinite` }}/>)}
                </span>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)', alignSelf: 'flex-start' }}>{isZh ? 'AI 正在输入…' : 'AI is typing…'}</p>
            <style>{`@keyframes sc-blink{0%,100%{opacity:.3}50%{opacity:1}}`}</style>
          </>)}
          {state === 'escalated' && (<>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'var(--brand-primary-soft)', color: 'var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><IconUser size={48}/></div>
            <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '已转接真人客服' : 'Handed off to human'}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{isZh ? 'Mia 通常 5 分钟内回复' : 'Mia usually replies within 5 min'}</p>
          </>)}
          {state === 'error' && (<>
            <S7Network width={200} height={140}/>
            <h2 style={{ fontSize: 21, fontWeight: 700 }}>{isZh ? '连接中断' : 'Connection lost'}</h2>
            <button style={{ height: 56, padding: '0 28px', borderRadius: 14, background: 'var(--brand-primary)', color: '#fff', border: 'none', fontSize: 17, fontWeight: 700 }}>{isZh ? '重新连接' : 'Reconnect'}</button>
          </>)}
        </div>
        <Sp1ChatComposer lang={lang}/>
      </div>
    );
  }

  // Default chat
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1ChatHeader lang={lang} country={country}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '16px 16px 8px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <ChatBubble who="ai" lang={lang} text={isZh ? '您好王阿姨 👋 我是 SilverConnect 助手，需要什么帮助？' : 'Hello Margaret 👋 I\'m the SilverConnect assistant, how can I help?'}/>
        <ChatBubble who="me" lang={lang} text={isZh ? '我下次预订是什么时候？' : 'When is my next booking?'}/>
        <ChatBubble who="ai" lang={lang} text={isZh ? '您下次预订是 5 月 8 日 周三 14:00 — 李师傅来做 3 小时深度清洁。需要改约吗？' : 'Your next booking is Wed 8 May 2:00pm — Helen Li for a 3h deep clean. Want to reschedule?'}/>
        <ChatBubble who="me" lang={lang} text={isZh ? '不用，谢谢' : 'No, thanks'}/>
        <ChatBubble who="ai" lang={lang} text={isZh ? '好的 😊 还有其他问题吗？' : 'Okay 😊 anything else?'}/>
      </div>
      {/* Quick replies */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', overflowX: 'auto' }}>
        {(isZh ? ['改约', '取消政策', '联系真人客服', '紧急帮助'] : ['Reschedule', 'Cancel policy', 'Talk to human', 'Emergency']).map((q, i) => {
          const danger = i === 3;
          return (
            <button key={i} style={{
              flexShrink: 0, height: 40, padding: '0 14px', borderRadius: 999,
              border: '1.5px solid ' + (danger ? 'var(--danger)' : 'var(--brand-primary)'),
              background: danger ? 'var(--danger-soft)' : 'var(--brand-primary-soft)',
              color: danger ? 'var(--danger)' : 'var(--brand-primary)',
              fontSize: 14, fontWeight: 600,
            }}>{danger ? '🆘 ' : ''}{q}</button>
          );
        })}
      </div>
      <Sp1ChatComposer lang={lang}/>
    </div>
  );
}

function Sp1ChatHeader({ lang, country }) {
  const isZh = lang === 'zh';
  return (
    <div style={{ height: 64, padding: '0 12px 0 4px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <button className="sc-iconbtn"><IconBack size={22}/></button>
      <C9AI size={40}/>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 17, fontWeight: 700 }}>{isZh ? 'SilverConnect 助手' : 'SilverConnect Assistant'}</div>
        <div style={{ fontSize: 12, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--success)' }}/>
          {isZh ? '在线 · 通常 30 秒内回复' : 'Online · Usually replies < 30s'}
        </div>
      </div>
      <span className="sc-chip" style={{ height: 36, padding: '0 10px' }}>{SP1_FLAG[country]} {country}</span>
    </div>
  );
}

function Sp1ChatComposer({ lang }) {
  const isZh = lang === 'zh';
  return (
    <div style={{ padding: 10, background: 'var(--bg-base)', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
      <button className="sc-iconbtn" aria-label={isZh ? '附件' : 'Attach'}><IconPlus size={22}/></button>
      <input placeholder={isZh ? '输入消息…' : 'Type a message…'} style={{ flex: 1, height: 48, padding: '0 16px', borderRadius: 24, border: '1.5px solid var(--border)', fontSize: 16, background: 'var(--bg-surface)', color: 'var(--text-primary)' }}/>
      <button className="sc-iconbtn" aria-label={isZh ? '语音' : 'Voice'}><IconMic size={22}/></button>
      <button style={{ width: 48, height: 48, borderRadius: 999, background: 'var(--brand-primary)', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-label={isZh ? '发送' : 'Send'}><IconSend size={22}/></button>
    </div>
  );
}

function ChatBubble({ who, text, lang }) {
  const me = who === 'me';
  return (
    <div style={{ display: 'flex', gap: 8, alignSelf: me ? 'flex-end' : 'flex-start', alignItems: 'flex-end', maxWidth: '85%' }}>
      {!me && <C9AI size={36} style={{ flexShrink: 0 }}/>}
      <div style={{
        padding: '10px 14px',
        background: me ? 'var(--brand-primary)' : 'var(--bg-base)',
        color: me ? '#fff' : 'var(--text-primary)',
        borderRadius: me ? '18px 18px 4px 18px' : '4px 18px 18px 18px',
        border: me ? 'none' : '1px solid var(--border)',
        fontSize: 15, lineHeight: 1.45,
      }}>{text}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// COMPLIANCE
// ════════════════════════════════════════════════════════════════════
function Sp1Compliance({ lang = 'zh' }) {
  const isZh = lang === 'zh';
  const rules = [
    { ok: true, zh: '禁双语并排，每屏独立 EN/ZH 变体', en: 'No bilingual side-by-side; per-locale variants' },
    { ok: true, zh: 'SilverConnect 永不翻译为「银联」', en: 'SilverConnect never translated' },
    { ok: true, zh: 'A$ / ¥ / C$ 货币符号语义对应', en: 'A$ / ¥ / C$ map to AUD / CNY / CAD' },
    { ok: true, zh: '紧急号码硬编码 AU 000 / CN 120 / CA 911', en: 'Emergency hardcoded by country' },
    { ok: true, zh: '深色仅用于 #14 + #29，其他 12 屏不出', en: 'Dark only for #14 + #29' },
  ];
  const a11y = [
    { zh: 'WCAG AAA · 正文 ≥ 7:1', en: 'WCAG AAA body ≥ 7:1' },
    { zh: '触控目标 ≥ 48 × 48', en: 'Touch ≥ 48 × 48' },
    { zh: '正文 18px / 行高 1.6', en: 'Body 18px / line 1.6' },
    { zh: '主按钮 / 输入 56px 高', en: 'Primary / input 56px tall' },
    { zh: '焦点环 2px + 4px 光晕', en: 'Focus ring 2px + 4px halo' },
    { zh: 'Header 64px · Tabbar 84px', en: 'Header 64 · Tabbar 84' },
    { zh: '所有图都有 aria-label / 描述', en: 'All icons aria-labelled' },
    { zh: '错误状态有插画 + 重试按钮', en: 'Errors illustrated + retry CTA' },
    { zh: '加载有骨架屏，避免空白闪烁', en: 'Skeletons avoid empty flicker' },
  ];

  return (
    <div style={{ padding: 56, background: 'var(--bg-base)', height: '100%', overflow: 'auto', color: 'var(--text-primary)' }}>
      <div style={{ fontSize: 14, color: 'var(--brand-primary)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{isZh ? '出稿契约自检' : 'Baseline contract'}</div>
      <h1 style={{ fontSize: 44, margin: '6px 0 28px', fontWeight: 800, letterSpacing: '-0.02em' }}>
        {isZh ? '5 条铁律 + 9 条无障碍' : '5 ship rules + 9 a11y rules'}
      </h1>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>{isZh ? '5 条铁律' : '5 baseline rules'}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {rules.map((r, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, background: 'var(--success-soft)', border: '1px solid var(--success)' }}>
            <div style={{ width: 28, height: 28, borderRadius: 999, background: 'var(--success)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IconCheck size={18} strokeWidth={3}/>
            </div>
            <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)' }}>{isZh ? r.zh : r.en}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 22, fontWeight: 700, marginTop: 32, marginBottom: 12 }}>{isZh ? '9 条无障碍 / 适老化' : '9 accessibility / silver-tech rules'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
        {a11y.map((r, i) => (
          <div key={i} style={{ padding: 14, borderRadius: 12, background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 12, color: 'var(--brand-primary)', fontWeight: 700, marginBottom: 4 }}>0{i + 1}</div>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{isZh ? r.zh : r.en}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, {
  SP1_EMERGENCY,
  Sp1ProviderDetail,
  Sp1BookingWrap, Sp1BookingS2State,
  Sp1Payment,
  Sp1Success,
  Sp1BookingsListWrap, Sp1BookingsListState,
  Sp1BookingDetailWrap, SP1_STATUS,
  Sp1NotifWrap, Sp1NotifState,
  Sp1ChatWrap,
  Sp1Compliance,
});
