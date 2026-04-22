'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Settings, Users, DollarSign, AlertTriangle, TrendingUp } from 'lucide-react';
import { translations, Language } from '@/lib/translations';

interface AdminDashboardProps {
  user: any;
  language?: Language;
}

export default function AdminDashboard({ user, language = 'en' }: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'services' | 'disputes' | 'analytics'>('overview');
  const [services, setServices] = useState<any[]>([]);
  const [disputes, setDisputes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  const t = (key: string) => translations[language][key as keyof typeof translations.en] || key;

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .order('category', { ascending: true });

      setServices(servicesData || []);

      // Load disputes
      const { data: disputesData } = await supabase
        .from('disputes')
        .select(`
          *,
          users (full_name),
          bookings (
            services (name),
            service_providers (full_name)
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      setDisputes(disputesData || []);

      // Load stats
      const [
        { count: totalBookings },
        { count: totalUsers },
        { count: totalProviders },
        { data: revenueData }
      ] = await Promise.all([
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('users').select('*', { count: 'exact', head: true }),
        supabase.from('service_providers').select('*', { count: 'exact', head: true }),
        supabase.from('payment_transactions').select('amount').eq('status', 'succeeded')
      ]);

      const totalRevenue = revenueData?.reduce((sum, tx) => sum + (tx.amount || 0), 0) || 0;

      setStats({
        totalBookings,
        totalUsers,
        totalProviders,
        totalRevenue,
        openDisputes: disputesData?.length || 0,
      });
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function updateServiceStatus(serviceId: string, isActive: boolean) {
    try {
      await supabase
        .from('services')
        .update({ is_active: isActive })
        .eq('id', serviceId);

      setServices(services.map(s =>
        s.id === serviceId ? { ...s, is_active: isActive } : s
      ));
    } catch (error) {
      console.error('Error updating service:', error);
      alert('Failed to update service');
    }
  }

  async function resolveDispute(disputeId: string, resolution: string) {
    try {
      await supabase
        .from('disputes')
        .update({
          status: 'resolved',
          resolution,
          resolved_by: user.id,
          resolved_at: new Date().toISOString(),
        })
        .eq('id', disputeId);

      setDisputes(disputes.filter(d => d.id !== disputeId));
    } catch (error) {
      console.error('Error resolving dispute:', error);
      alert('Failed to resolve dispute');
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('adminDashboard')}
        </h1>
        <p className="text-gray-600">
          {t('managePlatform')}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('totalUsers')}</p>
              <p className="text-2xl font-bold">{stats.totalUsers || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-green-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('totalProviders')}</p>
              <p className="text-2xl font-bold">{stats.totalProviders || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('totalBookings')}</p>
              <p className="text-2xl font-bold">{stats.totalBookings || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-yellow-500 mr-3" />
            <div>
              <p className="text-sm text-gray-600">{t('totalRevenue')}</p>
              <p className="text-2xl font-bold">${stats.totalRevenue?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'overview', label: t('overview'), count: null },
              { key: 'services', label: t('services'), count: services.length },
              { key: 'disputes', label: t('disputes'), count: stats.openDisputes },
              { key: 'analytics', label: t('analytics'), count: null },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label} {tab.count !== null && `(${tab.count})`}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">{t('recentActivity')}</h3>
            <div className="text-gray-500 text-center py-8">
              {t('activityComingSoon')}
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">{t('systemHealth')}</h3>
            <div className="text-gray-500 text-center py-8">
              {t('healthComingSoon')}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'services' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('manageServices')}</h3>
            <div className="space-y-4">
              {services.map((service) => (
                <div key={service.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.description}</p>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                      {service.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded text-xs ${
                      service.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {service.is_active ? t('active') : t('inactive')}
                    </span>
                    <button
                      onClick={() => updateServiceStatus(service.id, !service.is_active)}
                      className={`px-3 py-1 rounded text-sm ${
                        service.is_active
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {service.is_active ? t('deactivate') : t('activate')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'disputes' && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">{t('openDisputes')}</h3>
            {disputes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('noOpenDisputes')}
              </div>
            ) : (
              <div className="space-y-4">
                {disputes.map((dispute) => (
                  <div key={dispute.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-medium">
                          {dispute.bookings?.services?.name} - {dispute.users?.full_name}
                        </h4>
                        <p className="text-sm text-gray-600">{dispute.reason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(dispute.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                        {dispute.status}
                      </span>
                    </div>
                    {dispute.description && (
                      <p className="text-sm text-gray-700 mb-3">{dispute.description}</p>
                    )}
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const resolution = prompt('Enter resolution:');
                          if (resolution) resolveDispute(dispute.id, resolution);
                        }}
                        className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                      >
                        {t('resolve')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-semibold mb-4">{t('analytics')}</h3>
          <div className="text-gray-500 text-center py-8">
            {t('analyticsComingSoon')}
          </div>
        </div>
      )}
    </div>
  );
}