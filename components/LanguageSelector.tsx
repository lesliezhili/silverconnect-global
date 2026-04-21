'use client';

import { Language } from '@/lib/translations';

export default function LanguageSelector({ 
  language, 
  onLanguageChange, 
  compact = false 
}: { 
  language: Language; 
  onLanguageChange: (lang: Language) => void;
  compact?: boolean;
}) {
  const languages = {
    en: { name: 'English', flag: '🇬🇧' },
    zh: { name: '中文', flag: '🇨🇳' }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {(Object.entries(languages) as Array<[Language, any]>).map(([code, info]) => (
          <button
            key={code}
            onClick={() => onLanguageChange(code)}
            className={`px-2 py-1 rounded-lg transition-all text-sm font-medium ${
              language === code
                ? 'bg-blue-600 text-white shadow-md scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            title={info.name}
          >
            {info.flag}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs md:text-sm font-medium text-gray-600">Lang:</span>
      <div className="flex gap-1 md:gap-2">
        {(Object.entries(languages) as Array<[Language, any]>).map(([code, info]) => (
          <button
            key={code}
            onClick={() => onLanguageChange(code)}
            className={`px-2 md:px-3 py-1 rounded-full transition-all text-xs md:text-sm ${
              language === code
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="hidden sm:inline">{info.name}</span>
            <span className="sm:hidden">{info.flag}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
