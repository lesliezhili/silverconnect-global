/**
 * Test Data Seeding Script
 * 
 * Creates test customer and service provider accounts for end-to-end testing
 * 
 * Usage:
 *   npx ts-node scripts/seed-test-data.ts
 * 
 * Environment variables needed:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_KEY (admin key with full privileges)
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-supabase-url.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Error: SUPABASE_SERVICE_KEY environment variable is required');
  console.error('Set it in your .env.local file');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test data constants
const TEST_CUSTOMER = {
  email: 'testcustomer@silverconnect.local',
  password: 'TestCustomer123!',
  full_name: 'Jane Test Customer',
  phone: '+61 452 123 456',
  address: '42 Mountain View Lane, Kew East VIC 3102',
  postal_code: '3102',
  city: 'Kew East',
  latitude: -37.8294,
  longitude: 145.0929,
  country_code: 'AU',
  user_type: 'customer'
};

const TEST_PROVIDER = {
  email: 'testprovider@silverconnect.local',
  password: 'TestProvider123!',
  full_name: 'John Service Provider',
  phone: '+61 452 987 654',
  address: '15 Local Street, Kew East VIC 3102',
  postal_code: '3102',
  city: 'Kew East',
  latitude: -37.8300,
  longitude: 145.0920,
  country_code: 'AU',
  user_type: 'provider'
};

async function createTestDataWithIds(customerId: string, providerId: string) {
  // Check if customer already exists in users table
  const { data: existingCustomer } = await supabase
    .from('users')
    .select('id')
    .eq('id', customerId)
    .single();

  if (!existingCustomer) {
    // Insert customer into users table
    const { error: customerError } = await supabase
      .from('users')
      .insert([
        {
          id: customerId,
          email: TEST_CUSTOMER.email,
          full_name: TEST_CUSTOMER.full_name,
          phone: TEST_CUSTOMER.phone,
          address: TEST_CUSTOMER.address,
          postal_code: TEST_CUSTOMER.postal_code,
          city: TEST_CUSTOMER.city,
          latitude: TEST_CUSTOMER.latitude,
          longitude: TEST_CUSTOMER.longitude,
          country_code: TEST_CUSTOMER.country_code,
          user_type: TEST_CUSTOMER.user_type,
          preferred_language: 'EN',
          emergency_contact_name: 'Emergency Contact',
          emergency_contact_phone: '+61 452 111 111',
        },
      ]);

    if (customerError) {
      console.error('❌ Error inserting customer into users table:', customerError?.message || 'Unknown error');
      throw customerError;
    }

    console.log(`✅ Customer profile created: ${TEST_CUSTOMER.full_name}`);
  } else {
    console.log(`✅ Customer profile already exists (skipping)`);
  }

  // Check if provider already exists in users table
  const { data: existingProviderUser } = await supabase
    .from('users')
    .select('id')
    .eq('id', providerId)
    .single();

  if (!existingProviderUser) {
    // Insert provider into users table
    const { error: providerUserError } = await supabase
      .from('users')
      .insert([
        {
          id: providerId,
          email: TEST_PROVIDER.email,
          full_name: TEST_PROVIDER.full_name,
          phone: TEST_PROVIDER.phone,
          address: TEST_PROVIDER.address,
          postal_code: TEST_PROVIDER.postal_code,
          city: TEST_PROVIDER.city,
          latitude: TEST_PROVIDER.latitude,
          longitude: TEST_PROVIDER.longitude,
          country_code: TEST_PROVIDER.country_code,
          user_type: TEST_PROVIDER.user_type,
          preferred_language: 'EN',
        },
      ]);

    if (providerUserError) {
      console.error('❌ Error inserting provider into users table:', providerUserError?.message || 'Unknown error');
      throw providerUserError;
    }

    console.log(`✅ Provider user profile created: ${TEST_PROVIDER.full_name}`);
  } else {
    console.log(`✅ Provider user profile already exists (skipping)`);
  }

  // Get some service IDs to assign to provider
  const { data: services } = await supabase
    .from('services')
    .select('id, name')
    .in('name', ['Standard Home Cleaning', 'Deep Cleaning', 'Window Cleaning', 'Lawn Mowing & Edging']);

  if (!services || services.length === 0) {
    throw new Error('No services found in database');
  }

  const serviceIds = services.map(s => s.id);

  // Check if provider already exists in service_providers table
  const { data: existingServiceProvider } = await supabase
    .from('service_providers')
    .select('id, user_id')
    .eq('user_id', providerId)
    .single();

  let serviceProviderId: string;

  if (!existingServiceProvider) {
    // Insert service provider profile
    const { data: newServiceProvider, error: serviceProviderError } = await supabase
      .from('service_providers')
      .insert([
        {
          user_id: providerId,
          email: TEST_PROVIDER.email,
          full_name: TEST_PROVIDER.full_name,
          phone: TEST_PROVIDER.phone,
          address: TEST_PROVIDER.address,
          latitude: TEST_PROVIDER.latitude,
          longitude: TEST_PROVIDER.longitude,
          country_code: TEST_PROVIDER.country_code,
          specialties: serviceIds,
          bio: 'Test service provider for end-to-end testing',
          years_experience: 5,
          certifications: ['First Aid', 'Police Check'],
          is_verified: true,
          rating: 4.8,
          total_ratings: 25,
          available_hours: JSON.stringify({
            monday: '9am-5pm',
            tuesday: '9am-5pm',
            wednesday: '9am-5pm',
            thursday: '9am-5pm',
            friday: '9am-5pm',
            saturday: '10am-2pm',
            sunday: 'closed',
          }),
        },
      ])
      .select('id')
      .single();

    if (serviceProviderError) {
      console.error('❌ Error inserting service provider:', serviceProviderError?.message || 'Unknown error');
      throw serviceProviderError;
    }

    serviceProviderId = newServiceProvider.id;
    console.log(`✅ Service provider profile created: ${TEST_PROVIDER.full_name}`);
  } else {
    serviceProviderId = existingServiceProvider.id;
    console.log(`✅ Service provider profile already exists (skipping)`);
  }

  // Add availability for each day of the week (skip if already exists)
  const availabilityData: any[] = [];
  for (let dayOfWeek = 1; dayOfWeek < 7; dayOfWeek++) {
    availabilityData.push({
      provider_id: serviceProviderId,
      day_of_week: dayOfWeek,
      start_time: '09:00',
      end_time: '17:00',
      is_available: true,
    });
  }

  // Check if availability already exists
  console.log(`🔍 Checking availability for provider: ${serviceProviderId}`);
  const { data: existingAvailability, error: availabilityCheckError } = await supabase
    .from('provider_availability')
    .select('day_of_week')
    .eq('provider_id', serviceProviderId);

  if (availabilityCheckError) {
    console.error('❌ Error checking availability:', availabilityCheckError.message);
    throw availabilityCheckError;
  }

  console.log(`📊 Found ${existingAvailability?.length || 0} existing availability records`);
  if (existingAvailability && existingAvailability.length > 0) {
    console.log(`📅 Existing days: ${existingAvailability.map(a => a.day_of_week).join(', ')}`);
  }

  if (!existingAvailability || existingAvailability.length === 0) {
    const { error: availabilityError } = await supabase
      .from('provider_availability')
      .insert(availabilityData);

    if (availabilityError) {
      console.error('❌ Error adding provider availability:', availabilityError?.message || 'Unknown error');
      throw availabilityError;
    }

    console.log(`✅ Provider availability added (Mon-Sat)`);
  } else {
    console.log(`✅ Provider availability already exists (${existingAvailability.length} records, skipping)`);
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Test Data Successfully Created!\n');
  console.log('📋 TEST CUSTOMER ACCOUNT:');
  console.log(`   Email: ${TEST_CUSTOMER.email}`);
  console.log(`   Password: ${TEST_CUSTOMER.password}`);
  console.log(`   Name: ${TEST_CUSTOMER.full_name}`);
  console.log(`   Location: ${TEST_CUSTOMER.city}, ${TEST_CUSTOMER.country_code} ${TEST_CUSTOMER.postal_code}`);
  console.log('');
  console.log('📋 TEST SERVICE PROVIDER ACCOUNT:');
  console.log(`   Email: ${TEST_PROVIDER.email}`);
  console.log(`   Password: ${TEST_PROVIDER.password}`);
  console.log(`   Name: ${TEST_PROVIDER.full_name}`);
  console.log(`   Location: ${TEST_PROVIDER.city}, ${TEST_PROVIDER.country_code} ${TEST_PROVIDER.postal_code}`);
  console.log('');
  console.log('🚀 You can now test the end-to-end booking flow!');
  console.log('   1. Start the app: npm run dev');
  console.log('   2. Login as customer or provider');
  console.log('   3. Try booking a service in Kew East, VIC 3102');
  console.log('═══════════════════════════════════════════════════════════\n');
}

async function seedTestData() {
  try {
    console.log('🌱 Starting test data seeding...\n');

    // Check if tables exist by trying to query them
    console.log('🔍 Checking database tables...');
    try {
      const { data: usersTable, error: usersError } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const { data: providersTable, error: providersError } = await supabase
        .from('service_providers')
        .select('user_id')
        .limit(1);

      if (usersError || providersError) {
        console.error('❌ Database tables not found. Please run the schema.sql first.');
        console.error('Users table error:', usersError?.message);
        console.error('Service providers table error:', providersError?.message);
        throw new Error('Database tables missing');
      }

      console.log('✅ Database tables exist\n');
    } catch (tableCheckError) {
      console.error('❌ Error checking tables:', tableCheckError);
      throw tableCheckError;
    }

    // Check if test users already exist in auth.users
    console.log('🔍 Checking for existing test users...');
    const { data: customerAuth, error: customerAuthError } = await supabase.auth.admin.listUsers();
    if (customerAuthError) {
      console.error('❌ Error checking auth users:', customerAuthError.message);
      throw customerAuthError;
    }

    let customerId = null;
    let providerId = null;

    // Find existing test users
    for (const user of customerAuth.users) {
      if (user.email === TEST_CUSTOMER.email) {
        customerId = user.id;
        console.log(`✅ Found existing customer: ${user.email}`);
      }
      if (user.email === TEST_PROVIDER.email) {
        providerId = user.id;
        console.log(`✅ Found existing provider: ${user.email}`);
      }
    }

    // Create auth users if they don't exist
    if (!customerId) {
      console.log(`📝 Creating customer auth user: ${TEST_CUSTOMER.email}`);
      const { data: customerAuthData, error: customerAuthCreateError } = await supabase.auth.admin.createUser({
        email: TEST_CUSTOMER.email,
        password: TEST_CUSTOMER.password,
        email_confirm: true,
      });
      if (customerAuthCreateError) {
        console.error('❌ Error creating customer auth user:', customerAuthCreateError.message);
        throw customerAuthCreateError;
      }
      customerId = customerAuthData.user.id;
      console.log(`✅ Customer auth user created`);
    }

    if (!providerId) {
      console.log(`📝 Creating provider auth user: ${TEST_PROVIDER.email}`);
      const { data: providerAuthData, error: providerAuthCreateError } = await supabase.auth.admin.createUser({
        email: TEST_PROVIDER.email,
        password: TEST_PROVIDER.password,
        email_confirm: true,
      });
      if (providerAuthCreateError) {
        console.error('❌ Error creating provider auth user:', providerAuthCreateError.message);
        throw providerAuthCreateError;
      }
      providerId = providerAuthData.user.id;
      console.log(`✅ Provider auth user created`);
    }

    // Create test data with the user IDs
    await createTestDataWithIds(customerId, providerId);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedTestData();
