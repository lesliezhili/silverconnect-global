#!/usr/bin/env node

/**
 * Database Seed Script
 * Usage: npm run db:seed
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const seedData = {
  services: [
    {
      id: 'service-cleaning',
      name: 'Home Cleaning',
      description: 'Professional home cleaning services',
      category: 'cleaning',
      base_price: 80,
      duration_minutes: 120,
    },
    {
      id: 'service-cooking',
      name: 'Meal Preparation',
      description: 'Fresh meal preparation and cooking',
      category: 'cooking',
      base_price: 60,
      duration_minutes: 90,
    },
    {
      id: 'service-gardening',
      name: 'Gardening & Maintenance',
      description: 'Professional garden care',
      category: 'gardening',
      base_price: 70,
      duration_minutes: 120,
    },
    {
      id: 'service-personal-care',
      name: 'Personal Care Assistance',
      description: 'Compassionate personal care support',
      category: 'personal-care',
      base_price: 50,
      duration_minutes: 60,
    },
    {
      id: 'service-shopping',
      name: 'Shopping Assistance',
      description: 'Grocery and shopping support',
      category: 'shopping',
      base_price: 40,
      duration_minutes: 120,
    },
  ],
};

async function seedDatabase() {
  console.log('🌱 Seeding database...\n');

  try {
    // Seed services
    console.log('📝 Inserting services...');
    const { data, error } = await supabase
      .from('services')
      .insert(seedData.services)
      .select();

    if (error) {
      throw new Error(`Services insert failed: ${error.message}`);
    }

    console.log(`✅ Inserted ${data?.length || 0} services\n`);

    console.log('✅ Database seeding completed successfully!\n');
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
}

seedDatabase();
