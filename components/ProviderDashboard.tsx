'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { translations, Language } from '@/lib/translations';
import { User, Settings, Calendar, DollarSign, Star, MapPin } from 'lucide-react';

interface ProviderDashboardProps {
  user: any;
  language: Language;
}

interface Service {
  id: string;
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
}

interface ProviderService {
  service_id: string;
  service: Service;
  custom_price?: number;
  is_offered: boolean;
}

export default function ProviderDashboard({ user, language }: ProviderDashboardProps) {
  const [provider, setProvider] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'profile' | 'services' | 'bookings' | 'availability' | 'earnings'>('profile');
  const [saving, setSaving] = useState(false);

  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  useEffect(() => {
    if (user) {
      fetchProviderData();
      fetchServices();
      loadBookings();
    }
  }, [user]);

  async function fetchProviderData() {
    try {
      const { data: providerData } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProvider(providerData);
    } catch (error) {
      console.error('Error fetching provider data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchServices() {
    try {
      const { data } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('category', { ascending: true });

      setServices(data || []);

      // Fetch provider's current service offerings
      if (user) {
        const { data: providerPricing } = await supabase
          .from('provider_pricing')
          .select('*, services(*)')
          .eq('provider_id', user.id);

        const providerServiceMap = new Map();
        providerPricing?.forEach(item => {
          providerServiceMap.set(item.service_id, {
            service_id: item.service_id,
            service: item.services,
            custom_price: item.custom_price,
            is_offered: true
          });
        });

        const allProviderServices = data?.map(service => ({
          service_id: service.id,
          service,
          custom_price: providerServiceMap.get(service.id)?.custom_price,
          is_offered: providerServiceMap.has(service.id)
        })) || [];

        setProviderServices(allProviderServices);
      }
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  }

  async function loadBookings() {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          users (
            full_name,
            phone,
            email
          ),
          services (
            name,
            description,
            duration_minutes
          )
        `)
        .eq('provider_id', user.id)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      console.error('Error loading bookings:', err);
    }
  }

  async function updateBookingStatus(bookingId: string, status: string) {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId);

      if (error) throw error;

      // Log status change
      await supabase.from('booking_status_history').insert({
        booking_id: bookingId,
        old_status: bookings.find(b => b.id === bookingId)?.status,
        new_status: status,
        changed_by: user.id,
      });

      // Reload bookings
      await loadBookings();
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert(language === 'zh' ? '更新预约状态失败' : 'Failed to update booking status');
    }
  }

  async function updateProviderServices() {
    if (!user) return;

    setSaving(true);
    try {
      // Delete existing provider pricing
      await supabase
        .from('provider_pricing')
        .delete()
        .eq('provider_id', user.id);

      // Insert new provider pricing for offered services
      const servicesToInsert = providerServices
        .filter(ps => ps.is_offered)
        .map(ps => ({
          provider_id: user.id,
          service_id: ps.service_id,
          country_code: provider?.country_code || 'AU',
          custom_price: ps.custom_price
        }));

      if (servicesToInsert.length > 0) {
        await supabase
          .from('provider_pricing')
          .insert(servicesToInsert);
      }

      alert(language === 'zh' ? '服务设置已保存！' : 'Services saved successfully!');
    } catch (error) {
      console.error('Error updating services:', error);
      alert(language === 'zh' ? '保存失败，请重试' : 'Failed to save services');
    } finally {
      setSaving(false);
    }
  }

  async function updateProviderProfile(updates: any) {
    if (!user) return;

    setSaving(true);
    try {
      await supabase
        .from('service_providers')
        .update(updates)
        .eq('user_id', user.id);

      setProvider({ ...provider, ...updates });
      alert(language === 'zh' ? '个人资料已更新！' : 'Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert(language === 'zh' ? '更新失败，请重试' : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">
              {language === 'zh' ? '提供商资料未找到' : 'Provider Profile Not Found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {language === 'zh' ? '请联系支持团队设置您的提供商账户。' : 'Please contact support to set up your provider account.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {language === 'zh' ? '提供商控制面板' : 'Provider Dashboard'}
              </h1>
              <p className="text-gray-600 mt-1">
                {language === 'zh' ? '管理您的服务和预约' : 'Manage your services and bookings'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="font-semibold">{provider.full_name}</div>
                <div className="text-sm text-gray-500 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {provider.rating?.toFixed(1) || '5.0'} ({provider.total_ratings || 0})
                </div>
              </div>
              {provider.profile_image ? (
                <img
                  src={provider.profile_image}
                  alt={provider.full_name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {provider.full_name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="border-b">
            <nav className="flex">
              {[
                { id: 'profile', label: language === 'zh' ? '个人资料' : 'Profile', icon: User },
                { id: 'services', label: language === 'zh' ? '服务设置' : 'Services', icon: Settings },
                { id: 'bookings', label: language === 'zh' ? '预约管理' : 'Bookings', icon: Calendar },
                { id: 'availability', label: language === 'zh' ? '可用时间' : 'Availability', icon: Calendar },
                { id: 'earnings', label: language === 'zh' ? '收入统计' : 'Earnings', icon: DollarSign },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{language === 'zh' ? '个人资料' : 'Profile Information'}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '简介' : 'Bio'}
                    </label>
                    <textarea
                      value={provider.bio || ''}
                      onChange={(e) => setProvider({ ...provider, bio: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      rows={4}
                      placeholder={language === 'zh' ? '描述您的服务经验和专长...' : 'Describe your experience and specialties...'}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '经验年限' : 'Years of Experience'}
                    </label>
                    <input
                      type="number"
                      value={provider.years_experience || ''}
                      onChange={(e) => setProvider({ ...provider, years_experience: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '城市' : 'City'}
                    </label>
                    <input
                      type="text"
                      value={provider.city || ''}
                      onChange={(e) => setProvider({ ...provider, city: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {language === 'zh' ? '地址' : 'Address'}
                    </label>
                    <input
                      type="text"
                      value={provider.address || ''}
                      onChange={(e) => setProvider({ ...provider, address: e.target.value })}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={() => updateProviderProfile({
                      bio: provider.bio,
                      years_experience: provider.years_experience,
                      city: provider.city,
                      address: provider.address
                    })}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {saving ? (language === 'zh' ? '保存中...' : 'Saving...') : (language === 'zh' ? '保存资料' : 'Save Profile')}
                  </button>
                </div>
              </div>
            )}

            {/* Services Tab */}
            {activeTab === 'services' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-bold">{language === 'zh' ? '服务设置' : 'Service Offerings'}</h2>
                  <button
                    onClick={updateProviderServices}
                    disabled={saving}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                  >
                    {saving ? (language === 'zh' ? '保存中...' : 'Saving...') : (language === 'zh' ? '保存服务' : 'Save Services')}
                  </button>
                </div>

                <div className="space-y-4">
                  {providerServices.map((ps) => (
                    <div key={ps.service_id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              type="checkbox"
                              checked={ps.is_offered}
                              onChange={(e) => {
                                const updated = providerServices.map(s =>
                                  s.service_id === ps.service_id
                                    ? { ...s, is_offered: e.target.checked }
                                    : s
                                );
                                setProviderServices(updated);
                              }}
                              className="rounded"
                            />
                            <h3 className="font-semibold">{ps.service.name}</h3>
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {ps.service.category}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{ps.service.description}</p>
                          <p className="text-xs text-gray-500">
                            {language === 'zh' ? '时长' : 'Duration'}: {ps.service.duration_minutes} {language === 'zh' ? '分钟' : 'minutes'}
                          </p>
                        </div>

                        {ps.is_offered && (
                          <div className="ml-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {language === 'zh' ? '自定义价格 (可选)' : 'Custom Price (Optional)'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={ps.custom_price || ''}
                              onChange={(e) => {
                                const updated = providerServices.map(s =>
                                  s.service_id === ps.service_id
                                    ? { ...s, custom_price: e.target.value ? parseFloat(e.target.value) : undefined }
                                    : s
                                );
                                setProviderServices(updated);
                              }}
                              className="w-24 px-2 py-1 border rounded text-sm"
                              placeholder={language === 'zh' ? '默认价格' : 'Default'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bookings Tab */}
            {activeTab === 'bookings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{language === 'zh' ? '预约管理' : 'Booking Management'}</h2>

                {/* Booking Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {bookings.filter(b => b.status === 'PENDING').length}
                    </div>
                    <div className="text-sm text-yellow-800">
                      {language === 'zh' ? '待确认' : 'Pending'}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {bookings.filter(b => b.status === 'CONFIRMED').length}
                    </div>
                    <div className="text-sm text-blue-800">
                      {language === 'zh' ? '已确认' : 'Confirmed'}
                    </div>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {bookings.filter(b => b.status === 'COMPLETED').length}
                    </div>
                    <div className="text-sm text-green-800">
                      {language === 'zh' ? '已完成' : 'Completed'}
                    </div>
                  </div>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">
                      {bookings.filter(b => b.status === 'CANCELLED').length}
                    </div>
                    <div className="text-sm text-red-800">
                      {language === 'zh' ? '已取消' : 'Cancelled'}
                    </div>
                  </div>
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                  {bookings.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {language === 'zh' ? '暂无预约' : 'No bookings found'}
                    </div>
                  ) : (
                    bookings.map((booking) => (
                      <div key={booking.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="font-semibold text-lg">{booking.services?.name}</h3>
                            <p className="text-gray-600 text-sm">{booking.services?.description}</p>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            booking.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '客户' : 'Client'}:</strong> {booking.users?.full_name}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '电话' : 'Phone'}:</strong> {booking.users?.phone}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '地址' : 'Address'}:</strong> {booking.address}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '日期' : 'Date'}:</strong> {new Date(booking.booking_date).toLocaleDateString()}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '时间' : 'Time'}:</strong> {booking.booking_time}
                            </p>
                            <p className="text-sm text-gray-600">
                              <strong>{language === 'zh' ? '价格' : 'Price'}:</strong> {provider?.country_code === 'CN' ? '¥' : '$'}{booking.total_price}
                            </p>
                          </div>
                        </div>

                        {booking.special_instructions && (
                          <div className="mb-3 p-2 bg-gray-50 rounded">
                            <p className="text-sm text-gray-700">
                              <strong>{language === 'zh' ? '特殊要求' : 'Special Instructions'}:</strong> {booking.special_instructions}
                            </p>
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          {booking.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'CONFIRMED')}
                                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                              >
                                {language === 'zh' ? '接受' : 'Accept'}
                              </button>
                              <button
                                onClick={() => updateBookingStatus(booking.id, 'CANCELLED')}
                                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 text-sm"
                              >
                                {language === 'zh' ? '拒绝' : 'Decline'}
                              </button>
                            </>
                          )}
                          {booking.status === 'CONFIRMED' && (
                            <button
                              onClick={() => updateBookingStatus(booking.id, 'COMPLETED')}
                              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 text-sm"
                            >
                              {language === 'zh' ? '标记完成' : 'Mark Complete'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Availability Tab */}
            {activeTab === 'availability' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{language === 'zh' ? '可用时间设置' : 'Availability Settings'}</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    {language === 'zh' ? '可用时间设置功能即将推出。' : 'Availability settings coming soon.'}
                  </p>
                </div>
              </div>
            )}

            {/* Earnings Tab */}
            {activeTab === 'earnings' && (
              <div className="space-y-6">
                <h2 className="text-xl font-bold">{language === 'zh' ? '收入统计' : 'Earnings Overview'}</h2>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <p className="text-yellow-800">
                    {language === 'zh' ? '收入统计功能即将推出。' : 'Earnings overview coming soon.'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
