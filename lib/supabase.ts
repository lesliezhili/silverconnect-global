import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ukgolkaejlfhcqhudmve.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ29sa2FlamxmaGNxaHVkbXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUyNjQ4MDAsImV4cCI6MjA1MDg0MDgwMH0.example_anon_key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Check if we have valid-looking credentials
const hasValidCredentials = supabaseUrl && supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') && !supabaseAnonKey.includes('placeholder') &&
  supabaseAnonKey.length > 50

if (!hasValidCredentials && typeof window !== 'undefined') {
  console.warn(
    '[SilverConnect] Running with demo credentials — Limited functionality.\n' +
    'For full features, set up a real Supabase project and update .env.local'
  )
}

// Create Supabase client with fallback credentials
export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  }
)

// Service role client for admin operations
export const supabaseAdmin = supabaseServiceKey ? createClient(
  supabaseUrl,
  supabaseServiceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
) : null

export const isSupabaseConfigured = hasValidCredentials
