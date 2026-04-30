import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    // Get the current user from the session
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Please sign in first' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      firstName, lastName, phone, postcode, suburb, 
      services, experience, certifications, bio,
      is_christian, faith_background
    } = body

    console.log('=== Upgrading to provider ===')
    console.log('User ID:', user.id)
    console.log('User Email:', user.email)
    console.log('First Name:', firstName)
    console.log('Last Name:', lastName)
    console.log('Services:', services)

    // Step 1: Ensure user exists in users table
    const { data: existingUser, error: checkUserError } = await supabase
      .from('users')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (checkUserError) {
      console.error('Error checking user:', checkUserError)
    }

    if (!existingUser) {
      console.log('Creating user record...')
      const { error: createUserError } = await supabase
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
      // Update user type to provider
      console.log('Updating existing user...')
      const { error: updateUserError } = await supabase
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

    // Step 2: Calculate years experience
    let yearsExpValue = 0
    if (experience === '10+') yearsExpValue = 10
    else if (experience === '5-10') yearsExpValue = 7
    else if (experience === '3-5') yearsExpValue = 4
    else if (experience === '1-3') yearsExpValue = 2
    else if (experience === '0-1') yearsExpValue = 0

    // Step 3: Check if provider already exists
    const { data: existingProvider } = await supabase
      .from('service_providers')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    let result

    if (existingProvider) {
      console.log('Updating existing provider...')
      result = await supabase
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
      console.log('Creating new provider...')
      result = await supabase
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

    console.log('Success! Provider profile created/updated. ID:', result.data?.id)

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
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: provider } = await supabase
    .from('service_providers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  return NextResponse.json({ provider })
}