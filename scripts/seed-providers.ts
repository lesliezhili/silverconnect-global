import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const providers = [
  // Australia Providers
  {
    email: 'maria.santos@example.com',
    full_name: 'Maria Santos',
    phone: '0412 345 678',
    country_code: 'AU',
    city: 'Sydney',
    address: '45 Park Street, Sydney NSW 2000',
    latitude: -33.8688,
    longitude: 151.2093,
    bio: 'Experienced cleaner with 8 years in senior care. Specializes in deep cleaning and disinfection.',
    years_experience: 8,
    specialties: ['Standard Home Cleaning', 'Deep Cleaning', 'Window Cleaning'],
    certifications: ['First Aid', 'Disability Support'],
    profile_image: 'https://i.pravatar.cc/150?img=1',
    rating: 4.9,
    total_ratings: 48,
    is_verified: true,
  },
  {
    email: 'james.cook@example.com',
    full_name: 'James Cook',
    phone: '0423 456 789',
    country_code: 'AU',
    city: 'Melbourne',
    address: '123 Queen Street, Melbourne VIC 3000',
    latitude: -37.8136,
    longitude: 144.9631,
    bio: 'Professional chef with 15 years experience. Specializes in healthy meal prep for seniors.',
    years_experience: 15,
    specialties: ['Weekly Meal Prep', 'Daily Home Cooking', 'Special Diet Meals'],
    certifications: ['Food Safety', 'Nutrition'],
    profile_image: 'https://i.pravatar.cc/150?img=2',
    rating: 4.95,
    total_ratings: 62,
    is_verified: true,
  },
  {
    email: 'sarah.johnson@example.com',
    full_name: 'Sarah Johnson',
    phone: '0434 567 890',
    country_code: 'AU',
    city: 'Brisbane',
    address: '789 George Street, Brisbane QLD 4000',
    latitude: -27.4679,
    longitude: 153.0281,
    bio: 'Compassionate caregiver offering shopping and companionship services.',
    years_experience: 6,
    specialties: ['Shopping Assistant', 'Companionship Visit', 'Technology Help'],
    certifications: ['Aged Care', 'First Aid'],
    profile_image: 'https://i.pravatar.cc/150?img=3',
    rating: 4.85,
    total_ratings: 35,
    is_verified: true,
  },

  // US Providers
  {
    email: 'linda.patel@example.com',
    full_name: 'Linda Patel',
    phone: '(212) 555-0142',
    country_code: 'US',
    city: 'New York',
    address: '350 5th Avenue, New York, NY 10118',
    latitude: 40.7484,
    longitude: -73.9857,
    bio: 'Experienced housekeeper with 10 years caring for senior clients. Specializes in deep cleaning and disinfection.',
    years_experience: 10,
    specialties: ['Standard Home Cleaning', 'Deep Cleaning', 'Carpet Steam Cleaning'],
    certifications: ['Home Care Certificate'],
    profile_image: 'https://i.pravatar.cc/150?img=4',
    rating: 4.9,
    total_ratings: 71,
    is_verified: true,
  },
  {
    email: 'robert.garcia@example.com',
    full_name: 'Robert Garcia',
    phone: '(323) 555-0188',
    country_code: 'US',
    city: 'Los Angeles',
    address: '6801 Hollywood Blvd, Los Angeles, CA 90028',
    latitude: 34.1016,
    longitude: -118.3267,
    bio: 'Professional home chef with 20 years of experience cooking healthy, dietitian-approved meals for elderly clients.',
    years_experience: 20,
    specialties: ['Daily Home Cooking', 'Weekly Meal Prep', 'Special Diet Meals'],
    certifications: ['Professional Chef', 'Nutrition'],
    profile_image: 'https://i.pravatar.cc/150?img=5',
    rating: 4.97,
    total_ratings: 89,
    is_verified: true,
  },
  {
    email: 'diana.nguyen@example.com',
    full_name: 'Diana Nguyen',
    phone: '(312) 555-0167',
    country_code: 'US',
    city: 'Chicago',
    address: '233 S Wacker Dr, Chicago, IL 60606',
    latitude: 41.8789,
    longitude: -87.6359,
    bio: 'Caring companion offering shopping assistance and companionship visits to seniors.',
    years_experience: 8,
    specialties: ['Companionship Visit', 'Shopping Assistant', 'Transport to Appointments'],
    certifications: ['Elder Care', 'First Aid'],
    profile_image: 'https://i.pravatar.cc/150?img=6',
    rating: 4.88,
    total_ratings: 52,
    is_verified: true,
  },

  // Canada Providers
  {
    email: 'pierre.dupont@example.com',
    full_name: 'Pierre Dupont',
    phone: '(514) 123-4567',
    country_code: 'CA',
    city: 'Montreal',
    address: '123 Rue Sainte-Catherine, Montreal QC H2X 1Z6',
    latitude: 45.5017,
    longitude: -73.5673,
    bio: 'Professional housekeeper with 12 years experience in senior homes.',
    years_experience: 12,
    specialties: ['Standard Home Cleaning', 'Deep Cleaning', 'Oven & Fridge Cleaning'],
    certifications: ['Housekeeping Professional', 'First Aid'],
    profile_image: 'https://i.pravatar.cc/150?img=7',
    rating: 4.92,
    total_ratings: 56,
    is_verified: true,
  },
  {
    email: 'jennifer.green@example.com',
    full_name: 'Jennifer Green',
    phone: '(416) 234-5678',
    country_code: 'CA',
    city: 'Toronto',
    address: '456 King Street West, Toronto ON M5H 2Y2',
    latitude: 43.6426,
    longitude: -79.4196,
    bio: 'Chef and nutritionist specializing in healthy meals for elderly clients.',
    years_experience: 14,
    specialties: ['Weekly Meal Prep', 'Special Diet Meals', 'Festive Feast Preparation'],
    certifications: ['Nutritionist', 'Food Safety'],
    profile_image: 'https://i.pravatar.cc/150?img=8',
    rating: 4.94,
    total_ratings: 68,
    is_verified: true,
  },
  {
    email: 'michael.tech@example.com',
    full_name: 'Michael Chen',
    phone: '(604) 345-6789',
    country_code: 'CA',
    city: 'Vancouver',
    address: '789 Granville Street, Vancouver BC V6Z 1L3',
    latitude: 49.2827,
    longitude: -123.1207,
    bio: 'Tech-savvy caregiver helping seniors with technology and shopping.',
    years_experience: 7,
    specialties: ['Technology Help', 'Shopping Assistant', 'Companionship Visit'],
    certifications: ['Tech Support', 'Elder Care'],
    profile_image: 'https://i.pravatar.cc/150?img=9',
    rating: 4.87,
    total_ratings: 44,
    is_verified: true,
  },
];

