// Screens — Part 4: Auth, Profile, Payment, Feedback, Dispute, Provider, Admin, Errors

function AuthScreen({ lang = 'zh', mode = 'login' }) {
  const [tab, setTab] = React.useState(mode);
  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%', padding: '40px 24px 24px' }}>
      <Logo size={36}/>
      <div style={{ marginTop: 36 }}>
        <h1 className="sc-h1" style={{ margin: 0, fontSize: 30 }}>{tab === 'login' ? (lang === 'zh' ? '欢迎回来' : 'Welcome back') : (lang === 'zh' ? '创建账号' : 'Create account')}</h1>
        <p className="sc-body" style={{ margin: '8px 0 0', color: 'var(--text-secondary)' }}>{lang === 'zh' ? '安全预订上门服务' : 'Book trusted helpers safely'}</p>
      </div>

      <div className="sc-stack" style={{ marginTop: 32, gap: 16 }}>
        <div>
          <label style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{lang === 'zh' ? '邮箱' : 'Email'}</label>
          <input className="sc-input" placeholder="margaret@example.com" defaultValue="margaret.wang@gmail.com"/>
        </div>
        <div>
          <label style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>{lang === 'zh' ? '密码' : 'Password'}</label>
          <input className="sc-input" type="password" placeholder="••••••••" defaultValue="••••••••"/>
          <div className="sc-tiny" style={{ marginTop: 6 }}>{lang === 'zh' ? '至少 8 位' : 'At least 8 chars'}</div>
        </div>
        <button className="sc-btn sc-btn-primary sc-btn-block sc-btn-lg" style={{ marginTop: 8 }}>{tab === 'login' ? (lang === 'zh' ? '登录' : 'Sign in') : (lang === 'zh' ? '注册' : 'Sign up')}</button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '8px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
          <span className="sc-tiny">{lang === 'zh' ? '或' : 'or'}</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }}/>
        </div>
        <button className="sc-btn sc-btn-secondary sc-btn-block">G  {lang === 'zh' ? '使用 Google 继续' : 'Continue with Google'}</button>
        <button className="sc-btn sc-btn-secondary sc-btn-block">  {lang === 'zh' ? '使用 Apple 继续' : 'Continue with Apple'}</button>

        <button className="sc-btn-ghost" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-primary)', fontSize: 17, fontWeight: 600, padding: '14px 0', fontFamily: 'inherit' }}>
          {tab === 'login' ? (lang === 'zh' ? '忘记密码？' : 'Forgot password?') : null}
        </button>
        <button onClick={() => setTab(tab === 'login' ? 'signup' : 'login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 17, padding: '8px 0', fontFamily: 'inherit', textAlign: 'center' }}>
          {tab === 'login' ? (lang === 'zh' ? '没有账号？立即注册 →' : "No account? Sign up →") : (lang === 'zh' ? '已有账号？登录 →' : 'Have an account? Sign in →')}
        </button>
      </div>
    </div>
  );
}

