'use client';

import { Language } from '@/lib/translations';

const languageOptions: Record<Language, { name: string; label: string }> = {
  en: { name: 'English', label: 'EN' },
  zh: { name: '中文', label: '中文' }
};

export default function LanguageSelector({
  language,
  onLanguageChange,
  compact = false
}: {
  language: Language;
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}) {
  // Only support English and Chinese as requested
  const supportedLanguages: Language[] = ['en', 'zh'];

  if (compact) {
    return (
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {supportedLanguages.map((code) => {
          const info = languageOptions[code];
          return (
            <option key={code} value={code}>
              {info.label}
            </option>
          );
        })}
      </select>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs md:text-sm font-medium text-gray-600">Lang:</span>
      <select
        value={language}
        onChange={(e) => onLanguageChange(e.target.value as Language)}
        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {supportedLanguages.map((code) => {
          const info = languageOptions[code];
          return (
            <option key={code} value={code}>
              {info.name}
            </option>
          );
        })}
      </select>
    </div>
  );
}
