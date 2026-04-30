'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkUserType()
  }, [])

  const checkUserType = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/?signin=true')
        return
      }

      // Check if user is a provider
      const { data: provider } = await supabase
        .from('service_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (provider) {
        router.push('/dashboard/provider')
      } else {
        router.push('/dashboard/customer')
      }
    } catch (error) {
      console.error('Error checking user type:', error)
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    )
  }

  return null
}