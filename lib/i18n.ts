import en from '@/locales/en.json'
import zhHans from '@/locales/zh-Hans.json'
import zhHant from '@/locales/zh-Hant.json'
import ja from '@/locales/ja.json'
import ko from '@/locales/ko.json'
import th from '@/locales/th.json'
import vi from '@/locales/vi.json'

export type SupportedLanguage = 'en' | 'zh-Hans' | 'zh-Hant' | 'ja' | 'ko' | 'th' | 'vi'

const LOCALES: Record<SupportedLanguage, Record<string, string>> = {
  en,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  ja,
  ko,
  th,
  vi,
}

export const supportedLanguages: SupportedLanguage[] = ['en', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'th', 'vi']

export function normalizeLanguage(value?: string): SupportedLanguage {
  if (!value) return 'en'
  const lower = value.toLowerCase()
  if (lower.startsWith('zh-hant') || lower.startsWith('zh-tw') || lower.startsWith('zh-hk')) return 'zh-Hant'
  if (lower.startsWith('zh-hans') || lower.startsWith('zh-cn') || lower.startsWith('zh')) return 'zh-Hans'
  if (lower.startsWith('ja')) return 'ja'
  if (lower.startsWith('ko')) return 'ko'
  if (lower.startsWith('th')) return 'th'
  if (lower.startsWith('vi')) return 'vi'
  return 'en'
}

export function resolveLanguage(country_code?: string, user_preference?: string, browser_locale?: string): SupportedLanguage {
  if (user_preference && supportedLanguages.includes(user_preference as SupportedLanguage)) {
    return user_preference as SupportedLanguage
  }

  if (country_code === 'CN') return 'zh-Hans'
  if (country_code === 'JP') return 'ja'
  if (country_code === 'KR') return 'ko'
  if (country_code === 'TH') return 'th'
  if (country_code === 'VN') return 'vi'

  const locale = normalizeLanguage(browser_locale)
  if (supportedLanguages.includes(locale)) {
    return locale
  }

  return 'en'
}

export function translate(language: SupportedLanguage, key: string, replacements?: Record<string, string> | string[]): string {
  const locale = LOCALES[language] || LOCALES.en
  let value = locale[key] || LOCALES.en[key] || key

  if (replacements) {
    if (Array.isArray(replacements)) {
      replacements.forEach((replacement, index) => {
        value = value.replace(new RegExp(`\\{${index}\\}`, 'g'), replacement)
      })
    } else {
      Object.entries(replacements).forEach(([token, replacement]) => {
        value = value.replace(new RegExp(`\\{${token}\\}`, 'g'), replacement)
      })
    }
  }

  return value
}