// ═══════════ Feedback ═══════════
function FeedbackScreen({ lang = 'zh' }) {
  const [stars, setStars] = React.useState(5);
  const [tags, setTags] = React.useState(['punctual', 'professional']);
  const tagOpts = lang === 'zh' ? [['punctual', '准时'], ['professional', '专业'], ['clean', '干净'], ['nice', '态度好'], ['fair', '价格合理']] : [['punctual', 'On time'], ['professional', 'Professional'], ['clean', 'Clean'], ['nice', 'Friendly'], ['fair', 'Fair price']];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="sc-iconbtn"><IconClose size={24}/></button>
        <h1 className="sc-h2" style={{ margin: 0, fontSize: 22, flex: 1 }}>{lang === 'zh' ? '评价服务' : 'Rate service'}</h1>
      </div>
      <div style={{ padding: '24px 20px 100px' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <ProviderAvatar size={80} hue={0} initials={lang === 'zh' ? '李' : 'HL'}/>
          <div style={{ marginTop: 12, fontSize: 20, fontWeight: 700 }}>{lang === 'zh' ? '李 师傅' : 'Helen Li'}</div>
          <div className="sc-small" style={{ marginTop: 4 }}>{lang === 'zh' ? '4 小时深度清洁 · 5月 8' : '4-hr deep clean · 8 May'}</div>
        </div>

        <div style={{ background: 'var(--bg-surface)', borderRadius: 20, padding: 24, textAlign: 'center' }}>
          <div className="sc-small" style={{ color: 'var(--text-secondary)' }}>{lang === 'zh' ? '今天的服务怎么样？' : 'How was today?'}</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 14 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setStars(n)} style={{ width: 56, height: 56, background: 'none', border: 'none', cursor: 'pointer', color: n <= stars ? 'var(--brand-accent)' : 'var(--border-strong)', padding: 0 }}>
                {n <= stars ? <IconStar size={48}/> : <IconStarOutline size={48}/>}
              </button>
            ))}
          </div>
          <div style={{ marginTop: 14, fontSize: 22, fontWeight: 700, color: 'var(--brand-accent)' }}>
            {[null, lang === 'zh' ? '不满意' : 'Poor', lang === 'zh' ? '一般' : 'OK', lang === 'zh' ? '还行' : 'Good', lang === 'zh' ? '不错' : 'Great', lang === 'zh' ? '太棒了！' : 'Amazing!'][stars]}
          </div>
        </div>

        <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '哪里做得好？' : 'What was good?'}</h3>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {tagOpts.map(([id, label]) => (
            <button key={id} onClick={() => setTags(t => t.includes(id) ? t.filter(x => x !== id) : [...t, id])} className={`sc-chip ${tags.includes(id) ? 'sc-chip-active' : ''}`} style={{ height: 48, fontSize: 16, fontWeight: 600 }}>
              {tags.includes(id) && <IconCheck size={16}/>} {label}
            </button>
          ))}
        </div>

        <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '想说点什么吗？（可选）' : 'Anything to add? (optional)'}</h3>
        <textarea className="sc-input" style={{ height: 110, padding: 16, resize: 'none', fontFamily: 'inherit' }} placeholder={lang === 'zh' ? '李师傅人很好，下次还想约她...' : 'Helen was lovely, will book again...'}/>

        <button className="sc-btn sc-btn-secondary sc-btn-block" style={{ marginTop: 16 }}>
          <IconCamera size={20}/> {lang === 'zh' ? '上传照片（最多 5 张）' : 'Add photos (max 5)'}
        </button>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px 24px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
        <button className="sc-btn sc-btn-primary sc-btn-block sc-btn-lg">{lang === 'zh' ? '提交评价并完成' : 'Submit & complete'}</button>
      </div>
    </div>
  );
}

