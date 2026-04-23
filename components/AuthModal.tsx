'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Mail, Lock, User, Phone } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  language?: Language;
}

export default function AuthModal({ isOpen, onClose, onSuccess, language = 'en' }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const t = (key: string) => (translations[language] as any)[key] || key;

  if (!isOpen) return null;

  async function handleSignIn() {
    setLoading(true);
    setError('');

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      // Get user's location
      let userLocation = null;
      try {
        const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (pos) => resolve(pos.coords),
            reject,
            { timeout: 5000, enableHighAccuracy: true }
          );
        });
        userLocation = { latitude: position.latitude, longitude: position.longitude };
      } catch (locationError) {
        console.log('Could not get location during sign-in, will use default');
      }

      // Create/update user profile
      if (data.user) {
        const userData: any = {
          id: data.user.id,
          email: data.user.email,
          full_name: fullName || data.user.email?.split('@')[0],
          phone,
        };

        if (userLocation) {
          userData.latitude = userLocation.latitude;
          userData.longitude = userLocation.longitude;
        }

        await supabase.from('users').upsert(userData);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignUp() {
    setLoading(true);
    setError('');

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
          },
        },
      });

      if (signUpError) throw signUpError;

      // Create user profile
      if (data.user) {
        await supabase.from('users').insert({
          id: data.user.id,
          email: data.user.email,
          full_name: fullName,
          phone,
        });
      }

      setError('Check your email to confirm your account!');
      setTimeout(() => {
        onClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            {mode === 'signin' ? t('signInMode') : t('signUpMode')}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <User className="w-4 h-4" /> {t('fullName')}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t('fullName')}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Mail className="w-4 h-4" /> {t('email')}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <Lock className="w-4 h-4" /> {t('password')}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium mb-2">
                <Phone className="w-4 h-4" /> {t('phone')}
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={mode === 'signin' ? handleSignIn : handleSignUp}
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:bg-gray-400 transition"
          >
            {loading ? 'Loading...' : mode === 'signin' ? t('signInButton') : t('signUpButton')}
          </button>

          <button
            onClick={() => {
              setMode(mode === 'signin' ? 'signup' : 'signin');
              setError('');
            }}
            className="w-full text-green-600 font-medium hover:underline"
          >
            {mode === 'signin' ? `${t('noAccount')} ${t('createAccount')}` : `${t('haveAccount')} ${t('signInMode')}`}
          </button>
        </div>
      </div>
    </div>
  );
}
