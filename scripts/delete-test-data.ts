/**
 * Delete Test Data Script
 * 
 * Removes all test customer and service provider accounts
 * 
 * Usage:
 *   npx ts-node scripts/delete-test-data.ts
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

// Test data emails to delete
const TEST_EMAILS = [
  'testcustomer@silverconnect.local',
  'testprovider@silverconnect.local',
  'admin@silverconnect.local'
];

async function deleteTestData() {
  try {
    console.log('🗑️  Starting test data deletion...\n');

    // Delete users from auth
    console.log('Deleting test users from authentication...');
    for (const email of TEST_EMAILS) {
      try {
        // First get the user ID
        const { data: { users }, error: searchError } = await supabase.auth.admin.listUsers();
        
        if (searchError) {
          console.warn(`⚠️  Could not list users: ${searchError.message}`);
          continue;
        }

        const testUser = users?.find(u => u.email === email);
        if (testUser) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(testUser.id);
          if (deleteError) {
            console.warn(`⚠️  Could not delete user ${email}: ${deleteError.message}`);
          } else {
            console.log(`✓ Deleted user: ${email}`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Error deleting user ${email}:`, error);
      }
    }

    // Delete from users table
    console.log('\nDeleting from users table...');
    for (const email of TEST_EMAILS) {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('email', email);
      
      if (error) {
        console.warn(`⚠️  Could not delete from users table (${email}):`, error.message);
      } else {
        console.log(`✓ Deleted user record: ${email}`);
      }
    }

    // Delete from profiles table
    console.log('\nDeleting from profiles table...');
    for (const email of TEST_EMAILS) {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('email', email);
      
      if (error) {
        console.warn(`⚠️  Could not delete from profiles table (${email}):`, error.message);
      } else {
        console.log(`✓ Deleted profile: ${email}`);
      }
    }

    // Delete service providers by name
    console.log('\nDeleting test service providers...');
    const testProviderNames = ['John Service Provider', 'Test Provider'];
    for (const name of testProviderNames) {
      const { error } = await supabase
        .from('service_providers')
        .delete()
        .eq('name', name);
      
      if (error) {
        console.warn(`⚠️  Could not delete provider (${name}):`, error.message);
      } else {
        console.log(`✓ Deleted provider: ${name}`);
      }
    }

    // Delete bookings associated with test accounts
    console.log('\nDeleting bookings for test accounts...');
    const { error: bookingError } = await supabase
      .from('bookings')
      .delete()
      .in('customer_email', TEST_EMAILS);
    
    if (bookingError) {
      console.warn(`⚠️  Could not delete bookings:`, bookingError.message);
    } else {
      console.log(`✓ Deleted test bookings`);
    }

    console.log('\n✨ Test data deletion complete!');
    process.exit(0);
  } catch (error) {
    console.error('🔥 Deletion failed:', error);
    process.exit(1);
  }
}

deleteTestData();
