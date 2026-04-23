'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { isSupabaseConfigured } from '@/lib/supabase'
import { SERVICES_AU } from '@/lib/services'
import { useLocation } from '@/components/LocationDetector'
import LocationDetector from '@/components/LocationDetector'
import { providersNearPostcode } from '@/lib/matching'
import dynamic from 'next/dynamic'
import CountrySelector from '@/components/CountrySelector'
import LanguageSelector from '@/components/LanguageSelector'
import { translations, Language } from '@/lib/translations'

const ProviderRegistration = dynamic(() => import('@/components/ProviderRegistration'), { ssr: false })
const CustomerRegistration  = dynamic(() => import('@/components/CustomerRegistration'),  { ssr: false })

export default function HomePage() {
  const { location } = useLocation()
  const [modal, setModal] = useState<'provider' | 'customer' | null>(null)
  const [selectedCountry, setSelectedCountry] = useState('AU')
  const [language, setLanguage] = useState<Language>('en')
  const [mounted, setMounted] = useState(false)
  
  const nearbyProviders = providersNearPostcode(location.postcode, 15)
  const topProviders    = nearbyProviders.slice(0, 3)

  // For China, show Chinese location; for other countries, show actual location
  const displayLocation = selectedCountry === 'CN' 
    ? { suburb: '北京', postcode: '100000', province: '北京市', state: 'Beijing' }
    : { ...location, province: '' }

  const countries = {
    AU: { name: 'Australia', flag: '🇦🇺', currency: 'AUD' },
    CN: { name: 'China', flag: '🇨🇳', currency: 'CNY' },
    CA: { name: 'Canada', flag: '🇨🇦', currency: 'CAD' }
  }

  const t = (key: string) => (translations[language] as any)[key] || key;

  // Load preferences from localStorage and set default language based on country
  useEffect(() => {
    try {
      const savedCountry = localStorage.getItem('selectedCountry') || 'AU'
      const savedLanguage = localStorage.getItem('selectedLanguage') as Language | null
      
      setSelectedCountry(savedCountry)
      
      // Set language based on saved preference or country default
      if (savedLanguage) {
        setLanguage(savedLanguage)
      } else if (savedCountry === 'CN') {
        setLanguage('zh')
        localStorage.setItem('selectedLanguage', 'zh')
      } else {
        setLanguage('en')
        localStorage.setItem('selectedLanguage', 'en')
      }
    } catch {}
    setMounted(true)
  }, [])

  // Sync language to localStorage whenever it changes
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('selectedLanguage', language)
    }
  }, [language, mounted])

  // Save country to localStorage and update language (only if no language preference saved)
  const handleCountryChange = (country: string) => {
    setSelectedCountry(country)
    localStorage.setItem('selectedCountry', country)
    
    // Only auto-set language if user hasn't manually selected a language before
    const hasLanguagePreference = localStorage.getItem('selectedLanguage') !== null
    if (!hasLanguagePreference) {
      if (country === 'CN') {
        setLanguage('zh')
      } else {
        setLanguage('en')
      }
    }
  }

  // Save language to localStorage
  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang)
    localStorage.setItem('selectedLanguage', lang)
  }

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-[#FBF7F2]">

      {!isSupabaseConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-1.5 text-center text-xs text-amber-800">
          Demo mode — add Supabase credentials to .env.local for live data
        </div>
      )}

      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-3 md:px-6 py-2 md:h-16 flex items-center justify-between gap-2 md:gap-4 flex-wrap md:flex-nowrap">
          <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
            <div className="w-8 md:w-9 h-8 md:h-9 rounded-xl bg-[#2D6A5E] flex items-center justify-center">
              <svg className="w-4 md:w-5 h-4 md:h-5 fill-white" viewBox="0 0 24 24">
                <path d="M12 21.7C5.8 17.4 2 13.5 2 9.5 2 6.4 4.4 4 7.5 4c1.7 0 3.4.8 4.5 2.1C13.1 4.8 14.8 4 16.5 4 19.6 4 22 6.4 22 9.5c0 4-3.8 7.9-10 12.2z"/>
              </svg>
            </div>
            <div>
              <div className="font-serif font-semibold text-base md:text-lg leading-tight">
                {language === 'zh' ? t('appName') : 'SilverConnect'}
              </div>
              <div className="text-[7px] md:text-[9px] text-gray-400 tracking-widest uppercase">
                {language === 'zh' ? t('appTagline') : 'Care with Love'}
              </div>
            </div>
          </div>
          <div className="flex-1 max-w-xs order-3 md:order-2 w-full md:w-auto">
            <LocationDetector compact onLocationChange={undefined} />
          </div>
          <div className="order-2 md:order-3 flex gap-2 items-center">
            <CountrySelector 
              selectedCountry={selectedCountry} 
              onCountryChange={handleCountryChange} 
              countries={countries}
              compact={true}
            />
            <LanguageSelector 
              language={language} 
              onLanguageChange={handleLanguageChange}
              compact={true}
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href="/services"   className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">{t('services')}</Link>
            <Link href="/providers"  className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">{t('providers')}</Link>
            <Link href="/agedcare"   className="px-3 py-2 rounded-full text-sm text-gray-600 hover:bg-gray-50 hidden md:block">{t('agedCare')}</Link>
            <button onClick={() => setModal('provider')}
              className="px-3 py-2 rounded-full text-sm border border-gray-200 text-gray-700 hover:border-[#2D6A5E] hover:text-[#2D6A5E] hidden md:block">
              {t('providerDashboard')}
            </button>
            <button onClick={() => setModal('customer')}
              className="px-4 py-2 rounded-full bg-[#2D6A5E] text-white text-sm font-medium hover:bg-[#1A3F38]">
              {t('bookNow')}
            </button>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 pt-12 pb-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div>
          <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-800 text-xs font-medium px-3 py-1.5 rounded-full mb-5 border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block animate-pulse" />
            {t('heroSubtitle')}
          </div>
          <h1 className="font-serif text-4xl lg:text-5xl font-semibold leading-tight mb-4">
            {t('heroTitle')}
          </h1>
          <p className="text-gray-500 leading-relaxed max-w-lg mb-4">
            {selectedCountry === 'CN' 
              ? t('heroDescriptionCN').replace('{location}', displayLocation.suburb)
              : selectedCountry === 'CA'
              ? t('heroDescriptionCA').replace('{location}', displayLocation.suburb)
              : t('heroDescriptionAU').replace('{location}', displayLocation.suburb)}
          </p>
          <blockquote className="border-l-2 border-amber-400 pl-3 font-serif italic text-sm text-gray-400 mb-5">
            &#34;{language === 'zh' ? t('quoteTextZH') : t('quoteText')}&#34;
          </blockquote>

          <div className="mb-5">
            <LocationDetector onLocationChange={undefined} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 p-2 shadow-lg">
            <div className="grid grid-cols-2">
              <button className="flex flex-col px-4 py-3 rounded-xl text-left hover:bg-gray-50">
                <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-0.5">{t('service')}</span>
                <span className="text-sm text-gray-800">{t('cleaning')} &amp; {t('personalCare')}</span>
              </button>
              <button className="flex flex-col px-4 py-3 rounded-xl text-left hover:bg-gray-50 border-l border-gray-100">
                <span className="text-[10px] font-medium tracking-widest uppercase text-gray-400 mb-0.5">{t('detectedLocation')}</span>
                <span className="text-sm text-gray-800 truncate">
                  {selectedCountry === 'CN' 
                    ? `${displayLocation.province} ${displayLocation.suburb}`
                    : `${displayLocation.suburb} ${displayLocation.postcode}`}
                </span>
              </button>
            </div>
            <div className="border-t border-gray-100 mx-2 my-1" />
            <div className="flex items-center justify-between px-3 py-1.5">
              <span className="text-xs text-gray-400">
                <strong className="text-gray-600">
                  {language === 'zh' 
                    ? t('providersCountZH')
                        .replace('{count}', nearbyProviders.length.toString())
                        .replace('{location}', displayLocation.suburb)
                    : t('providersCount')
                        .replace('{count}', nearbyProviders.length.toString())
                        .replace('{plural}', nearbyProviders.length !== 1 ? 's' : '')
                        .replace('{location}', displayLocation.suburb)}
                </strong>
              </span>
              <Link href="/booking"
                className="bg-[#2D6A5E] text-white px-5 py-2.5 rounded-xl text-sm font-medium flex items-center gap-2 hover:bg-[#1A3F38]">
                {t('bookNow')}
              </Link>
            </div>
          </div>

          <div className="flex gap-4 mt-4 flex-wrap">
            {[t('backgroundChecked'), t('support24'), '4.9★', selectedCountry === 'AU' ? t('myAgedCare') : t('verified')].map(text => (
              <div key={text} className="flex items-center gap-1.5 text-xs text-gray-500">
                <div className="w-4 h-4 rounded-full bg-[#E8F3EE] flex items-center justify-center text-[#2D6A5E] text-[8px] font-bold">✓</div>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <div className="flex justify-between items-center mb-3">
              <div className="text-sm font-medium">
                {language === 'zh' 
                  ? t('browseProvidersNearZH').replace('{location}', displayLocation.suburb)
                  : t('browseProvidersNear').replace('{location}', displayLocation.suburb)}
              </div>
              <Link href="/providers" className="text-xs text-[#2D6A5E] font-medium">{t('showProviders')}</Link>
            </div>
            {topProviders.length > 0 ? (
              <div className="space-y-2">
                {topProviders.map(({ provider: p, distanceKm: d, reasons }) => (
                  <div key={p.id}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-[#E8F3EE] cursor-pointer transition-colors">
                    <div className="w-10 h-10 rounded-full bg-[#E8F3EE] flex items-center justify-center text-sm font-semibold text-[#2D6A5E] flex-shrink-0">
                      {p.avatarInitials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium truncate">{p.name}</span>
                        {p.isChristian && <span className="text-xs">✝️</span>}
                      </div>
                      <div className="text-xs text-gray-400">{p.role} · {d.toFixed(1)}km {language === 'zh' ? '远' : 'away'}</div>
                      <div className="text-xs text-[#4A8C7D]">{reasons[0]}</div>
                    </div>
                    <div className="text-xs font-medium text-amber-600">★ {p.rating}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-gray-400 text-center py-4">
                {language === 'zh' ? '暂无照护员在 ' + location.postcode + ' — 正在招聘中！' : 'No providers yet in ' + location.postcode + ' — recruiting now!'}
                <button onClick={() => setModal('provider')}
                  className="block mx-auto mt-2 text-xs text-[#2D6A5E] font-medium">
                  {t('customerDescription')}
                </button>
              </div>
            )}
          </div>

          <div className="bg-[#E8F3EE] rounded-2xl p-4 border border-[#C8E3D6]">
            <div className="flex justify-between items-start mb-2">
              <div className="text-xs font-medium text-[#1A3F38]">
                {location.suburb} {location.postcode} {language === 'zh' ? '覆盖范围' : 'coverage'}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                nearbyProviders.length >= 5
                  ? 'bg-[#2D6A5E] text-white'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {nearbyProviders.length >= 5 ? language === 'zh' ? '已上线' : 'Live' : language === 'zh' ? '建设中' : 'Building'}
              </span>
            </div>
            <div className="text-sm text-[#2D6A5E] mb-2">
              {nearbyProviders.length} {language === 'zh' ? '位照护员' : 'provider' + (nearbyProviders.length !== 1 ? 's' : '')} {language === 'zh' ? '在15km内' : 'within 15km'}
              {nearbyProviders.length < 5 && ` · ${5 - nearbyProviders.length} ${language === 'zh' ? '即将上线' : 'more to go-live'}`}
            </div>
            <div className="h-1.5 bg-[#C8E3D6] rounded-full overflow-hidden">
              <div className="h-full bg-[#2D6A5E] rounded-full"
                style={{ width: `${Math.min(100, (nearbyProviders.length / 5) * 100)}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setModal('customer')}
              className="flex flex-col items-start p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#2D6A5E] hover:shadow-md transition-all text-left">
              <span className="text-2xl mb-2">👤</span>
              <div className="text-sm font-medium mb-1">{t('customer')}</div>
              <div className="text-xs text-gray-400 leading-relaxed">{t('customerDescription')}</div>
            </button>
            <button onClick={() => setModal('provider')}
              className="flex flex-col items-start p-4 bg-amber-50 rounded-2xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left">
              <span className="text-2xl mb-2">✝️</span>
              <div className="text-sm font-medium mb-1 text-amber-900">{language === 'zh' ? '成为照护员' : 'Join as provider'}</div>
              <div className="text-xs text-amber-700 leading-relaxed">{language === 'zh' ? '受欢迎' : 'Christian carers'} {language === 'zh' ? '' : 'prioritised'}</div>
            </button>
          </div>

          <div className="space-y-1.5">
            {[
              { c:'bg-green-400', msg: language === 'zh' ? `${location.suburb} 中的清洁预订` : `Booking cleaning in ${location.suburb}`, t:'2m', p:true },
              { c:'bg-blue-400',  msg: language === 'zh' ? '完成医院接送服务' : 'Transport completed',                t:'5m', p:false },
              { c:'bg-amber-400', msg: language === 'zh' ? '接受附近的新预订' : 'New booking accepted nearby',              t:'8m', p:false },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-gray-100 text-xs">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${item.c} ${item.p ? 'animate-pulse':''}`} />
                <span className="flex-1 text-gray-500">{item.msg}</span>
                <span className="text-gray-300">{item.t}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="border-t border-gray-100" />
      <section className="max-w-7xl mx-auto px-6 py-10">
        <h2 className="font-serif text-2xl font-semibold mb-1">Book in seconds</h2>
        <p className="text-gray-400 text-sm mb-5">
          {nearbyProviders.length > 0
            ? `${nearbyProviders.length} care workers available near ${location.suburb}`
            : 'Select a service to get started'}
        </p>
        <div className="grid grid-cols-5 gap-3">
          {[
            {ico:'&#127968;',name:'Home Help',    price:'From $35/hr'},
            {ico:'&#129330;',name:'Personal Care',price:'From $55/hr'},
            {ico:'&#128663;',name:'Transport',    price:'From $45/hr'},
            {ico:'&#127842;',name:'Meals',        price:'From $25/meal'},
            {ico:'&#128155;',name:'Companionship',price:'From $40/hr'},
          ].map(s => (
            <Link key={s.name} href="/booking"
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-gray-100 hover:border-[#2D6A5E] hover:shadow-md transition-all group text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 group-hover:bg-[#2D6A5E] flex items-center justify-center text-2xl transition-colors"
                dangerouslySetInnerHTML={{__html: s.ico}} />
              <div className="text-sm font-medium">{s.name}</div>
              <div className="text-xs text-[#2D6A5E] font-medium">{s.price}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="border-t border-gray-100" />
      <section className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex justify-between items-end mb-5">
          <div>
            <h2 className="font-serif text-2xl font-semibold">All services</h2>
            <p className="text-gray-400 text-sm mt-1">GST inclusive · HCP &amp; NDIS · {location.suburb}</p>
          </div>
          <Link href="/services" className="text-sm text-[#2D6A5E] font-medium">View all</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {SERVICES_AU.slice(0,4).map(s => (
            <Link key={s.id} href="/booking"
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all">
              <div className="h-24 flex items-center justify-center text-4xl bg-gray-50">{s.icon}</div>
              <div className="p-3">
                <div className="font-medium text-sm mb-1">{s.name}</div>
                <div className="text-xs text-gray-400 mb-2 leading-relaxed">{s.description}</div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">${s.basePrice}<span className="text-xs text-gray-400 font-normal">/hr</span></span>
                  <span className="text-xs text-amber-600 font-medium">&#9733; {s.rating}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="bg-[#1A3F38] text-white py-14 mt-4">
        <div className="max-w-7xl mx-auto px-6 flex justify-between items-center gap-8 flex-wrap">
          <div>
            <h2 className="font-serif text-3xl font-semibold mb-2">Begin with love today</h2>
            <p className="text-white/60 text-sm max-w-md leading-relaxed">
              Connecting seniors in {location.suburb} with compassionate, vetted care workers.
            </p>
            <blockquote className="font-serif italic text-xs text-white/40 border-l-2 border-white/20 pl-3 mt-3">
              &#34;Whatever you did for one of the least of these, you did for me.&#34; — Matthew 25:40
            </blockquote>
          </div>
          <div className="flex flex-col gap-3">
            <button onClick={() => setModal('customer')}
              className="px-7 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-medium text-sm">
              Register for care
            </button>
            <button onClick={() => setModal('provider')}
              className="px-7 py-3 rounded-xl border border-white/20 text-white/70 hover:text-white text-sm text-center">
              Join as a care provider
            </button>
          </div>
        </div>
      </section>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-[500] flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            {modal === 'provider'
              ? <ProviderRegistration onClose={() => setModal(null)} />
              : <CustomerRegistration  onClose={() => setModal(null)} />
            }
          </div>
        </div>
      )}
    </main>
  )
}
