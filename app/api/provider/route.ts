import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

function getServerSupabase(accessToken?: string) {
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  })
  if (accessToken) {
    client.auth.setAuth(accessToken)
  }
  return client
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined
    const supabaseServer = getServerSupabase(accessToken)

    const { data: { user } } = await supabaseServer.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })
    }

    const body = await request.json()
    const {
      firstName, lastName, phone, postcode, suburb,
      services, experience, certifications, bio,
      is_christian, faith_background
    } = body

    const { data: existingUser, error: checkUserError } = await supabaseServer
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (checkUserError) {
      console.error('Error checking user:', checkUserError)
    }

    if (!existingUser) {
      const { error: createUserError } = await supabaseServer
        .from('users')
        .insert({
          id: user.id,
          email: user.email,
          full_name: `${firstName} ${lastName}`,
          phone: phone || '',
          user_type: 'provider',
          city: suburb || '',
          postal_code: postcode || '',
          created_at: new Date().toISOString()
        })

      if (createUserError) {
        console.error('Error creating user:', createUserError)
        return NextResponse.json({ error: createUserError.message }, { status: 500 })
      }
    } else {
      const { error: updateUserError } = await supabaseServer
        .from('users')
        .update({
          user_type: 'provider',
          full_name: `${firstName} ${lastName}`,
          phone: phone || '',
          city: suburb || '',
          postal_code: postcode || '',
        })
        .eq('id', user.id)

      if (updateUserError) {
        console.error('Error updating user:', updateUserError)
      }
    }

    let yearsExpValue = 0
    if (experience === '10+') yearsExpValue = 10
    else if (experience === '5-10') yearsExpValue = 7
    else if (experience === '3-5') yearsExpValue = 4
    else if (experience === '1-3') yearsExpValue = 2
    else if (experience === '0-1') yearsExpValue = 0

    const { data: existingProvider } = await supabaseServer
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let result

    if (existingProvider) {
      result = await supabaseServer
        .from('service_providers')
        .update({
          full_name: `${firstName} ${lastName}`,
          phone: phone || '',
          city: suburb || '',
          address: suburb || '',
          postal_code: postcode || '',
          specialties: services || [],
          bio: bio || '',
          years_experience: yearsExpValue,
          certifications: certifications || [],
          is_christian: is_christian || false,
          faith_background: faith_background || null,
        })
        .eq('user_id', user.id)
        .select()
        .single()
    } else {
      result = await supabaseServer
        .from('service_providers')
        .insert({
          user_id: user.id,
          email: user.email,
          full_name: `${firstName} ${lastName}`,
          phone: phone || '',
          city: suburb || '',
          address: suburb || '',
          postal_code: postcode || '',
          specialties: services || [],
          bio: bio || '',
          years_experience: yearsExpValue,
          certifications: certifications || [],
          is_christian: is_christian || false,
          faith_background: faith_background || null,
          is_verified: false,
          rating: 5.0,
          total_ratings: 0,
          created_at: new Date().toISOString()
        })
        .select()
        .single()
    }

    if (result.error) {
      console.error('Database error:', result.error)
      return NextResponse.json({ error: result.error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      provider: result.data
    })
  } catch (error: any) {
    console.error('Provider API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const accessToken = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : undefined
  const supabaseServer = getServerSupabase(accessToken)

  const { data: { user } } = await supabaseServer.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: provider } = await supabaseServer
    .from('service_providers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ provider })
}
