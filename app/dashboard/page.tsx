'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
  Calendar, Clock, Star, MapPin, Phone, Mail, 
  Settings, CreditCard, Heart, Bell, ChevronRight,
  Home, User, BookOpen, MessageCircle
} from 'lucide-react';

interface CustomerProfile {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  country_code: string;
  city: string;
  address: string;
  postal_code: string;
  birth_date: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_notes: string;
  preferred_language: string;
  profile_image: string;
  created_at: string;
}

interface Booking {
  id: string;
  service_name: string;
  provider_name: string;
  booking_date: string;
  booking_time: string;
  status: string;
  amount: number;
}

export default function CustomerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadCustomerData();
  }, []);

  async function loadCustomerData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/?signin=true');
        return;
      }

      // Load profile
      const { data: profileData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .eq('user_type', 'customer')
        .maybeSingle();

      setProfile(profileData);

      // Load recent bookings
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          amount,
          services:service_id(name),
          service_providers:provider_id(full_name)
        `)
        .eq('user_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(5);

      if (bookingsData) {
        setBookings(bookingsData.map((b: any) => ({
          id: b.id,
          service_name: b.services?.name || 'Service',
          provider_name: b.service_providers?.full_name || 'Provider',
          booking_date: b.booking_date,
          booking_time: b.booking_time,
          status: b.status,
          amount: b.amount,
        })));
      }
    } catch (error) {
      console.error('Error loading customer data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed').length, icon: Clock, color: 'bg-green-500' },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: Star, color: 'bg-amber-500' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              {profile?.profile_image ? (
                <img src={profile.profile_image} alt="" className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <User className="w-8 h-8" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{profile?.full_name || 'Customer'}</h1>
              <p className="text-white/80 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {profile?.city}, {profile?.postal_code}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl p-4 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 ${stat.color} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-gray-500 text-sm">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex gap-2 border-b border-gray-200 pb-2">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'bookings', label: 'My Bookings', icon: BookOpen },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'preferences', label: 'Preferences', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id 
                  ? 'bg-green-100 text-green-700' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Recent Bookings</h2>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="text-green-600 text-sm hover:underline"
                >
                  View all
                </button>
              </div>
              {bookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No bookings yet</p>
                  <button 
                    onClick={() => router.push('/providers')}
                    className="mt-2 text-green-600 hover:underline text-sm"
                  >
                    Book a service
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {bookings.slice(0, 3).map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-sm text-gray-500">{booking.provider_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {new Date(booking.booking_date).toLocaleDateString()}
                        </p>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/providers')}
                  className="w-full flex items-center justify-between p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Book a Service</p>
                      <p className="text-sm text-gray-600">Find care workers near you</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/bookings')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">View All Bookings</p>
                      <p className="text-sm text-gray-600">Manage your appointments</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>

                <button 
                  onClick={() => router.push('/support')}
                  className="w-full flex items-center justify-between p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Get Support</p>
                      <p className="text-sm text-gray-600">Chat with our team</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">All Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No bookings yet</p>
                <button 
                  onClick={() => router.push('/providers')}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Book Your First Service
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-sm text-gray-500">with {booking.provider_name}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${booking.amount}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(booking.booking_date).toLocaleDateString()} at {booking.booking_time}
                      </p>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Profile Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                <p className="font-medium">{profile?.full_name || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone</label>
                <p className="font-medium">{profile?.phone || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date of Birth</label>
                <p className="font-medium">{profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Address</label>
                <p className="font-medium">{profile?.address || 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">City & Postal Code</label>
                <p className="font-medium">{profile?.city}, {profile?.postal_code}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Emergency Contact</label>
                <p className="font-medium">{profile?.emergency_contact_name || 'Not set'} ({profile?.emergency_contact_phone || 'N/A'})</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Preferred Language</label>
                <p className="font-medium">{profile?.preferred_language || 'English'}</p>
              </div>
            </div>
            <div className="mt-6 pt-6 border-t border-gray-200">
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Edit Profile
              </button>
            </div>
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Preferences</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Preferred Language</label>
                <select 
                  className="w-full md:w-64 p-2 border border-gray-300 rounded-lg"
                  value={profile?.preferred_language || 'en'}
                >
                  <option value="en">English</option>
                  <option value="zh">中文 (Chinese)</option>
                  <option value="vi">Tiếng Việt (Vietnamese)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Medical Notes</label>
                <textarea 
                  className="w-full p-3 border border-gray-300 rounded-lg h-24"
                  placeholder="Any medical conditions or notes for care workers..."
                  value={profile?.medical_notes || ''}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Emergency Contact</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text"
                    placeholder="Contact name"
                    className="p-2 border border-gray-300 rounded-lg"
                    value={profile?.emergency_contact_name || ''}
                  />
                  <input 
                    type="tel"
                    placeholder="Contact phone"
                    className="p-2 border border-gray-300 rounded-lg"
                    value={profile?.emergency_contact_phone || ''}
                  />
                </div>
              </div>
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}