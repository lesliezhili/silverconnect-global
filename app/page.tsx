'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SERVICES_AU } from '@/lib/services'
import { useLocation } from '@/components/LocationDetector'
import { providersNearPostcode } from '@/lib/matching'
import CountrySelector from '@/components/CountrySelector'
import LanguageSelector from '@/components/LanguageSelector'
import { User, LogOut, Calendar, Heart, Briefcase, Star, MapPin, Clock } from 'lucide-react'
import AuthModal from '@/components/AuthModal'
import ProviderRegistration from '@/components/ProviderRegistration'
import CustomerRegistration from '@/components/CustomerRegistration'

export default function HomePage() {
  const router = useRouter()
  const { location } = useLocation()
  const [selectedCountry, setSelectedCountry] = useState('AU')
  const [selectedLanguage, setSelectedLanguage] = useState('en')
  const [nearbyProviders, setNearbyProviders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showProviderReg, setShowProviderReg] = useState(false)
  const [showCustomerReg, setShowCustomerReg] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login')
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [isProvider, setIsProvider] = useState(false)

  // Check auth state on mount
  useEffect(() => {
    checkUser()
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user)
        fetchUserProfile(session.user.id)
        checkIfProvider(session.user.id)
      } else {
        setUser(null)
        setUserProfile(null)
        setIsProvider(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    if (user) {
      await fetchUserProfile(user.id)
      await checkIfProvider(user.id)
    }
  }

  const checkIfProvider = async (userId: string) => {
    const { data } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle()
    setIsProvider(!!data)
  }

  const fetchUserProfile = async (userId: string) => {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    setUserProfile(data)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setUserProfile(null)
    setIsProvider(false)
    setShowUserMenu(false)
    router.push('/')
  }

  const handleGetStarted = () => {
    if (user) {
      if (isProvider) {
        router.push('/dashboard/provider')
      } else {
        router.push('/dashboard/customer')
      }
    } else {
      setAuthMode('signup')
      setShowAuthModal(true)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      
      if (location.postcode) {
        const providers = await providersNearPostcode(location.postcode, undefined, 10)
        setNearbyProviders(providers || [])
      }
      
      setLoading(false)
    }
    
    loadData()
  }, [location.postcode])

  const topProviders = nearbyProviders.slice(0, 3)

  const getLocationDisplay = () => {
    if (location.suburb && location.postcode) {
      return `${location.suburb} ${location.postcode}`
    }
    return 'your area'
  }

  const displayLocation = selectedCountry === 'CN' 
    ? '中国各地区' 
    : getLocationDisplay()

  const handleOpenAuth = (mode: 'login' | 'signup') => {
    setAuthMode(mode)
    setShowAuthModal(true)
  }

  const handleSignupTypeSelect = (type: 'customer' | 'provider') => {
    setShowAuthModal(false)
    if (type === 'customer') {
      setShowCustomerReg(true)
    } else {
      setShowProviderReg(true)
    }
  }

  const handleProviderApply = () => {
    if (user) {
      setShowProviderReg(true)
    } else {
      setAuthMode('signup')
      setShowAuthModal(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-green-600">
            SilverConnect
          </Link>
          
          <div className="flex items-center gap-4">
            <CountrySelector 
              value={selectedCountry} 
              onChange={setSelectedCountry}
            />
            <LanguageSelector 
              value={selectedLanguage}
              onChange={setSelectedLanguage}
            />
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 transition"
                >
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {userProfile?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-gray-700 hidden md:inline">
                    {userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0]}
                  </span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-3 border-b">
                      <p className="font-medium text-gray-900">{userProfile?.full_name || user.email}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <div className="py-1">
                      {isProvider ? (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            router.push('/dashboard/provider')
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <Briefcase className="w-4 h-4" />
                          Provider Dashboard
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            router.push('/dashboard/customer')
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          <User className="w-4 h-4" />
                          My Dashboard
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/bookings')
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Calendar className="w-4 h-4" />
                        My Bookings
                      </button>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          router.push('/favorites')
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <Heart className="w-4 h-4" />
                        Favorites
                      </button>
                      {!isProvider && (
                        <button
                          onClick={() => {
                            setShowUserMenu(false)
                            setShowProviderReg(true)
                          }}
                          className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-green-600 hover:bg-green-50"
                        >
                          <Briefcase className="w-4 h-4" />
                          Become a Provider
                        </button>
                      )}
                      <hr className="my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenAuth('login')}
                  className="text-gray-600 hover:text-gray-900 px-3 py-1.5 text-sm"
                >
                  Sign In
                </button>
                <button
                  onClick={() => handleOpenAuth('signup')}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Quality Care at Your Fingertips
          </h1>
          <p className="text-lg md:text-xl mb-8 opacity-90">
            Connect with trusted care providers in {displayLocation}
          </p>
          <button
            onClick={handleGetStarted}
            className="px-8 py-3 bg-white text-green-600 rounded-full font-semibold hover:bg-gray-100 transition text-lg"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </button>
        </div>
      </section>

      {/* Services Section - Using div, not button */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="text-gray-500 mt-2">Professional care services tailored to your needs</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SERVICES_AU.slice(0, 6).map((service) => (
            <div
              key={service.id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-md transition p-6 cursor-pointer"
              onClick={() => user ? router.push(`/booking?service=${service.id}`) : handleOpenAuth('signup')}
            >
              <div className="text-4xl mb-4">
                {service.category === 'cleaning' && '🧹'}
                {service.category === 'cooking' && '🍳'}
                {service.category === 'gardening' && '🌿'}
                {service.category === 'personal' && '🤝'}
                {service.category === 'maintenance' && '🔧'}
              </div>
              <h3 className="font-semibold text-lg">{service.name}</h3>
              <p className="text-gray-500 text-sm mt-2 line-clamp-2">{service.description}</p>
              <div className="mt-4 flex justify-between items-center">
                <span className="text-green-600 font-bold">
                  {selectedCountry === 'AU' && '$'}
                  {selectedCountry === 'CN' && '¥'}
                  {selectedCountry === 'CA' && '$'}
                  {service.base_price}
                </span>
                <span 
                  className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 transition text-sm inline-block cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation()
                    user ? router.push(`/booking?service=${service.id}`) : handleOpenAuth('signup')
                  }}
                >
                  Book Now
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Top Providers Section - Using div, not button */}
      {topProviders.length > 0 && (
        <section className="bg-white py-16">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900">Top Rated Providers Near You</h2>
              <p className="text-gray-500 mt-2">Trusted professionals in your area</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topProviders.map((provider) => (
                <div
                  key={provider.id}
                  className="border rounded-2xl p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => user ? router.push(`/provider/${provider.id}`) : handleOpenAuth('signup')}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-400 to-blue-400 rounded-full flex items-center justify-center text-white text-xl font-bold">
                      {provider.full_name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{provider.full_name}</h3>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm">{provider.rating}</span>
                        <span className="text-gray-400 text-sm">
                          ({provider.total_ratings} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-400 text-xs mt-1">
                        <MapPin className="w-3 h-3" />
                        {provider.city || 'Near you'}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-500 text-sm line-clamp-2">
                    {provider.specialties?.slice(0, 3).join(' • ')}
                  </p>
                  <span 
                    className="mt-4 w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-center inline-block cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      user ? router.push(`/provider/${provider.id}`) : handleOpenAuth('signup')
                    }}
                  >
                    View Profile
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Why Choose Us Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Why Choose SilverConnect?</h2>
            <p className="text-gray-500 mt-2">We make care simple, reliable, and accessible</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Trusted Providers</h3>
              <p className="text-gray-500 text-sm">All providers are vetted, verified, and rated by customers</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Flexible Scheduling</h3>
              <p className="text-gray-500 text-sm">Book services at times that work for you</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Compassionate Care</h3>
              <p className="text-gray-500 text-sm">Caregivers who genuinely care about your wellbeing</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Become a Provider */}
      <section className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Become a Care Provider</h2>
          <p className="text-lg mb-8 opacity-90">Join our network of trusted care professionals and make a difference</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleProviderApply}
              className="px-8 py-3 bg-green-600 text-white rounded-full font-semibold hover:bg-green-700 transition"
            >
              Apply Now
            </button>
            {!user && (
              <button
                onClick={() => handleOpenAuth('signup')}
                className="px-8 py-3 bg-white text-green-600 rounded-full font-semibold hover:bg-gray-100 transition"
              >
                Sign Up as Customer
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Modals */}
      {showAuthModal && (
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          mode={authMode}
          onSwitchMode={(mode) => setAuthMode(mode)}
          onSignupTypeSelect={handleSignupTypeSelect}
        />
      )}

      {showCustomerReg && (
        <CustomerRegistration
          isOpen={showCustomerReg}
          onClose={() => setShowCustomerReg(false)}
          language={selectedLanguage as 'en' | 'zh'}
          onSuccess={() => {
            setShowCustomerReg(false)
            checkUser()
          }}
        />
      )}

      {showProviderReg && (
        <ProviderRegistration
          isOpen={showProviderReg}
          onClose={() => setShowProviderReg(false)}
          language={selectedLanguage as 'en' | 'zh'}
          onSuccess={() => {
            setShowProviderReg(false)
            checkUser()
            router.push('/dashboard/provider')
          }}
        />
      )}
    </div>
  )
}