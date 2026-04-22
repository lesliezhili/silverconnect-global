#!/usr/bin/env node

/**
 * Database Seed Script
 * Usage: npm run db:seed
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables from .env.local
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = {
  services: [
    {
      category: 'cleaning',
      name: 'Home Cleaning',
      description: 'Professional home cleaning services',
      duration_minutes: 120,
    },
    {
      category: 'cooking',
      name: 'Meal Preparation',
      description: 'Fresh meal preparation and cooking',
      duration_minutes: 90,
    },
    {
      category: 'gardening',
      name: 'Gardening & Maintenance',
      description: 'Professional garden care',
      duration_minutes: 120,
    },
    {
      category: 'personal',
      name: 'Personal Care Assistance',
      description: 'Compassionate personal care support',
      duration_minutes: 60,
    },
    {
      category: 'shopping',
      name: 'Shopping Assistance',
      description: 'Grocery and shopping support',
      duration_minutes: 120,
    },
  ],
  servicePrices: [
    // Home Cleaning prices
    { service_name: 'Home Cleaning', AU: 60, CN: 280, CA: 55 },
    { service_name: 'Meal Preparation', AU: 45, CN: 200, CA: 40 },
    { service_name: 'Gardening & Maintenance', AU: 50, CN: 220, CA: 45 },
    { service_name: 'Personal Care Assistance', AU: 35, CN: 150, CA: 30 },
    { service_name: 'Shopping Assistance', AU: 25, CN: 100, CA: 20 },
  ]
};

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // Seed services
    console.log('📝 Inserting services...');
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .insert(seedData.services)
      .select();

    if (servicesError) {
      throw new Error(`Services insert failed: ${servicesError.message}`);
    }

    console.log(`✅ Inserted ${servicesData?.length || 0} services\n`);

    // Seed service prices
    console.log('💰 Inserting service prices...');
    const priceInserts = [];
    
    for (const priceData of seedData.servicePrices) {
      const service = servicesData.find(s => s.name === priceData.service_name);
      if (!service) continue;
      
      // Insert prices for each country
      priceInserts.push(
        { service_id: service.id, country_code: 'AU', base_price: priceData.AU, price_with_tax: priceData.AU * 1.1 },
        { service_id: service.id, country_code: 'CN', base_price: priceData.CN, price_with_tax: priceData.CN },
        { service_id: service.id, country_code: 'CA', base_price: priceData.CA, price_with_tax: priceData.CA * 1.13 }
      );
    }

    const { data: pricesData, error: pricesError } = await supabase
      .from('service_prices')
      .insert(priceInserts)
      .select();

    if (pricesError) {
      throw new Error(`Service prices insert failed: ${pricesError.message}`);
    }

    console.log(`✅ Inserted ${pricesData?.length || 0} service prices\n`);

    console.log('✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
