'use client';

import { ChevronDown } from 'lucide-react';

export default function CountrySelector({ selectedCountry, onCountryChange, countries, compact = false }: { selectedCountry: string; onCountryChange: (code: string) => void; countries: any; compact?: boolean }) {
  if (compact) {
    // Compact mobile version - select dropdown
    return (
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="px-2 py-1 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
      >
        {Object.entries(countries).map(([code, info]: [string, any]) => (
          <option key={code} value={code}>
            {info.flag} {info.name}
          </option>
        ))}
      </select>
    );
  }

  // Full desktop version - select dropdown
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs md:text-sm font-medium text-gray-600">Region:</span>
      <select
        value={selectedCountry}
        onChange={(e) => onCountryChange(e.target.value)}
        className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent flex items-center gap-2"
      >
        {Object.entries(countries).map(([code, info]: [string, any]) => (
          <option key={code} value={code}>
            {info.flag} {info.name}
          </option>
        ))}
      </select>
    </div>
  );
}
