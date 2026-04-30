import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukgolkaejlfhcqhudmve.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ29sa2FlamxmaGNxaHVkbXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNjQ4MDAsImV4cCI6MjA1MDg0MDgwMH0.example_anon_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const hasValidCredentials = supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder') &&
  supabaseAnonKey.length > 50

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

export const supabaseAdmin = supabaseServiceKey ? createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
) : null

export const isSupabaseConfigured = hasValidCredentials

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function getCurrentUserProfile() {
  const user = await getCurrentUser()
  if (!user) return null
  
  // Use maybeSingle() instead of single() to avoid errors if no record found
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

// Helper function to validate UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
}