async function seedProviders() {
  try {
    console.log('🌱 Seeding service providers...');

    for (const provider of providers) {
      try {
        // Create auth user
        const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
          email: provider.email,
          password: 'ProviderPassword123!',
          email_confirm: true,
        });

        if (authError) {
          console.log(`⚠️  Auth user already exists for ${provider.email}`);
          continue;
        }

        if (!authUser.user) continue;

        // Create user profile
        const { error: userError } = await supabase.from('users').insert({
          id: authUser.user.id,
          email: provider.email,
          full_name: provider.full_name,
          phone: provider.phone,
          user_type: 'provider',
          country_code: provider.country_code,
          city: provider.city,
          address: provider.address,
          latitude: provider.latitude,
          longitude: provider.longitude,
        });

        if (userError) {
          console.error(`❌ Error creating user for ${provider.email}:`, userError);
          continue;
        }

        // Create provider profile
        const { error: providerError } = await supabase.from('service_providers').insert({
          user_id: authUser.user.id,
          email: provider.email,
          full_name: provider.full_name,
          phone: provider.phone,
          country_code: provider.country_code,
          city: provider.city,
          address: provider.address,
          latitude: provider.latitude,
          longitude: provider.longitude,
          bio: provider.bio,
          years_experience: provider.years_experience,
          specialties: provider.specialties,
          certifications: provider.certifications,
          profile_image: provider.profile_image,
          rating: provider.rating,
          total_ratings: provider.total_ratings,
          is_verified: provider.is_verified,
        });

        if (providerError) {
          console.error(`❌ Error creating provider for ${provider.email}:`, providerError);
          continue;
        }

        // Create availability (Monday-Friday, 8am-6pm)
        for (let day = 1; day <= 5; day++) {
          await supabase.from('provider_availability').insert({
            provider_id: (
              await supabase
                .from('service_providers')
                .select('id')
                .eq('email', provider.email)
                .single()
            ).data?.id,
            day_of_week: day,
            start_time: '08:00:00',
            end_time: '18:00:00',
            is_available: true,
          });
        }

        console.log(`✅ Created provider: ${provider.full_name} (${provider.country_code})`);
      } catch (error) {
        console.error(`Error processing provider ${provider.email}:`, error);
      }
    }

    console.log('✨ Seeding complete!');
  } catch (error) {
    console.error('🔥 Seeding failed:', error);
  }
}

seedProviders();
