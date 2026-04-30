'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Clock, DollarSign, Star, User, Settings, 
  Briefcase, Award, MapPin, Phone, Mail, Edit, Save, X,
  Home, BookOpen, MessageCircle, CreditCard, Shield, CheckCircle
} from 'lucide-react'
import ProviderAvailability from '@/components/ProviderAvailability'

interface ProviderProfile {
  id: string
  full_name: string
  email: string
  phone: string
  bio: string
  city: string
  address: string
  postal_code: string
  specialties: string[]
  years_experience: number
  certifications: string[]
  rating: number
  total_ratings: number
  is_verified: boolean
  is_christian: boolean
  profile_image: string
}

interface Booking {
  id: string
  booking_number: string
  customer_name: string
  service_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
}

export default function ProviderDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProviderProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'availability' | 'profile' | 'earnings'>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<ProviderProfile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadProviderData()
  }, [])

  const loadProviderData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/?signin=true')
        return
      }

      const { data: provider } = await supabase
        .from('service_providers')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (!provider) {
        router.push('/')
        return
      }

      setProfile(provider)
      setEditForm(provider)

      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          id,
          booking_number,
          booking_date,
          start_time,
          end_time,
          status,
          total_price,
          customer:customer_id(full_name),
          service:service_id(name)
        `)
        .eq('provider_id', provider.id)
        .order('booking_date', { ascending: false })
        .limit(10)

      if (bookingsData) {
        setBookings(bookingsData.map((b: any) => ({
          id: b.id,
          booking_number: b.booking_number,
          customer_name: b.customer?.full_name || 'Customer',
          service_name: b.service?.name || 'Service',
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          total_price: b.total_price
        })))
      }
    } catch (error) {
      console.error('Error loading provider data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('service_providers')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          bio: editForm.bio,
          city: editForm.city,
          address: editForm.address,
          postal_code: editForm.postal_code,
        })
        .eq('id', profile?.id)

      if (error) throw error

      setProfile(prev => ({ ...prev!, ...editForm }))
      setEditing(false)
      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const updateBookingStatus = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)

      if (error) throw error
      await loadProviderData()
    } catch (error) {
      console.error('Error updating booking:', error)
    }
  }

  const formatTimeRange = (start: string, end: string) => {
    if (!start) return 'Time TBD'
    if (!end) return start
    return `${start} – ${end}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  const stats = [
    { label: 'Total Bookings', value: bookings.length, icon: Calendar, color: 'bg-blue-500' },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: CheckCircle, color: 'bg-green-500' },
    { label: 'Rating', value: profile?.rating?.toFixed(1) || '5.0', icon: Star, color: 'bg-amber-500' },
    { label: 'Revenue', value: `$${bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)}`, icon: DollarSign, color: 'bg-purple-500' },
  ]

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 5)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header - Same as customer dashboard */}
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
              <h1 className="text-2xl font-bold">{profile?.full_name}</h1>
              <p className="text-white/80 flex items-center gap-2">
                <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                {profile?.rating} ({profile?.total_ratings} reviews)
                {profile?.is_verified && <span className="ml-2 px-2 py-0.5 bg-green-500 rounded-full text-xs">Verified</span>}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats - Same as customer dashboard */}
      <div className="max-w-7xl mx-auto px-4 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Navigation Tabs - Provider specific */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'bookings', label: 'Bookings', icon: BookOpen },
            { id: 'availability', label: 'Availability', icon: Clock },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'earnings', label: 'Earnings', icon: DollarSign },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
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
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Upcoming Bookings</h2>
                <button onClick={() => setActiveTab('bookings')} className="text-green-600 text-sm hover:underline">
                  View all
                </button>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming bookings</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-sm text-gray-500">with {booking.customer_name}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {booking.booking_date} • {formatTimeRange(booking.start_time, booking.end_time)}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
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

            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Quick Stats</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Services Offered</span>
                  <span className="font-semibold">{profile?.specialties?.length || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Years Experience</span>
                  <span className="font-semibold">{profile?.years_experience || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Certifications</span>
                  <span className="font-semibold">{profile?.certifications?.length || 0}</span>
                </div>
                <button
                  onClick={() => setActiveTab('availability')}
                  className="w-full mt-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Manage Availability
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">All Bookings</h2>
            {bookings.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No bookings yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.service_name}</p>
                      <p className="text-sm text-gray-500">{booking.customer_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.booking_date} • {formatTimeRange(booking.start_time, booking.end_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${booking.total_price}</p>
                      <select
                        value={booking.status}
                        onChange={(e) => updateBookingStatus(booking.id, e.target.value)}
                        className={`mt-2 text-xs px-2 py-1 rounded-full border ${
                          booking.status === 'confirmed' ? 'bg-green-100 text-green-700 border-green-200' :
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-gray-100 text-gray-700 border-gray-200'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirm</option>
                        <option value="completed">Complete</option>
                        <option value="cancelled">Cancel</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Availability Tab */}
        {activeTab === 'availability' && profile && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <ProviderAvailability 
              providerId={profile.id}
              editable={true}
              onSave={() => alert('Availability updated successfully!')}
            />
          </div>
        )}

        {/* Profile Tab - Similar to customer but with provider fields */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Profile Information</h2>
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-green-600 hover:text-green-700">
                  <Edit className="w-4 h-4" /> Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => { setEditing(false); setEditForm(profile || {}); }} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
                    <X className="w-4 h-4" /> Cancel
                  </button>
                  <button onClick={updateProfile} disabled={saving} className="flex items-center gap-1 text-green-600 hover:text-green-700">
                    <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div><label className="block text-sm text-gray-500 mb-1">Full Name</label>{editing ? <input type="text" value={editForm.full_name || ''} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full p-2 border rounded-lg" /> : <p className="font-medium">{profile?.full_name}</p>}</div>
              <div><label className="block text-sm text-gray-500 mb-1">Email</label><p className="font-medium">{profile?.email}</p></div>
              <div><label className="block text-sm text-gray-500 mb-1">Phone</label>{editing ? <input type="tel" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full p-2 border rounded-lg" /> : <p className="font-medium">{profile?.phone}</p>}</div>
              <div><label className="block text-sm text-gray-500 mb-1">Location</label>{editing ? <div className="flex gap-2"><input type="text" value={editForm.city || ''} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })} placeholder="City" className="flex-1 p-2 border rounded-lg" /><input type="text" value={editForm.postal_code || ''} onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })} placeholder="Postcode" className="w-24 p-2 border rounded-lg" /></div> : <p className="font-medium">{profile?.city}, {profile?.postal_code}</p>}</div>
              <div className="md:col-span-2"><label className="block text-sm text-gray-500 mb-1">Bio</label>{editing ? <textarea value={editForm.bio || ''} onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })} rows={3} className="w-full p-2 border rounded-lg" /> : <p className="font-medium">{profile?.bio || 'No bio provided'}</p>}</div>
              <div><label className="block text-sm text-gray-500 mb-1">Services</label><div className="flex flex-wrap gap-2">{profile?.specialties?.map(s => <span key={s} className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">{s}</span>)}</div></div>
              <div><label className="block text-sm text-gray-500 mb-1">Certifications</label><div className="flex flex-wrap gap-2">{profile?.certifications?.map(c => <span key={c} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">{c}</span>)}</div></div>
            </div>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === 'earnings' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Earnings Overview</h2>
            <div className="text-center py-12 text-gray-500">
              <DollarSign className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">Earnings feature coming soon</p>
              <p className="text-sm">You'll be able to track your payouts here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}