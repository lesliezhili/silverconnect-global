// app/[locale]/signup/page.tsx
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';

export default function LocalizedSignUpDashboard() {
  const params = useParams();
  const locale = params?.locale || 'en'; // Detects active locale segment dynamically

  const [role, setRole] = useState<'Customer' | 'Provider'>('Customer');
  const [targetTier, setTargetTier] = useState<string>('Level_1_Basic_Community');
  const [loading, setLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState<{ status: 'ok' | 'fail'; msg: string } | null>(null);

  const [form, setForm] = useState({
    email: '', password: '', firstName: '', lastName: '', phone: '', postcode: '', ndisNumber: '',
    legalName: '', abn: '', cert4Url: '', ahpraNumber: ''
  });

  const handleUpdate = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const executeRegistrationTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatusFeedback(null);

    // Backend APIs remain un-localized under standard api grouping paths
    const targetUrl = role === 'Customer' ? '/api/auth/signup/customer' : '/api/auth/signup/provider';
    
    const payload = role === 'Customer' 
      ? {
          email: form.email, password: form.password, firstName: form.firstName,
          lastName: form.lastName, phone: form.phone, postcode: form.postcode, ndisNumber: form.ndisNumber || null
        }
      : {
          email: form.email, password: form.password, legalName: form.legalName, abn: form.abn,
          targetTier, policeCheckUrl: 'https://vault.herun.org/mock-police.pdf', identityUrl: 'https://vault.herun.org/mock-passport.pdf',
          cert4Url: form.cert4Url || null, ahpraNumber: form.ahpraNumber || null
        };

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Network transaction error.');

      setStatusFeedback({
        status: 'ok',
        msg: role === 'Customer' 
          ? (locale === 'zh' ? '客戶註冊成功！帳戶已激活。' : 'Welcome to HeRun! Account active.')
          : (locale === 'zh' ? '註冊成功！合規文件已存檔，等待管理員審查。' : 'Compliance documents logged safely. Audit ongoing.')
      });
    } catch (err: any) {
      setStatusFeedback({ status: 'fail', msg: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          🌍 HeRun <span className="text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 rounded uppercase">{locale} stack</span>
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          {locale === 'zh' ? '「和潤」獨立生命傳記與互助平台' : 'Independent Mutual Aid & Biography Platform'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-slate-800 py-8 px-4 border border-slate-700 shadow-xl rounded-2xl sm:px-10">
          
          {/* Interactive Role Switch Tabs */}
          <div className="flex bg-slate-900 p-1.5 rounded-xl border border-slate-700/60 mb-6">
            <button
              type="button"
              className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all ${role === 'Customer' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => { setRole('Customer'); setStatusFeedback(null); }}
            >
              {locale === 'zh' ? '🙋‍♂️ 客戶端註冊' : '🙋‍♂️ Customer Sign-Up'}
            </button>
            <button
              type="button"
              className={`w-1/2 py-2.5 text-xs font-semibold rounded-lg transition-all ${role === 'Provider' ? 'bg-slate-800 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
              onClick={() => { setRole('Provider'); setStatusFeedback(null); }}
            >
              {locale === 'zh' ? '💼 服務夥伴入駐' : '💼 Provider Onboarding'}
            </button>
          </div>

          {statusFeedback && (
            <div className={`p-4 rounded-xl mb-6 text-xs font-medium border ${statusFeedback.status === 'ok' ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'}`}>
              {statusFeedback.msg}
            </div>
          )}

          <form className="space-y-4 text-xs" onSubmit={executeRegistrationTransaction}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider mb-1">
                  {locale === 'zh' ? '電子郵箱' : 'Email Address'}
                </label>
                <input type="email" name="email" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 placeholder-slate-600 outline-none focus:border-blue-500" />
              </div>
              <div>
                <label className="block font-medium text-slate-300 uppercase tracking-wider mb-1">
                  {locale === 'zh' ? '密碼' : 'Password'}
                </label>
                <input type="password" name="password" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
              </div>
            </div>

            {/* CUSTOMER PROFILE FIELD BLOCKS */}
            {role === 'Customer' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '名' : 'Given Name'}</label>
                    <input type="text" name="firstName" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '姓' : 'Family Surname'}</label>
                    <input type="text" name="lastName" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '電話號碼' : 'Phone Contact'}</label>
                    <input type="text" name="phone" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '服務郵政編碼' : 'Service Postcode'}</label>
                    <input type="text" name="postcode" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                  </div>
                </div>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? 'NDIS 保障計劃編號 (選填)' : 'NDIS Account Reference ID (Optional)'}</label>
                  <input type="text" name="ndisNumber" onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                </div>
              </>
            )}

            {/* SERVICE PROVIDER FIELD BLOCKS */}
            {role === 'Provider' && (
              <>
                <div>
                  <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '法定商戶/個人名稱' : 'Legal Business Name'}</label>
                  <input type="text" name="legalName" required onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '澳大利亞商業號碼 (ABN)' : 'Australian Business Number (ABN)'}</label>
                    <input type="text" name="abn" maxLength={11} required placeholder="11 digit string" onChange={handleUpdate} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label className="block font-medium text-slate-300 mb-1">{locale === 'zh' ? '申請認證級別' : 'Vetting Target Level'}</label>
                    <select
                      name="targetTier"
                      value={targetTier}
                      onChange={(e) => setTargetTier(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-100 outline-none focus:border-blue-500"
                    >
                      <option value="Level_1_Basic_Community">Level 1 (Social Companion / 基礎社區互助)</option>
                      <option value="Level_2_Certified_Care">Level 2 (Certified Carer / 四級證書護理認證)</option>
                      <option value="Level_3_Clinical_Professional">Level 3 (Clinical Practitioner / 專業醫療與輔助醫療)</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Vetting Documents Guard Matrix */}
                {(targetTier === 'Level_2_Certified_Care' || targetTier === 'Level_3_Clinical_Professional') && (
                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 space-y-3">
                    <p className="font-semibold text-amber-400">⚠️ {locale === 'zh' ? '觸發合規資質校驗限制' : 'Conditional Vetting Gates Active'}</p>
                    <div>
                      <label className="block text-slate-300 mb-1">{locale === 'zh' ? '護理四級證書 (Certificate IV) 上傳路徑 *' : 'Certificate IV Document Storage URL *'}</label>
                      <input type="text" name="cert4Url" placeholder="https://secure-vault/cert4.pdf" required onChange={handleUpdate} className="w-full bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-200 outline-none focus:border-amber-400" />
                    </div>

                    {targetTier === 'Level_3_Clinical_Professional' && (
                      <div>
                        <label className="block text-slate-300 mb-1">{locale === 'zh' ? 'AHPRA 醫療執業註冊編號 *' : 'AHPRA Practitioner Registration Code *'}</label>
                        <input type="text" name="ahpraNumber" placeholder="e.g., NURS10009874" required onChange={handleUpdate} className="w-full bg-slate-900 border border-amber-500/30 rounded-lg p-2.5 text-amber-200 outline-none focus:border-amber-400 font-mono" />
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl text-white font-semibold bg-blue-600 hover:bg-blue-500 transition-colors shadow-md disabled:bg-slate-700 disabled:text-slate-500 text-sm tracking-wide"
              >
                {loading ? 'Processing Transaction...' : (locale === 'zh' ? '提交安全賬戶登記' : 'Complete System Registration')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}