// Sprint 1 extras — screen wrappers + missing screens (#10, #13) + state composites + emergency overlay
// Builds on: screens-1.jsx (HomeScreen, ProviderCard), screens-2.jsx (ServicesScreen, BookingsScreen,
// BookingDetailScreen, NotificationsScreen), screens-3.jsx (BookingForm, AIChat),
// illustrations.jsx (S1/S3/S4/S5/S6/S7/C3/C6/C9), sprint1-shell.jsx (Sp1Phone, Sp1Tabs, Sp1AIFab, Sp1Progress, Sp1Badge, Sp1Skel, fmt, SP1_T, SP1_FLAG)

// ════════════════════════════════════════════════════════════════════
// COVER
// ════════════════════════════════════════════════════════════════════
function Sp1Cover({ lang = 'zh', country = 'AU' }) {
  const isZh = lang === 'zh';
  const screens = [
    { n: '#7',  zh: '客户首页',         en: 'Home' },
    { n: '#8',  zh: '服务大类',         en: 'Services' },
    { n: '#9',  zh: 'Provider 列表',    en: 'Providers' },
    { n: '#10', zh: 'Provider 详情',    en: 'Provider detail' },
    { n: '#12', zh: '预订向导 4 步',    en: 'Booking wizard ×4' },
    { n: '#13', zh: '支付页',           en: 'Payment' },
    { n: '#14', zh: '支付成功 ⚡深色',  en: 'Success ⚡dark' },
    { n: '#15', zh: '我的预订',         en: 'My bookings' },
    { n: '#16', zh: '预订详情',         en: 'Booking detail' },
    { n: '#28', zh: '通知中心',         en: 'Notifications' },
    { n: '#29', zh: 'AI 聊天 ⚡深色 + 紧急', en: 'AI chat ⚡dark + emergency' },
  ];
  return (
    <div style={{ padding: 56, height: '100%', overflow: 'auto', background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 14, color: 'var(--brand-primary)', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sprint 1 · Customer Golden Path</div>
          <h1 style={{ fontSize: 56, margin: '8px 0 0', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            {isZh ? '14 屏 · 客户黄金路径' : '14 screens · the customer golden path'}
          </h1>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 360 }}>
          <span className="sc-badge sc-badge-info">{isZh ? '60+ 老人' : 'Age 60+'}</span>
          <span className="sc-badge sc-badge-info">AU · CN · CA</span>
          <span className="sc-badge sc-badge-success">WCAG AAA</span>
          <span className="sc-badge sc-badge-warning">Body 18px / Touch 48px</span>
        </div>
      </div>
      <p style={{ fontSize: 19, color: 'var(--text-secondary)', marginTop: 8, maxWidth: 920, lineHeight: 1.6 }}>
        {isZh
          ? '每屏交付独立 EN + ZH 浅色变体 · 不允许双语并排 · SilverConnect 永不翻译 · A$/¥/C$ 语义对应澳元/人民币/加元 · 紧急号码按当前 Header 国家自动渲染（不让用户选）。仅 #14 支付成功 与 #29 AI 聊天 出深色变体；其余 12 屏不出。'
          : 'Each screen ships independent EN + ZH light variants — no side-by-side bilingual labels. SilverConnect never translates. Currency symbols A$ / ¥ / C$ map to AUD / CNY / CAD. Emergency numbers auto-resolve from Header country (000 / 120 / 911) — not user-pickable. Dark only for #14 success and #29 chat.'}
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginTop: 28 }}>
        {[
          { k: isZh ? '触控目标' : 'Touch', v: '≥ 48 × 48' },
          { k: isZh ? '主按钮 / 输入' : 'Primary / Input', v: '56px' },
          { k: isZh ? '正文 / 行高' : 'Body / Line', v: '18px / 1.6' },
          { k: isZh ? '焦点环' : 'Focus ring', v: '2px + 4px halo' },
        ].map(s => (
          <div key={s.k} style={{ padding: 18, background: 'var(--bg-surface)', borderRadius: 14, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 13, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.k}</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 26, marginTop: 40, marginBottom: 12, fontWeight: 700 }}>{isZh ? '出稿清单' : 'Deliverables'}</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {screens.map(s => (
          <div key={s.n} style={{ padding: 16, background: 'var(--bg-surface)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 14, fontFamily: 'monospace', color: 'var(--brand-primary)', fontWeight: 700, flexShrink: 0 }}>{s.n}</span>
            <span style={{ fontSize: 17, fontWeight: 600 }}>{isZh ? s.zh : s.en}</span>
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 26, marginTop: 36, marginBottom: 12, fontWeight: 700 }}>{isZh ? '5 条出稿铁律' : '5 baseline rules'}</h2>
      <ol style={{ fontSize: 17, lineHeight: 1.8, paddingLeft: 22, color: 'var(--text-secondary)' }}>
        <li>{isZh ? '禁双语并排，每屏独立 EN/ZH 变体' : 'No bilingual side-by-side, EN and ZH ship as independent variants'}</li>
        <li>{isZh ? 'SilverConnect 永不翻译（曾误译为「银联」）' : 'SilverConnect never translates (was once mistranslated as UnionPay)'}</li>
        <li>{isZh ? 'A$ = AUD · ¥ = CNY · C$ = CAD · 中文不替换为「澳元/元/加元」' : 'A$ = AUD · ¥ = CNY · C$ = CAD · symbol stays Latin in zh'}</li>
        <li>{isZh ? '紧急号码硬编码 AU 000 / CN 120 (火警 119 / 报警 110) / CA 911' : 'Emergency hardcoded AU 000 / CN 120 (Fire 119 / Police 110) / CA 911'}</li>
        <li>{isZh ? '浅色为主稿；仅 #14 + #29 必出深色' : 'Light is primary; dark only for #14 + #29'}</li>
      </ol>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// DESKTOP PAIR — desktop frame, two locales side by side
// ════════════════════════════════════════════════════════════════════
function Sp1DesktopPair({ render, country = 'AU', label }) {
  return (
    <div style={{ display: 'flex', gap: 24, padding: 24, background: '#F1F5F9', minHeight: '100%' }}>
      {[
        { lang: 'en', tag: 'EN' },
        { lang: 'zh', tag: 'ZH' },
      ].map(({ lang, tag }) => (
        <div key={lang} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#475569', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {label} · {tag} · Desktop
          </div>
          <Sp1Desktop>{render({ lang, country })}</Sp1Desktop>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #7 HOME — wrapper around HomeScreen with §2.1 Header + §2.2 Tabs + AIFab + S1 hero badge
// ════════════════════════════════════════════════════════════════════
function Sp1HomeWrap({ lang, country }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country}/>
      <div style={{ flex: 1, overflow: 'hidden', position: 'relative' }}>
        <Sp1HomeBody lang={lang} country={country}/>
        <Sp1AIFab lang={lang}/>
      </div>
      <Sp1Tabs active="home" lang={lang}/>
    </div>
  );
}

// Custom home body — meets brief: 5 cards (4 in 2-col + 1 full), recently booked, recommended
function Sp1HomeBody({ lang, country }) {
  const isZh = lang === 'zh';
  const t = SP1_T[lang];
  const cur = SP1_CUR[country];
  const cats = isZh
    ? [
        { z: '清洁', p: '55', icon: IconClean, color: '#1F6FEB', soft: '#E8F0FE' },
        { z: '烹饪', p: '40', icon: IconCook, color: '#F59E0B', soft: '#FEF3C7' },
        { z: '园艺', p: '50', icon: IconGarden, color: '#16A34A', soft: '#DCFCE7' },
        { z: '个人护理', p: '70', icon: IconCare, color: '#DB2777', soft: '#FCE7F3' },
        { z: '维修', p: '60', icon: IconRepair, color: '#7C3AED', soft: '#EDE9FE' },
      ]
    : [
        { z: 'Cleaning', p: '55', icon: IconClean, color: '#1F6FEB', soft: '#E8F0FE' },
        { z: 'Cooking', p: '40', icon: IconCook, color: '#F59E0B', soft: '#FEF3C7' },
        { z: 'Garden', p: '50', icon: IconGarden, color: '#16A34A', soft: '#DCFCE7' },
        { z: 'Personal care', p: '70', icon: IconCare, color: '#DB2777', soft: '#FCE7F3' },
        { z: 'Repair', p: '60', icon: IconRepair, color: '#7C3AED', soft: '#EDE9FE' },
      ];
  const priceFmt = country === 'CN'
    ? (isZh ? `¥${(parseInt(cats[0].p)*8)}/小时起` : `from ¥${parseInt(cats[0].p)*8}/h`)
    : null; // not used; per-card

  return (
    <div style={{ overflow: 'auto', height: '100%', paddingBottom: 100 }}>
      {/* Hero with S1 illustration */}
      <div style={{ padding: '20px 20px 4px', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: 30, lineHeight: 1.2, margin: 0, fontWeight: 800, color: 'var(--text-primary)' }}>
            {isZh ? 'Margaret 你好 👋' : 'Hello, Margaret 👋'}
          </h1>
          <p style={{ fontSize: 17, color: 'var(--text-secondary)', margin: '6px 0 0', lineHeight: 1.5 }}>
            {isZh ? '今天需要什么帮助？' : 'What do you need help with today?'}
          </p>
        </div>
        <div style={{ flexShrink: 0, marginTop: -8 }}>
          <S1TeaTime width={140} height={100}/>
        </div>
      </div>

      {/* Search 56h */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ position: 'relative' }}>
          <IconSearch size={22} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}/>
          <input
            placeholder={isZh ? '🔍 搜索服务或地址' : '🔍 Search services or address'}
            style={{
              width: '100%', height: 56, paddingLeft: 48, paddingRight: 16,
              fontSize: 17, borderRadius: 12, border: '1.5px solid var(--border-strong)',
              background: 'var(--bg-base)', color: 'var(--text-primary)',
            }}
          />
        </div>
      </div>

      {/* H2 + 5-card grid (2 cols × 2 + full row) */}
      <div style={{ padding: '4px 20px 0' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '12px 0', color: 'var(--text-primary)' }}>
          {isZh ? '选择服务类别' : 'Choose a service'}
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {cats.slice(0, 4).map((c, i) => {
            const I = c.icon;
            const priceLine = country === 'CN'
              ? (isZh ? `¥${parseInt(c.p)*8}/小时起` : `from ¥${parseInt(c.p)*8}/h`)
              : (isZh ? `${cur}${c.p}/小时起` : `from ${cur}${c.p}/h`);
            return (
              <div key={i} style={{
                background: 'var(--bg-base)', borderRadius: 16, padding: 14,
                border: '1px solid var(--border)', height: 160,
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
              }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: c.soft, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <I size={32}/>
                </div>
                <div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{c.z}</div>
                  <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>{priceLine}</div>
                </div>
              </div>
            );
          })}
          {/* 5th full row */}
          <div style={{
            gridColumn: '1 / -1', background: 'var(--bg-base)', borderRadius: 16, padding: 14,
            border: '1px solid var(--border)', height: 160,
            display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: cats[4].soft, color: cats[4].color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <IconRepair size={32}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{cats[4].z}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
                {country === 'CN'
                  ? (isZh ? `¥${parseInt(cats[4].p)*8}/小时起` : `from ¥${parseInt(cats[4].p)*8}/h`)
                  : (isZh ? `${cur}${cats[4].p}/小时起` : `from ${cur}${cats[4].p}/h`)}
              </div>
            </div>
            <IconChev size={24} style={{ color: 'var(--text-tertiary)' }}/>
          </div>
        </div>
      </div>

      {/* Recently booked */}
      <div style={{ padding: '20px 0 8px 20px' }}>
        <div style={{ paddingRight: 20 }}>
          <h2 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>{isZh ? '我最近订过' : 'Recently booked'}</h2>
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 12, overflowX: 'auto', paddingRight: 20 }}>
          {[
            { name: isZh ? '李 师傅' : 'Mr Li', svc: isZh ? '清洁' : 'Cleaning', init: isZh ? '李' : 'L', hue: 0 },
            { name: isZh ? '陈 阿姨' : 'May Chen', svc: isZh ? '清洁' : 'Cleaning', init: isZh ? '陈' : 'M', hue: 1 },
          ].map((p, i) => (
            <div key={i} style={{ minWidth: 240, height: 120, background: 'var(--bg-base)', borderRadius: 14, padding: 14, border: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <ProviderAvatar size={64} hue={p.hue} initials={p.init}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>{p.svc}</div>
                <button style={{ marginTop: 8, padding: '4px 10px', borderRadius: 8, border: '1.5px solid var(--brand-primary)', background: 'transparent', color: 'var(--brand-primary)', fontSize: 13, fontWeight: 600 }}>{isZh ? '再订一次' : 'Book again'}</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended */}
      <div style={{ padding: '12px 20px 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: '8px 0 12px' }}>{isZh ? '推荐 Provider' : 'Recommended providers'}</h2>
        <ProviderCard hue={3} initials={isZh ? '林' : 'JL'} name={isZh ? '林 阿姨' : 'Jane Lin'} cur={cur} lang={lang} rating={4.9} reviews={132} dist="2.1" price={cats[0].p} compact/>
      </div>
    </div>
  );
}

function Sp1HomeDesktop({ lang, country }) {
  return (
    <div className="sc-root" style={{ height: '100%', overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1DesktopHeader lang={lang} country={country} currentRoute="home"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
          <Sp1HomeBody lang={lang} country={country}/>
        </div>
      </div>
    </div>
  );
}

function Sp1HomeLoading({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ flex: 1, padding: 20, overflow: 'hidden' }}>
        <Sp1Skel h={32} w="60%"/>
        <Sp1Skel h={18} w="80%" mt={10}/>
        <Sp1Skel h={56} mt={20} r={12}/>
        <Sp1Skel h={22} w="40%" mt={24}/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 12 }}>
          {[0, 1, 2, 3].map(i => <Sp1Skel key={i} h={160} r={16}/>)}
          <div style={{ gridColumn: '1 / -1' }}><Sp1Skel h={160} r={16}/></div>
        </div>
        <Sp1Skel h={20} w="40%" mt={24}/>
        <Sp1Skel h={120} mt={12} r={14}/>
      </div>
      <Sp1Tabs active="home" lang={lang}/>
    </div>
  );
}

function Sp1HomeEmpty({ lang, country }) {
  // First-time user: hide "recently booked", change subtitle
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px' }}>
        <h1 style={{ fontSize: 28, lineHeight: 1.2, margin: 0, fontWeight: 800 }}>
          {lang === 'zh' ? 'Margaret 你好 👋' : 'Hello, Margaret 👋'}
        </h1>
        <p style={{ fontSize: 17, color: 'var(--brand-primary)', margin: '8px 0 0', lineHeight: 1.5, fontWeight: 600 }}>
          {lang === 'zh' ? '欢迎使用 SilverConnect，先订一次试试 →' : 'Welcome — book your first service →'}
        </p>
        <div style={{ marginTop: 20, padding: 16, background: 'var(--bg-base)', borderRadius: 14, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
          <S1TeaTime width={120} height={80}/>
          <div style={{ flex: 1, fontSize: 14, color: 'var(--text-secondary)' }}>{lang === 'zh' ? '从喝茶到洗衣，SilverConnect 都可以帮您安排上门服务。' : 'From tea time to laundry — SilverConnect can arrange a helper to come over.'}</div>
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginTop: 24 }}>{lang === 'zh' ? '选择服务类别' : 'Choose a service'}</h2>
        <p style={{ fontSize: 15, color: 'var(--text-tertiary)', margin: '4px 0 12px' }}>{lang === 'zh' ? '· 没有最近订过的记录' : '· No recent bookings yet'}</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { z: '清洁', e: 'Cleaning' },
            { z: '烹饪', e: 'Cooking' },
            { z: '园艺', e: 'Garden' },
            { z: '个人护理', e: 'Personal care' },
          ].map((c, i) => (
            <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 14, padding: 14, border: '1px solid var(--border)', height: 100 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'zh' ? c.z : c.e}</div>
            </div>
          ))}
        </div>
      </div>
      <Sp1Tabs active="home" lang={lang}/>
    </div>
  );
}

function Sp1HomeError({ lang, country }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country}/>
      <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 12 }}>
        <S7Network width={200} height={140}/>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{lang === 'zh' ? '加载服务时出错，请重试' : "Couldn't load services. Try again"}</h2>
        <button style={{ marginTop: 12, height: 56, padding: '0 32px', borderRadius: 14, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 17, fontWeight: 700 }}>
          {lang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
      <Sp1Tabs active="home" lang={lang}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #8 SERVICES
// ════════════════════════════════════════════════════════════════════
const SP1_TAX_LINE = {
  AU: { zh: '所有价格已含 GST', en: 'All prices include GST' },
  CN: { zh: '所有价格已含 VAT', en: 'All prices include VAT' },
  CA: { zh: '所有价格已含 HST', en: 'All prices include HST' },
};

function Sp1ServicesWrap({ lang, country }) {
  const cats = lang === 'zh'
    ? [
        { z: '清洁', d: '常规清洁、深度清洁、全屋整理', range: '45–80', C: C3Helper },
        { z: '烹饪', d: '三餐准备、营养餐、份饭备餐', range: '40–70', C: C4Cook },
        { z: '园艺', d: '修剪、浇水、季节整理', range: '50–90', C: C5Gardener },
        { z: '个人护理', d: '沐浴、协助、陪伴', range: '70–120', C: C6Nurse },
        { z: '维修', d: '小家电、灯具、漏水', range: '60–110', C: C7Fixer },
      ]
    : [
        { z: 'Cleaning', d: 'Regular, deep, whole-home tidy', range: '45–80', C: C3Helper },
        { z: 'Cooking', d: 'Daily meals, nutritionist menus, batch cook', range: '40–70', C: C4Cook },
        { z: 'Garden', d: 'Mowing, watering, seasonal tidy', range: '50–90', C: C5Gardener },
        { z: 'Personal care', d: 'Bathing, mobility help, companionship', range: '70–120', C: C6Nurse },
        { z: 'Repair', d: 'Small appliance, lights, leaks', range: '60–110', C: C7Fixer },
      ];
  const cur = SP1_CUR[country];
  const tax = SP1_TAX_LINE[country][lang];
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country}/>
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 20px 100px' }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>{lang === 'zh' ? '选择服务类别' : 'Choose a service'}</h1>
        <div style={{ marginTop: 16, height: 48, padding: '0 16px', borderRadius: 12, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, color: 'var(--text-secondary)' }}>
          <span>ℹ️</span><span>{tax}</span>
        </div>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cats.map((c, i) => {
            const Ch = c.C;
            return (
              <div key={i} style={{ height: 200, padding: 16, borderRadius: 16, background: 'var(--bg-base)', border: '1px solid var(--border)', display: 'flex', gap: 16, alignItems: 'center', cursor: 'pointer' }}>
                <div style={{ flexShrink: 0 }}><Ch size={120}/></div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 22, fontWeight: 700 }}>{c.z}</div>
                  <div style={{ fontSize: 16, color: 'var(--text-secondary)', marginTop: 6, lineHeight: 1.4 }}>{c.d}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--brand-primary)', marginTop: 10 }}>
                    {country === 'CN'
                      ? (lang === 'zh' ? `¥${parseInt(c.range.split('–')[0])*8}–${parseInt(c.range.split('–')[1])*8}/小时` : `from ¥${parseInt(c.range.split('–')[0])*8}/h`)
                      : (lang === 'zh' ? `${cur}${c.range}/小时` : `${cur}${c.range}/h`)}
                  </div>
                </div>
                <IconChev size={24} style={{ color: 'var(--text-tertiary)', flexShrink: 0 }}/>
              </div>
            );
          })}
        </div>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

function Sp1ServicesDesktop({ lang, country }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1DesktopHeader lang={lang} country={country} currentRoute="services"/>
      <div style={{ flex: 1, overflow: 'auto', padding: '32px 0' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 20px' }}>
          <Sp1ServicesWrap lang={lang} country={country}/>
        </div>
      </div>
    </div>
  );
}

function Sp1ServicesLoading({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ flex: 1, padding: 20 }}>
        <Sp1Skel h={32} w="50%"/>
        <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[0, 1, 2, 3, 4].map(i => <Sp1Skel key={i} h={200} r={16}/>)}
        </div>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

function Sp1ServicesError({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU"/>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
        <S7Network width={200} height={140}/>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{lang === 'zh' ? '无法加载服务列表' : "Couldn't load services"}</h2>
        <button style={{ height: 56, padding: '0 32px', borderRadius: 14, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 17, fontWeight: 700 }}>
          {lang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// #9 PROVIDER LIST
// ════════════════════════════════════════════════════════════════════
function Sp1ProvidersWrap({ lang, country, filtered = false }) {
  const isZh = lang === 'zh';
  const cur = SP1_CUR[country];
  const taxAbbr = country === 'AU' ? 'GST' : country === 'CN' ? 'VAT' : 'HST';
  const filters = isZh
    ? [{ k: 'r', l: '评分 4.5+' }, { k: 'd', l: '距离 5km' }, { k: 'l', l: '中文' }, { k: 'w', l: '周末可用' }, { k: 'f', l: '女性服务者' }, { k: 'a', l: '急救资质' }]
    : [{ k: 'r', l: 'Rating 4.5+' }, { k: 'd', l: 'Within 5km' }, { k: 'l', l: 'Mandarin' }, { k: 'w', l: 'Weekends' }, { k: 'f', l: 'Female' }, { k: 'a', l: 'First-aid' }];
  const selected = filtered ? new Set(['r', 'd', 'l']) : new Set();

  const provs = [
    { name: isZh ? '李 师傅' : 'Helen Li',  init: isZh ? '李' : 'HL', rating: 4.9, reviews: 132, dist: '2.1', price: '55', hue: 0 },
    { name: isZh ? '陈 阿姨' : 'May Chen',   init: isZh ? '陈' : 'MC', rating: 4.8, reviews: 98,  dist: '3.5', price: '60', hue: 1 },
    { name: isZh ? '王 师傅' : 'Tom Wang',   init: isZh ? '王' : 'TW', rating: 5.0, reviews: 215, dist: '4.2', price: '65', hue: 2 },
    { name: isZh ? '林 阿姨' : 'Jane Lin',   init: isZh ? '林' : 'JL', rating: 4.7, reviews: 67,  dist: '4.8', price: '52', hue: 3 },
  ];

  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country={country} back/>
      <div style={{ flex: 1, overflow: 'auto', padding: '12px 20px 100px', position: 'relative' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{isZh ? `清洁服务（${country}）` : `Cleaning (${country})`}</h2>
        <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>
          {country === 'CN'
            ? (isZh ? `¥360–640/小时（含 ${taxAbbr}）` : `¥360–640/h (incl. ${taxAbbr})`)
            : (isZh ? `${cur}45–80/小时（含 ${taxAbbr}）` : `${cur}45–80/h (incl. ${taxAbbr})`)}
        </div>
        {/* Filter chips horizontal scroll */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {filters.map(f => {
            const on = selected.has(f.k);
            return (
              <button key={f.k} style={{
                flexShrink: 0, height: 48, padding: '0 16px', borderRadius: 999,
                border: on ? 'none' : '1.5px solid var(--border-strong)',
                background: on ? 'var(--brand-primary)' : 'var(--bg-base)',
                color: on ? '#fff' : 'var(--text-primary)',
                fontSize: 15, fontWeight: 600,
              }}>{f.l}</button>
            );
          })}
          <button style={{ flexShrink: 0, height: 48, padding: '0 14px', borderRadius: 999, border: '1.5px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 15, fontWeight: 600 }}>
            {isZh ? '排序：推荐 ▾' : 'Sort: Recommended ▾'}
          </button>
        </div>
        {/* Provider cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {provs.map((p, i) => (
            <ProviderCard key={i} hue={p.hue} initials={p.init} name={p.name} cur={cur} lang={lang} rating={p.rating} reviews={p.reviews} dist={p.dist} price={p.price}/>
          ))}
        </div>
        {filtered && (
          <button style={{ position: 'absolute', bottom: 16, right: 16, width: 56, height: 56, borderRadius: 999, background: 'var(--danger)', color: '#fff', border: 'none', fontSize: 24 }}>✖</button>
        )}
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

function Sp1ProvidersLoading({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU" back/>
      <div style={{ flex: 1, padding: 20 }}>
        <Sp1Skel h={26} w="50%"/>
        <Sp1Skel h={14} w="40%" mt={8}/>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          {[0, 1, 2, 3].map(i => <Sp1Skel key={i} h={48} w={80} r={999}/>)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 16 }}>
          {[0, 1, 2, 3].map(i => <Sp1Skel key={i} h={200} r={16}/>)}
        </div>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

function Sp1ProvidersEmpty({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU" back/>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, textAlign: 'center' }}>
        <S3EmptyBookings width={220} height={150}/>
        <h2 style={{ fontSize: 21, fontWeight: 700, margin: 0 }}>{lang === 'zh' ? '没找到符合条件的服务者' : 'No providers match your filters'}</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', marginTop: 12 }}>
          <button style={{ height: 56, borderRadius: 14, border: '1.5px solid var(--border-strong)', background: 'var(--bg-base)', color: 'var(--text-primary)', fontSize: 17, fontWeight: 600 }}>
            {lang === 'zh' ? '调整筛选条件' : 'Adjust filters'}
          </button>
          <button style={{ height: 56, borderRadius: 14, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 17, fontWeight: 700 }}>
            {lang === 'zh' ? '清除筛选' : 'Clear filters'}
          </button>
        </div>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

function Sp1ProvidersError({ lang }) {
  return (
    <div className="sc-root" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'var(--bg-surface)' }}>
      <Sp1MobileHeader lang={lang} country="AU" back/>
      <div style={{ flex: 1, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <S7Network width={200} height={140}/>
        <h2 style={{ fontSize: 21, fontWeight: 700 }}>{lang === 'zh' ? '加载失败' : "Couldn't load"}</h2>
        <button style={{ height: 56, padding: '0 32px', borderRadius: 14, border: 'none', background: 'var(--brand-primary)', color: '#fff', fontSize: 17, fontWeight: 700 }}>
          {lang === 'zh' ? '重试' : 'Retry'}
        </button>
      </div>
      <Sp1Tabs active="services" lang={lang}/>
    </div>
  );
}

Object.assign(window, {
  Sp1Cover, Sp1DesktopPair,
  Sp1HomeWrap, Sp1HomeBody, Sp1HomeDesktop, Sp1HomeLoading, Sp1HomeEmpty, Sp1HomeError,
  Sp1ServicesWrap, Sp1ServicesDesktop, Sp1ServicesLoading, Sp1ServicesError,
  Sp1ProvidersWrap, Sp1ProvidersLoading, Sp1ProvidersEmpty, Sp1ProvidersError,
  SP1_TAX_LINE,
});
