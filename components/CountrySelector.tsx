'use client';

import { ChevronDown } from 'lucide-react';

export default function CountrySelector({ selectedCountry, onCountryChange, countries, compact = false }: { selectedCountry: string; onCountryChange: (code: string) => void; countries: any; compact?: boolean }) {
  if (compact) {
    // Compact mobile version - just show flags
    return (
      <div className="flex items-center gap-1">
        {Object.entries(countries).map(([code, info]: [string, any]) => (
          <button
            key={code}
            onClick={() => onCountryChange(code)}
            className={`px-2 py-1 rounded-lg transition-all text-lg ${
              selectedCountry === code
                ? 'bg-green-600 text-white shadow-md scale-110'
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

  // Full desktop version
  return (
    <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
      <div className="flex items-center gap-1 md:gap-2">
        <span className="text-xs md:text-sm font-medium text-gray-600">Region:</span>
        <div className="flex gap-1 md:gap-2">
          {Object.entries(countries).map(([code, info]: [string, any]) => (
            <button
              key={code}
              onClick={() => onCountryChange(code)}
              className={`px-2 md:px-4 py-1 md:py-2 rounded-full transition-all flex items-center gap-1 md:gap-2 text-xs md:text-sm ${
                selectedCountry === code
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{info.flag}</span>
              <span className="hidden sm:inline">{info.name}</span>
              {selectedCountry === code && <ChevronDown className="w-3 h-3 md:w-4 md:h-4" />}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-xs md:text-sm text-gray-500">
        💡 Prices shown include local taxes
      </div>
    </div>
  );
}