// ═══════════ Dispute ═══════════
function DisputeScreen({ lang = 'zh' }) {
  const [type, setType] = React.useState('incomplete');
  const [outcome, setOutcome] = React.useState('partial');
  const types = lang === 'zh' ? [
    ['late', '没按时来', IconClock], ['incomplete', '服务不完整', IconWarn],
    ['damage', '损坏物品', IconAlert], ['other', '其他', IconChat],
  ] : [
    ['late', 'Late', IconClock], ['incomplete', 'Incomplete', IconWarn],
    ['damage', 'Damage', IconAlert], ['other', 'Other', IconChat],
  ];
  const outcomes = lang === 'zh' ? [['redo', '重做'], ['partial', '部分退款'], ['full', '全额退款']] : [['redo', 'Redo'], ['partial', 'Partial refund'], ['full', 'Full refund']];

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="sc-iconbtn"><IconBack size={24}/></button>
        <h1 className="sc-h2" style={{ margin: 0, fontSize: 22, flex: 1 }}>{lang === 'zh' ? '提交问题' : 'Report issue'}</h1>
      </div>
      <div style={{ padding: '20px 20px 120px' }}>
        <h3 className="sc-h3" style={{ margin: '0 0 12px', fontSize: 20 }}>{lang === 'zh' ? '问题类型' : 'Issue type'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {types.map(([id, label, I]) => (
            <button key={id} onClick={() => setType(id)} style={{
              borderRadius: 14, border: type === id ? '2.5px solid var(--brand-primary)' : '1.5px solid var(--border)',
              background: type === id ? 'var(--brand-primary-soft)' : 'var(--bg-base)',
              padding: '20px 14px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit', minHeight: 110,
            }}>
              <I size={32} style={{ color: type === id ? 'var(--brand-primary)' : 'var(--text-secondary)' }}/>
              <span style={{ fontSize: 16, fontWeight: 700, color: type === id ? 'var(--brand-primary)' : 'var(--text-primary)' }}>{label}</span>
            </button>
          ))}
        </div>

        <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '描述发生了什么' : 'What happened?'} <span style={{ color: 'var(--danger)' }}>*</span></h3>
        <textarea className="sc-input" style={{ height: 120, padding: 16, resize: 'none', fontFamily: 'inherit' }} placeholder={lang === 'zh' ? '至少 20 字...' : 'At least 20 characters...'} defaultValue={lang === 'zh' ? '约定 4 小时深度清洁，但 2 小时就走了，厨房窗户没擦。' : ''}/>

        <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '上传证据' : 'Evidence'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[0, 1].map(i => (
            <div key={i} style={{ aspectRatio: '1', background: 'var(--bg-surface-2)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
              <IconCamera size={28}/>
            </div>
          ))}
          <button style={{ aspectRatio: '1', background: 'var(--bg-base)', border: '2px dashed var(--border-strong)', borderRadius: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, gap: 4 }}>
            <IconPlus size={24}/>{lang === 'zh' ? '添加' : 'Add'}
          </button>
        </div>

        <h3 className="sc-h3" style={{ margin: '24px 0 12px', fontSize: 20 }}>{lang === 'zh' ? '期望结果' : 'Expected outcome'}</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {outcomes.map(([id, label]) => (
            <button key={id} onClick={() => setOutcome(id)} className={`sc-chip ${outcome === id ? 'sc-chip-active' : ''}`} style={{ height: 48, fontSize: 16 }}>
              {outcome === id && <IconCheck size={16}/>} {label}
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, padding: 16, background: 'var(--brand-accent-soft)', borderRadius: 14, color: 'var(--brand-accent)' }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <IconShield size={24} style={{ flexShrink: 0, marginTop: 2 }}/>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'zh' ? '托管保护' : 'Escrow protection'}</div>
              <div className="sc-small" style={{ marginTop: 4, color: 'inherit' }}>{lang === 'zh' ? '提交后管理员将在 48 小时内回复，托管款项 A$247.50 暂不释放。' : 'Funds (A$247.50) held until resolved within 48h.'}</div>
            </div>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 20px 24px', background: 'var(--bg-base)', borderTop: '1px solid var(--border)' }}>
        <button className="sc-btn sc-btn-primary sc-btn-block sc-btn-lg">{lang === 'zh' ? '提交' : 'Submit'}</button>
      </div>
    </div>
  );
}

// ═══════════ Provider Home ═══════════
function ProviderHome({ lang = 'zh' }) {
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      <div style={{ padding: '20px 20px 12px', background: 'var(--bg-base)' }}>
        <div className="sc-row" style={{ justifyContent: 'space-between' }}>
          <div>
            <div className="sc-tiny" style={{ marginBottom: 2 }}>{lang === 'zh' ? '今天 · 周三 5月 2' : 'Today · Wed 2 May'}</div>
            <h1 className="sc-h2" style={{ margin: 0 }}>{lang === 'zh' ? '你好，李师傅' : 'Hi, Helen'} 👋</h1>
          </div>
          <ProviderAvatar size={56} hue={0} initials={lang === 'zh' ? '李' : 'HL'}/>
        </div>
      </div>

      <div style={{ padding: '16px 20px 100px' }}>
        {/* Earnings card */}
        <div style={{ background: 'linear-gradient(135deg, #1F6FEB 0%, #1858C4 100%)', color: '#fff', borderRadius: 22, padding: 22, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: 999, background: 'rgba(245,158,11,0.2)' }}/>
          <div style={{ fontSize: 14, opacity: 0.9, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{lang === 'zh' ? '本周收入' : 'This week'}</div>
          <div style={{ fontSize: 42, fontWeight: 800, marginTop: 4, letterSpacing: '-0.02em' }}>A$1,240<span style={{ fontSize: 24, opacity: 0.8 }}>.00</span></div>
          <div style={{ display: 'flex', gap: 24, marginTop: 16, position: 'relative', zIndex: 1 }}>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{lang === 'zh' ? '托管中' : 'Held'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>A$320</div>
            </div>
            <div style={{ width: 1, background: 'rgba(255,255,255,0.3)' }}/>
            <div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>{lang === 'zh' ? '已到账' : 'Paid out'}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginTop: 2 }}>A$920</div>
            </div>
          </div>
        </div>

        {/* Today's tasks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', margin: '24px 4px 12px' }}>
          <h2 className="sc-h3" style={{ margin: 0 }}>{lang === 'zh' ? '今日任务' : "Today's jobs"}</h2>
          <span className="sc-badge sc-badge-info">3 {lang === 'zh' ? '单' : 'jobs'}</span>
        </div>

        <div className="sc-stack" style={{ gap: 12 }}>
          {/* Active task */}
          <div className="sc-card" style={{ border: '2px solid var(--brand-primary)', position: 'relative' }}>
            <span className="sc-badge sc-badge-info" style={{ position: 'absolute', top: 16, right: 16 }}>{lang === 'zh' ? '进行中' : 'Active'}</span>
            <div style={{ fontSize: 14, color: 'var(--brand-primary)', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase' }}>09:00 – 13:00</div>
            <div style={{ fontSize: 22, fontWeight: 700, marginTop: 6 }}>{lang === 'zh' ? '王阿姨 · 4h 深度清洁' : 'Margaret W. · 4h deep clean'}</div>
            <div className="sc-row" style={{ marginTop: 10, gap: 14, color: 'var(--text-secondary)' }}>
              <span className="sc-row" style={{ gap: 4 }}><IconPin size={16}/> Carlton 3km</span>
              <span className="sc-row" style={{ gap: 4 }}><IconClock size={16}/> 4h</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flex: 1 }}><IconNav size={18}/> {lang === 'zh' ? '导航' : 'Navigate'}</button>
              <button className="sc-btn sc-btn-secondary sc-btn-sm" style={{ flex: 1 }}><IconPhone size={18}/> {lang === 'zh' ? '电话' : 'Call'}</button>
            </div>
            <button className="sc-btn sc-btn-primary sc-btn-block" style={{ marginTop: 10 }}>
              <IconCheck size={20}/> {lang === 'zh' ? '标记完成' : 'Mark complete'}
            </button>
          </div>

          {/* Upcoming */}
          <div className="sc-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'center', minWidth: 56 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>14:30</div>
              <div className="sc-tiny">2h</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{lang === 'zh' ? '陈先生 · 2h 基础' : 'Mr Chen · 2h basic'}</div>
              <div className="sc-small" style={{ marginTop: 2 }}>Fitzroy · 5km</div>
            </div>
          </div>
          <div className="sc-card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ textAlign: 'center', minWidth: 56 }}>
              <div style={{ fontSize: 22, fontWeight: 800 }}>17:00</div>
              <div className="sc-tiny">3h</div>
            </div>
            <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)' }}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{lang === 'zh' ? '张女士 · 3h 烹饪' : 'Mrs Zhang · 3h cooking'}</div>
              <div className="sc-small" style={{ marginTop: 2 }}>Brunswick · 7km</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════ Provider Availability (Week) ═══════════
function ProviderAvailability({ lang = 'zh' }) {
  const days = lang === 'zh' ? ['一', '二', '三', '四', '五', '六', '日'] : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const dates = ['5/5', '5/6', '5/7', '5/8', '5/9', '5/10', '5/11'];
  // each day: [morning, afternoon, evening] state: 0=available 1=blocked 2=booked
  const [grid, setGrid] = React.useState([
    [0, 2, 0], [0, 0, 1], [2, 2, 0], [0, 0, 0], [0, 2, 0], [1, 1, 1], [0, 0, 0],
  ]);
  const periods = lang === 'zh' ? ['早', '中', '晚'] : ['AM', 'PM', 'EVE'];
  const cycle = (d, p) => setGrid(g => g.map((row, i) => i === d ? row.map((v, j) => j === p ? (v + 1) % 3 : v) : row));
  const colors = ['var(--success-soft)', 'var(--bg-surface-2)', 'var(--brand-primary-soft)'];
  const fg = ['var(--success)', 'var(--text-tertiary)', 'var(--brand-primary)'];
  const labels = lang === 'zh' ? ['可用', '屏蔽', '已订'] : ['Free', 'Off', 'Booked'];
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%' }}>
      <div style={{ padding: '12px 20px', background: 'var(--bg-base)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="sc-iconbtn"><IconBack size={24}/></button>
        <h1 className="sc-h2" style={{ margin: 0, fontSize: 22, flex: 1 }}>{lang === 'zh' ? '可用时段' : 'My availability'}</h1>
      </div>
      <div style={{ padding: '20px' }}>
        <div className="sc-card" style={{ padding: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <button className="sc-iconbtn" style={{ width: 36, height: 36 }}><IconBack size={20}/></button>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{lang === 'zh' ? '5月 5 – 11' : '5 – 11 May'}</div>
            <button className="sc-iconbtn" style={{ width: 36, height: 36 }}><IconChev size={20}/></button>
          </div>
          {/* Header row */}
          <div style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
            <div/>
            {days.map((d, i) => (
              <div key={i} style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
                <div>{d}</div>
                <div className="sc-tiny" style={{ marginTop: 0 }}>{dates[i]}</div>
              </div>
            ))}
          </div>
          {/* Grid */}
          {[0, 1, 2].map(p => (
            <div key={p} style={{ display: 'grid', gridTemplateColumns: '40px repeat(7, 1fr)', gap: 4, marginTop: 4 }}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>{periods[p]}</div>
              {grid.map((row, d) => (
                <button key={d} onClick={() => cycle(d, p)} style={{
                  height: 56, borderRadius: 10, border: 'none', background: colors[row[p]], color: fg[row[p]],
                  fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>{labels[row[p]]}</button>
              ))}
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 16, marginTop: 16, padding: '12px 14px', background: 'var(--bg-base)', borderRadius: 12, border: '1px solid var(--border)' }}>
          {labels.map((l, i) => (
            <div key={l} className="sc-row" style={{ gap: 6, fontSize: 14 }}>
              <div style={{ width: 14, height: 14, borderRadius: 4, background: colors[i], border: `1px solid ${fg[i]}` }}/>
              <span style={{ color: 'var(--text-secondary)' }}>{l}</span>
            </div>
          ))}
        </div>
        <button className="sc-btn sc-btn-primary sc-btn-block" style={{ marginTop: 16 }}>{lang === 'zh' ? '保存' : 'Save'}</button>
      </div>
    </div>
  );
}

// ═══════════ Admin Dispute Drawer (desktop) ═══════════
function AdminDispute({ lang = 'zh' }) {
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%', display: 'flex' }}>
      {/* Side rail */}
      <div style={{ width: 80, background: 'var(--bg-base)', borderRight: '1px solid var(--border)', padding: '20px 0', display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center' }}>
        <Logo size={28}/>
        <div style={{ height: 16 }}/>
        {[
          [IconAlert, '争议', 'var(--danger)', true],
          [IconShield, '安全', null, false],
          [IconUser, '审核', null, false],
          [IconCard, '合规', null, false],
          [IconGrid, '数据', null, false],
        ].map(([I, label, c, active], i) => (
          <button key={i} className="sc-iconbtn" style={{ width: 56, height: 56, borderRadius: 14, color: active ? 'var(--brand-primary)' : 'var(--text-secondary)', background: active ? 'var(--brand-primary-soft)' : 'transparent', position: 'relative' }}>
            <I size={24}/>
            {c && <span style={{ position: 'absolute', top: 8, right: 12, width: 8, height: 8, borderRadius: 999, background: c }}/>}
          </button>
        ))}
      </div>

      {/* Main table */}
      <div style={{ flex: 1, padding: '24px 28px', overflow: 'auto' }} className="sc-noscroll">
        <h1 className="sc-h2" style={{ margin: 0 }}>{lang === 'zh' ? '争议处理' : 'Disputes'} <span style={{ color: 'var(--danger)', fontSize: 18, marginLeft: 8 }}>· 5 {lang === 'zh' ? '待处理' : 'pending'}</span></h1>
        <div style={{ marginTop: 18, background: 'var(--bg-base)', borderRadius: 16, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 130px 110px', padding: '12px 18px', borderBottom: '1px solid var(--border)', background: 'var(--bg-surface)', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            <div>ID</div><div>{lang === 'zh' ? '客户' : 'Customer'}</div><div>{lang === 'zh' ? '问题' : 'Issue'}</div><div>{lang === 'zh' ? '金额' : 'Amount'}</div><div>{lang === 'zh' ? '状态' : 'Status'}</div>
          </div>
          {[
            { id: '#1284', cust: lang === 'zh' ? '王女士' : 'Margaret W.', issue: lang === 'zh' ? '服务不完整' : 'Incomplete', amt: 'A$247.50', s: 'open', sel: true },
            { id: '#1283', cust: lang === 'zh' ? '陈先生' : 'Mr Chen', issue: lang === 'zh' ? '没按时来' : 'Late arrival', amt: 'A$96.00', s: 'replied' },
            { id: '#1281', cust: lang === 'zh' ? '林女士' : 'Mrs Lin', issue: lang === 'zh' ? '损坏物品' : 'Damage', amt: 'A$340.00', s: 'open' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 1fr 130px 110px', padding: '14px 18px', borderBottom: '1px solid var(--border)', background: r.sel ? 'var(--brand-primary-soft)' : 'transparent', alignItems: 'center', cursor: 'pointer' }}>
              <div style={{ fontSize: 14, color: 'var(--text-tertiary)', fontWeight: 600 }}>{r.id}</div>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{r.cust}</div>
              <div style={{ fontSize: 16 }}>{r.issue}</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{r.amt}</div>
              <div><span className={`sc-badge ${r.s === 'open' ? 'sc-badge-danger' : 'sc-badge-warning'}`}>{r.s === 'open' ? (lang === 'zh' ? '待回复' : 'Open') : (lang === 'zh' ? '已回复' : 'Replied')}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail drawer */}
      <div style={{ width: 480, background: 'var(--bg-base)', borderLeft: '1px solid var(--border)', padding: '24px', overflow: 'auto' }} className="sc-noscroll">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="sc-tiny">{lang === 'zh' ? '争议' : 'Dispute'} #1284</div>
            <h2 className="sc-h3" style={{ margin: '4px 0 0' }}>{lang === 'zh' ? '服务不完整' : 'Incomplete service'}</h2>
          </div>
          <button className="sc-iconbtn"><IconClose size={22}/></button>
        </div>
        <div style={{ marginTop: 20, padding: 14, background: 'var(--bg-surface)', borderRadius: 12 }}>
          <div className="sc-row" style={{ justifyContent: 'space-between' }}>
            <span className="sc-small">{lang === 'zh' ? '客户' : 'Customer'}</span>
            <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '王女士' : 'Margaret Wang'}</span>
          </div>
          <div className="sc-row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <span className="sc-small">{lang === 'zh' ? 'Provider' : 'Provider'}</span>
            <span style={{ fontWeight: 600 }}>{lang === 'zh' ? '李 师傅' : 'Helen Li'}</span>
          </div>
          <div className="sc-row" style={{ justifyContent: 'space-between', marginTop: 8 }}>
            <span className="sc-small">{lang === 'zh' ? '金额（托管中）' : 'Amount (held)'}</span>
            <span style={{ fontWeight: 700, fontSize: 18 }}>A$247.50</span>
          </div>
        </div>
        <h4 style={{ margin: '20px 0 8px', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{lang === 'zh' ? '客户描述' : 'Description'}</h4>
        <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6 }}>{lang === 'zh' ? '约定 4 小时深度清洁，但师傅 2 小时就走了，厨房窗户没擦，浴室也没拖。已附照片。' : 'Booked 4h deep clean. Helper left after 2h, windows + bathroom not done.'}</p>
        <h4 style={{ margin: '20px 0 8px', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{lang === 'zh' ? '证据' : 'Evidence'}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ aspectRatio: '1', background: 'var(--bg-surface-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}><IconCamera size={20}/></div>)}
        </div>
        <h4 style={{ margin: '20px 0 8px', fontSize: 15, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-secondary)' }}>{lang === 'zh' ? '决议' : 'Resolution'}</h4>
        <div className="sc-stack" style={{ gap: 8 }}>
          <button className="sc-btn sc-btn-primary">{lang === 'zh' ? '部分退款 A$110' : 'Partial refund A$110'}</button>
          <button className="sc-btn sc-btn-secondary">{lang === 'zh' ? '全额退款' : 'Full refund'}</button>
          <button className="sc-btn sc-btn-secondary">{lang === 'zh' ? '驳回' : 'Reject'}</button>
        </div>
      </div>
    </div>
  );
}

// ═══════════ Errors / Empty states (5-up grid) ═══════════
function EmptyStates({ lang = 'zh' }) {
  const items = [
    { illus: <IllusOffline/>, title: lang === 'zh' ? '连不上网' : 'No connection', body: lang === 'zh' ? '检查 WiFi 或数据' : 'Check WiFi or data', cta: lang === 'zh' ? '重试' : 'Retry', primary: true },
    { illus: <IllusError/>, title: lang === 'zh' ? '出了点问题' : 'Something went wrong', body: lang === 'zh' ? '错误码 E_5012' : 'Error E_5012', cta: lang === 'zh' ? '重试' : 'Retry', primary: true },
    { illus: <IllusEmpty/>, title: lang === 'zh' ? '暂无预订' : 'No bookings yet', body: lang === 'zh' ? '从浏览服务开始' : 'Start by browsing services', cta: lang === 'zh' ? '浏览服务 →' : 'Browse →', primary: true },
    { illus: <IllusPaid/>, title: lang === 'zh' ? '卡被拒' : 'Card declined', body: lang === 'zh' ? '请换张卡或联系银行' : 'Try another card or call bank', cta: lang === 'zh' ? '换张卡' : 'Change card', primary: true, danger: true },
    { illus: null, skel: true, title: lang === 'zh' ? '加载中' : 'Loading', body: '', cta: null },
  ];
  return (
    <div style={{ background: 'var(--bg-surface)', minHeight: '100%', padding: '20px' }}>
      <h1 className="sc-h2" style={{ margin: '0 0 16px', fontSize: 22 }}>{lang === 'zh' ? '错误与空状态合集' : 'Error & empty states'}</h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {items.map((it, i) => (
          <div key={i} style={{ background: 'var(--bg-base)', borderRadius: 18, padding: 20, border: '1px solid var(--border)', textAlign: 'center', minHeight: 220, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gridColumn: i === 4 ? '1 / -1' : 'auto' }}>
            {it.skel ? (
              <div style={{ width: '100%' }}>
                <div className="sc-skel" style={{ height: 16, width: '40%', margin: '0 auto 12px' }}/>
                <div className="sc-skel" style={{ height: 60, marginBottom: 8 }}/>
                <div className="sc-skel" style={{ height: 60, marginBottom: 8 }}/>
              </div>
            ) : (
              <>
                <div style={{ color: 'var(--text-tertiary)' }}>{it.illus}</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 10 }}>{it.title}</div>
                <div className="sc-small" style={{ marginTop: 4 }}>{it.body}</div>
                {it.cta && <button className={`sc-btn sc-btn-sm ${it.danger ? 'sc-btn-danger' : 'sc-btn-primary'}`} style={{ marginTop: 12, minWidth: 120 }}>{it.cta}</button>}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { AuthScreen, FeedbackScreen, DisputeScreen, ProviderHome, ProviderAvailability, AdminDispute, EmptyStates });
