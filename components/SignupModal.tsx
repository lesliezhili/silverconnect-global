'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { translations, Language } from '@/lib/translations';

interface SignupModalProps {
  isOpen: boolean;
  onClose: () => void;
  country: string;
  language: Language;
}

export default function SignupModal({ isOpen, onClose, country, language }: SignupModalProps) {
  const [signupType, setSignupType] = useState<'customer' | 'provider' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    phone: '',
    // Provider-specific fields
    bio: '',
    yearsExperience: '',
    specialties: [] as string[],
  });

  const t = (key: string) => (translations[language] as any)[key] || key;

  if (!isOpen) return null;

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Get geolocation
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve(pos.coords),
          reject
        );
      });

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create user profile
      const { error: userError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        phone: formData.phone,
        user_type: signupType,
        country_code: country,
        latitude: position.latitude,
        longitude: position.longitude,
      });

      if (userError) throw userError;

      // If service provider, create provider profile
      if (signupType === 'provider') {
        const { error: providerError } = await supabase.from('service_providers').insert({
          user_id: authData.user.id,
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone,
          country_code: country,
          bio: formData.bio,
          years_experience: parseInt(formData.yearsExperience) || 0,
          specialties: formData.specialties,
          latitude: position.latitude,
          longitude: position.longitude,
          rating: 5.0,
        });

        if (providerError) throw providerError;
      }

      // Close modal and trigger refresh
      onClose();
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{t('createAccount')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {!signupType ? (
          <div className="space-y-4">
            <p className="text-gray-600 mb-6">{t('selectAccountType')}</p>
            <button
              onClick={() => setSignupType('customer')}
              className="w-full p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition text-left"
            >
              <div className="font-bold text-blue-600">{t('customer')}</div>
              <div className="text-sm text-gray-600">{t('customerDescription')}</div>
            </button>
            <button
              onClick={() => setSignupType('provider')}
              className="w-full p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition text-left"
            >
              <div className="font-bold text-green-600">{t('serviceProvider')}</div>
              <div className="text-sm text-gray-600">{t('providerDescription')}</div>
            </button>
          </div>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <button
              type="button"
              onClick={() => setSignupType(null)}
              className="text-blue-600 mb-4"
            >
              ← {t('back')}
            </button>

            {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
            )}

            <input
              type="email"
              placeholder={t('email')}
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="password"
              placeholder={t('password')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="text"
              placeholder={t('fullName')}
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="tel"
              placeholder={t('phone')}
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            {signupType === 'provider' && (
              <>
                <textarea
                  placeholder={t('bio')}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />

                <input
                  type="number"
                  placeholder={t('yearsExperience')}
                  value={formData.yearsExperience}
                  onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              {loading ? t('loading') : t('signUp')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
