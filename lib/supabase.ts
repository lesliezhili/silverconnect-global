import { createClient, type User } from '@supabase/supabase-js'
import type { NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukgolkaejlfhcqhudmve.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

const hasValidCredentials = Boolean(
  supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder') && supabaseAnonKey.length > 50
)

if (!hasValidCredentials && typeof window !== 'undefined') {
  console.warn('[SilverConnect] Running with demo credentials — Limited functionality.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
})

export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false, autoRefreshToken: false }
    })
  : null

export const isSupabaseConfigured = hasValidCredentials && Boolean(supabaseServiceKey)

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user as User | null
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user profile:', error)
    return null
  }

  return data
}

export function getAccessTokenFromRequest(request: { headers?: { get(name: string): string | null }; cookies?: { get(name: string): { value: string } | null } }) {
  const authHeader = request.headers?.get?.('authorization')
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '')
  }

  const tokenCookie = request.cookies?.get?.('sb-access-token')
  if (tokenCookie) {
    return tokenCookie.value
  }

  return undefined
}

export async function getServerUser(accessToken?: string): Promise<User | null> {
  if (!accessToken || !supabaseAdmin) return null
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken)
  if (error) {
    console.error('[Supabase] getServerUser error', error)
    return null
  }
  return data.user as User | null
}

export async function getServerUserFromRequest(request: { headers?: { get(name: string): string | null }; cookies?: { get(name: string): { value: string } | null } }) {
  const token = getAccessTokenFromRequest(request)
  return getServerUser(token)
}

export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}
