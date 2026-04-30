'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { 
  Calendar, Clock, DollarSign, Star, User, Settings, 
  Heart, Bell, MapPin, Phone, Mail, Edit, Save, X,
  Home, BookOpen, MessageCircle, CreditCard, Shield
} from 'lucide-react'

interface CustomerProfile {
  id: string
  full_name: string
  email: string
  phone: string
  address: string
  city: string
  postal_code: string
  birth_date: string
  emergency_contact_name: string
  emergency_contact_phone: string
  medical_notes: string
  preferred_language: string
  profile_image: string
}

interface Booking {
  id: string
  booking_number: string
  provider_name: string
  service_name: string
  booking_date: string
  start_time: string
  end_time: string
  status: string
  total_price: number
}

export default function CustomerDashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<CustomerProfile | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'profile' | 'favorites' | 'payments'>('overview')
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<Partial<CustomerProfile>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadCustomerData()
  }, [])

  const loadCustomerData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/?signin=true')
        return
      }

      // Load customer profile
      const { data: customer } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      setProfile(customer)
      setEditForm(customer || {})

      // Load bookings
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
          provider:provider_id(full_name),
          service:service_id(name)
        `)
        .eq('customer_id', user.id)
        .order('booking_date', { ascending: false })
        .limit(10)

      if (bookingsData) {
        setBookings(bookingsData.map((b: any) => ({
          id: b.id,
          booking_number: b.booking_number,
          provider_name: b.provider?.full_name || 'Provider',
          service_name: b.service?.name || 'Service',
          booking_date: b.booking_date,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
          total_price: b.total_price
        })))
      }
    } catch (error) {
      console.error('Error loading customer data:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editForm.full_name,
          phone: editForm.phone,
          address: editForm.address,
          city: editForm.city,
          postal_code: editForm.postal_code,
          emergency_contact_name: editForm.emergency_contact_name,
          emergency_contact_phone: editForm.emergency_contact_phone,
          medical_notes: editForm.medical_notes,
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
    { label: 'Upcoming', value: bookings.filter(b => b.status === 'confirmed').length, icon: Clock, color: 'bg-green-500' },
    { label: 'Completed', value: bookings.filter(b => b.status === 'completed').length, icon: Star, color: 'bg-amber-500' },
    { label: 'Total Spent', value: `$${bookings.reduce((sum, b) => sum + (b.total_price || 0), 0)}`, icon: DollarSign, color: 'bg-purple-500' },
  ]

  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 5)

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

      {/* Navigation Tabs */}
      <div className="max-w-7xl mx-auto px-4 mt-8">
        <div className="flex gap-2 border-b border-gray-200 pb-2 overflow-x-auto">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'bookings', label: 'My Bookings', icon: BookOpen },
            { id: 'profile', label: 'Profile', icon: User },
            { id: 'favorites', label: 'Favorites', icon: Heart },
            { id: 'payments', label: 'Payments', icon: CreditCard },
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
            {/* Upcoming Bookings */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-semibold text-lg">Upcoming Bookings</h2>
                <button 
                  onClick={() => setActiveTab('bookings')}
                  className="text-green-600 text-sm hover:underline"
                >
                  View all
                </button>
              </div>
              {upcomingBookings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No upcoming bookings</p>
                  <button 
                    onClick={() => router.push('/services')}
                    className="mt-2 text-green-600 hover:underline text-sm"
                  >
                    Book a service
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{booking.service_name}</p>
                        <p className="text-sm text-gray-500">with {booking.provider_name}</p>
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

            {/* Quick Actions */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="font-semibold text-lg mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/services')}
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
                  <span className="text-gray-400">→</span>
                </button>

                <button 
                  onClick={() => router.push('/support')}
                  className="w-full flex items-center justify-between p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Get Support</p>
                      <p className="text-sm text-gray-600">Chat with our team</p>
                    </div>
                  </div>
                  <span className="text-gray-400">→</span>
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
                <button 
                  onClick={() => router.push('/services')}
                  className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Book Your First Service
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">{booking.service_name}</p>
                      <p className="text-sm text-gray-500">with {booking.provider_name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {booking.booking_date} • {formatTimeRange(booking.start_time, booking.end_time)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${booking.total_price}</p>
                      <span className={`text-xs px-2 py-1 rounded-full mt-1 inline-block ${
                        booking.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                        booking.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
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

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-semibold text-lg">Profile Information</h2>
              {!editing ? (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 text-green-600 hover:text-green-700"
                >
                  <Edit className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setEditing(false)
                      setEditForm(profile || {})
                    }}
                    className="flex items-center gap-1 text-gray-500 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                  <button
                    onClick={updateProfile}
                    disabled={saving}
                    className="flex items-center gap-1 text-green-600 hover:text-green-700"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm text-gray-500 mb-1">Full Name</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.full_name || ''}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{profile?.full_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Email</label>
                <p className="font-medium">{profile?.email}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Phone</label>
                {editing ? (
                  <input
                    type="tel"
                    value={editForm.phone || ''}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{profile?.phone || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Date of Birth</label>
                <p className="font-medium">{profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString() : 'Not set'}</p>
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Address</label>
                {editing ? (
                  <input
                    type="text"
                    value={editForm.address || ''}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full p-2 border rounded-lg"
                  />
                ) : (
                  <p className="font-medium">{profile?.address || 'Not set'}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">City & Postal Code</label>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editForm.city || ''}
                      onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                      placeholder="City"
                      className="flex-1 p-2 border rounded-lg"
                    />
                    <input
                      type="text"
                      value={editForm.postal_code || ''}
                      onChange={(e) => setEditForm({ ...editForm, postal_code: e.target.value })}
                      placeholder="Postcode"
                      className="w-24 p-2 border rounded-lg"
                    />
                  </div>
                ) : (
                  <p className="font-medium">{profile?.city}, {profile?.postal_code}</p>
                )}
              </div>
              <div>
                <label className="block text-sm text-gray-500 mb-1">Emergency Contact</label>
                {editing ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={editForm.emergency_contact_name || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_name: e.target.value })}
                      placeholder="Contact name"
                      className="w-full p-2 border rounded-lg"
                    />
                    <input
                      type="tel"
                      value={editForm.emergency_contact_phone || ''}
                      onChange={(e) => setEditForm({ ...editForm, emergency_contact_phone: e.target.value })}
                      placeholder="Contact phone"
                      className="w-full p-2 border rounded-lg"
                    />
                  </div>
                ) : (
                  <p className="font-medium">
                    {profile?.emergency_contact_name || 'Not set'} 
                    {profile?.emergency_contact_phone && ` (${profile.emergency_contact_phone})`}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-gray-500 mb-1">Medical Notes</label>
                {editing ? (
                  <textarea
                    value={editForm.medical_notes || ''}
                    onChange={(e) => setEditForm({ ...editForm, medical_notes: e.target.value })}
                    rows={3}
                    className="w-full p-2 border rounded-lg"
                    placeholder="Any medical conditions or allergies..."
                  />
                ) : (
                  <p className="font-medium">{profile?.medical_notes || 'No medical notes'}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Favorite Providers</h2>
            <div className="text-center py-12 text-gray-500">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No favorite providers yet</p>
              <p className="text-sm">Save providers you love to easily book them again</p>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payments' && (
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <h2 className="font-semibold text-lg mb-4">Payment Methods</h2>
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">No payment methods saved</p>
              <button className="mt-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Add Payment Method
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}