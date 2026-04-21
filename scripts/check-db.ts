import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://ukgolkaejlfhcqhudmve.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVrZ29sa2FlamxmaGNxaHVkbXZlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MzEzNDksImV4cCI6MjA5MjAwNzM0OX0.GG1CsYT-_A7teZTm9nK5UUicnxG-n-kTh8QnQxiMQjs'
);

// Check if services and pricing data exists
async function checkAndSeedData() {
  try {
    console.log('Checking services data...');

    // Check if services exist
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, name')
      .limit(5);

    if (servicesError) {
      console.error('Error checking services:', servicesError);
      return;
    }

    if (!services || services.length === 0) {
      console.log('No services found. Please run the schema.sql in Supabase SQL Editor first.');
      return;
    }

    console.log(`Found ${services.length} services`);

    // Check if pricing exists
    const { data: prices, error: pricesError } = await supabase
      .from('service_prices')
      .select('service_id, country_code, base_price')
      .limit(5);

    if (pricesError) {
      console.error('Error checking prices:', pricesError);
      return;
    }

    if (!prices || prices.length === 0) {
      console.log('No pricing data found. Please run the INSERT statements from schema.sql in Supabase SQL Editor.');
      return;
    }

    console.log(`Found ${prices.length} pricing entries`);
    console.log('✅ Database appears to be properly seeded!');

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

checkAndSeedData();