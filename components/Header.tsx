'use client';

import { Phone, UserCircle, Bell, Heart, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';
import { translations, Language } from '@/lib/translations';

export default function Header({ user, countryInfo, language = 'en', onSignInClick }: { user: any; countryInfo: any; language?: Language; onSignInClick?: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-xl">SC</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                  SilverConnect
                </h1>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-semibold">
                  {countryInfo.flag} {countryInfo.code}
                </span>
              </div>
              <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                🌍 {t('serviceRegion')}: <span className="font-medium text-gray-700">{countryInfo.name} • {countryInfo.currency}</span>
              </p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <a href="/support" className="flex items-center gap-2 text-gray-600 hover:text-green-600">
              <Phone className="w-4 h-4" />
              <span className="text-sm">{t('support')}</span>
            </a>
            <a href="/emergency" className="flex items-center gap-2 text-red-600">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{t('emergency')}</span>
            </a>
          </div>
          
          <div className="flex items-center gap-3 relative">
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <Bell className="w-5 h-5 text-gray-600" />
            </button>
            
            {user ? (
              <>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-full hover:bg-gray-100 cursor-pointer"
                >
                  <span className="text-sm font-medium">{user.full_name || user.email}</span>
                  <UserCircle className="w-6 h-6 text-gray-600" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-14 w-48 bg-white rounded-lg shadow-lg border z-50">
                    {user.user_type === 'provider' && (
                      <a
                        href="/provider"
                        className="block px-4 py-3 text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <UserCircle className="w-4 h-4" />
                        {t('providerDashboard')}
                      </a>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 flex items-center gap-2 font-medium"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('signOut')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                onClick={onSignInClick}
                className="bg-green-600 text-white px-6 py-2 rounded-full hover:bg-green-700 transition"
              >
                {t('signIn')}
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
