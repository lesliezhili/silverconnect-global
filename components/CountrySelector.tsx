'use client';

import { ChevronDown } from 'lucide-react';

export default function CountrySelector({ selectedCountry, onCountryChange, countries }: { selectedCountry: string; onCountryChange: (code: string) => void; countries: any }) {
  return (
    <div className="flex items-center justify-between flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-600">Service Region:</span>
        <div className="flex gap-2">
          {Object.entries(countries).map(([code, info]: [string, any]) => (
            <button
              key={code}
              onClick={() => onCountryChange(code)}
              className={`px-4 py-2 rounded-full transition-all flex items-center gap-2 ${
                selectedCountry === code
                  ? 'bg-green-600 text-white shadow-md'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <span>{info.flag}</span>
              <span>{info.name}</span>
              {selectedCountry === code && <ChevronDown className="w-4 h-4" />}
            </button>
          ))}
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        💡 Prices shown include local taxes
      </div>
    </div>
  );
}
