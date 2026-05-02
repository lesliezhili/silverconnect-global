'use client'

import { useState, useEffect } from 'react'
import { Globe } from 'lucide-react'

interface Language {
  code: string
  name: string
  flag: string
}

const supportedLanguages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'zh-Hans', name: '简体中文', flag: '🇨🇳' },
  { code: 'zh-Hant', name: '繁體中文', flag: '🇹🇼' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'th', name: 'ไทย', flag: '🇹🇭' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
]

interface LanguageSelectorProps {
  value?: string
  onChange?: (value: string) => void
  className?: string
}

export default function LanguageSelector({ 
  value = 'en', 
  onChange, 
  className = '' 
}: LanguageSelectorProps) {
  const [selectedLanguage, setSelectedLanguage] = useState(value)

  useEffect(() => {
    setSelectedLanguage(value)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newValue = e.target.value
    setSelectedLanguage(newValue)
    if (onChange) {
      onChange(newValue)
    }
  }

  return (
    <div className="relative inline-block">
      <select
        value={selectedLanguage}
        onChange={handleChange}
        className={`appearance-none bg-white border border-gray-200 rounded-lg px-8 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent cursor-pointer ${className}`}
        style={{ boxShadow: 'none' }}
      >
        {supportedLanguages.map((lang) => (
          <option key={lang.code} value={lang.code}>
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      <Globe className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
    </div>
  )
}