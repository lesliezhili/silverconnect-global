-- SilverConnect Global Database Schema

-- Countries table
CREATE TABLE countries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  currency_code TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

INSERT INTO countries (code, name, currency_code, currency_symbol, tax_rate) VALUES
('AU', 'Australia', 'AUD', '$', 10.00),
('CN', 'China', 'CNY', '¥', 0.00),
('CA', 'Canada', 'CAD', '$', 13.00);

-- Services with 3-country pricing
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  subcategory TEXT,
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER,
  requires_material BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service prices per country
CREATE TABLE service_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  base_price DECIMAL(10,2) NOT NULL,
  price_with_tax DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_id, country_code)
);

-- Insert services with pricing
INSERT INTO services (category, name, description, duration_minutes) VALUES
-- CLEANING SERVICES
('cleaning', 'Standard Home Cleaning', 'Complete home cleaning including dusting, vacuuming, mopping all rooms', 120),
('cleaning', 'Deep Cleaning', 'Thorough 4-hour deep clean including appliances, windows, and hard-to-reach areas', 240),
('cleaning', 'Window Cleaning', 'Professional interior and exterior window cleaning', 90),
('cleaning', 'Oven & Fridge Cleaning', 'Deep clean of kitchen appliances interior and exterior', 60),
('cleaning', 'Carpet Steam Cleaning', 'Professional hot water extraction carpet cleaning per room', 120),

-- COOKING SERVICES
('cooking', 'Weekly Meal Prep', '5 days of healthy, pre-portioned meals with reheating instructions', 180),
('cooking', 'Daily Home Cooking', 'Fresh daily meals prepared in your kitchen', 60),
('cooking', 'Special Diet Meals', 'Custom meals for diabetes, low-sodium, gluten-free, or vegetarian diets', 60),
('cooking', 'Festive Feast Preparation', 'Complete holiday meal preparation for up to 8 guests', 240),
('cooking', 'Baking Service', 'Fresh bread, cookies, or cakes baked in your home', 90),

-- GARDENING SERVICES
('gardening', 'Lawn Mowing & Edging', 'Professional lawn care including mowing, edging, and blowing', 60),
('gardening', 'Hedge & Shrub Trimming', 'Precision trimming of hedges, bushes, and ornamental shrubs', 60),
('gardening', 'Complete Garden Tidy', 'Weeding, pruning, leaf removal, and general garden maintenance', 120),
('gardening', 'Tree Pruning', 'Safe professional pruning of small to medium trees', 90),
('gardening', 'Seasonal Planting', 'Flower and plant installation for spring/summer', 120),

-- PERSONAL CARE SERVICES
('personal', 'Shopping Assistant', 'Grocery shopping, errands, and delivery to your home', 60),
('personal', 'Medication Management', 'Daily medication reminders, pill organization, and tracking', 30),
('personal', 'Companionship Visit', 'Social visit, conversation, and wellness check', 120),
('personal', 'Transport to Appointments', 'Safe transport to medical appointments, shopping, or social outings', 60),
('personal', 'Technology Help', 'Help with smartphones, tablets, computers, and video calls with family', 60),

-- HOME MAINTENANCE
('maintenance', 'Handyman Services', 'Small home repairs: fixing leaks, hanging pictures, assembly', 60),
('maintenance', 'Air Conditioner Service', 'Filter cleaning, basic maintenance, and efficiency check', 60),
('maintenance', 'Gutter Cleaning', 'Safe single-story gutter cleaning and downspout check', 90),
('maintenance', 'Snow Shoveling', 'Driveway and walkway snow removal (Canada only)', 60),
('maintenance', 'Pressure Washing', 'Driveway, patio, or deck cleaning', 90);

-- Add pricing for each country
-- AUSTRALIA (AUD)
INSERT INTO service_prices (service_id, country_code, base_price, price_with_tax) VALUES
((SELECT id FROM services WHERE name = 'Standard Home Cleaning'), 'AU', 60, 66),
((SELECT id FROM services WHERE name = 'Deep Cleaning'), 'AU', 120, 132),
((SELECT id FROM services WHERE name = 'Window Cleaning'), 'AU', 80, 88),
((SELECT id FROM services WHERE name = 'Oven & Fridge Cleaning'), 'AU', 45, 49.50),
((SELECT id FROM services WHERE name = 'Carpet Steam Cleaning'), 'AU', 150, 165),
((SELECT id FROM services WHERE name = 'Weekly Meal Prep'), 'AU', 85, 93.50),
((SELECT id FROM services WHERE name = 'Daily Home Cooking'), 'AU', 45, 49.50),
((SELECT id FROM services WHERE name = 'Special Diet Meals'), 'AU', 55, 60.50),
((SELECT id FROM services WHERE name = 'Festive Feast Preparation'), 'AU', 180, 198),
((SELECT id FROM services WHERE name = 'Baking Service'), 'AU', 65, 71.50),
((SELECT id FROM services WHERE name = 'Lawn Mowing & Edging'), 'AU', 50, 55),
((SELECT id FROM services WHERE name = 'Hedge & Shrub Trimming'), 'AU', 65, 71.50),
((SELECT id FROM services WHERE name = 'Complete Garden Tidy'), 'AU', 95, 104.50),
((SELECT id FROM services WHERE name = 'Tree Pruning'), 'AU', 85, 93.50),
((SELECT id FROM services WHERE name = 'Seasonal Planting'), 'AU', 75, 82.50),
((SELECT id FROM services WHERE name = 'Shopping Assistant'), 'AU', 35, 38.50),
((SELECT id FROM services WHERE name = 'Medication Management'), 'AU', 25, 27.50),
((SELECT id FROM services WHERE name = 'Companionship Visit'), 'AU', 40, 44),
((SELECT id FROM services WHERE name = 'Transport to Appointments'), 'AU', 50, 55),
((SELECT id FROM services WHERE name = 'Technology Help'), 'AU', 40, 44),
((SELECT id FROM services WHERE name = 'Handyman Services'), 'AU', 70, 77),
((SELECT id FROM services WHERE name = 'Air Conditioner Service'), 'AU', 60, 66),
((SELECT id FROM services WHERE name = 'Gutter Cleaning'), 'AU', 80, 88),
((SELECT id FROM services WHERE name = 'Pressure Washing'), 'AU', 90, 99);

-- CHINA (CNY)
INSERT INTO service_prices (service_id, country_code, base_price, price_with_tax) VALUES
((SELECT id FROM services WHERE name = 'Standard Home Cleaning'), 'CN', 280, 280),
((SELECT id FROM services WHERE name = 'Deep Cleaning'), 'CN', 560, 560),
((SELECT id FROM services WHERE name = 'Window Cleaning'), 'CN', 375, 375),
((SELECT id FROM services WHERE name = 'Oven & Fridge Cleaning'), 'CN', 210, 210),
((SELECT id FROM services WHERE name = 'Carpet Steam Cleaning'), 'CN', 700, 700),
((SELECT id FROM services WHERE name = 'Weekly Meal Prep'), 'CN', 400, 400),
((SELECT id FROM services WHERE name = 'Daily Home Cooking'), 'CN', 210, 210),
((SELECT id FROM services WHERE name = 'Special Diet Meals'), 'CN', 258, 258),
((SELECT id FROM services WHERE name = 'Festive Feast Preparation'), 'CN', 840, 840),
((SELECT id FROM services WHERE name = 'Baking Service'), 'CN', 304, 304),
((SELECT id FROM services WHERE name = 'Lawn Mowing & Edging'), 'CN', 235, 235),
((SELECT id FROM services WHERE name = 'Hedge & Shrub Trimming'), 'CN', 304, 304),
((SELECT id FROM services WHERE name = 'Complete Garden Tidy'), 'CN', 445, 445),
((SELECT id FROM services WHERE name = 'Tree Pruning'), 'CN', 398, 398),
((SELECT id FROM services WHERE name = 'Seasonal Planting'), 'CN', 351, 351),
((SELECT id FROM services WHERE name = 'Shopping Assistant'), 'CN', 164, 164),
((SELECT id FROM services WHERE name = 'Medication Management'), 'CN', 117, 117),
((SELECT id FROM services WHERE name = 'Companionship Visit'), 'CN', 188, 188),
((SELECT id FROM services WHERE name = 'Transport to Appointments'), 'CN', 235, 235),
((SELECT id FROM services WHERE name = 'Technology Help'), 'CN', 188, 188),
((SELECT id FROM services WHERE name = 'Handyman Services'), 'CN', 328, 328),
((SELECT id FROM services WHERE name = 'Air Conditioner Service'), 'CN', 281, 281),
((SELECT id FROM services WHERE name = 'Gutter Cleaning'), 'CN', 375, 375),
((SELECT id FROM services WHERE name = 'Pressure Washing'), 'CN', 422, 422);

-- CANADA (CAD)
INSERT INTO service_prices (service_id, country_code, base_price, price_with_tax) VALUES
((SELECT id FROM services WHERE name = 'Standard Home Cleaning'), 'CA', 55, 62.15),
((SELECT id FROM services WHERE name = 'Deep Cleaning'), 'CA', 110, 124.30),
((SELECT id FROM services WHERE name = 'Window Cleaning'), 'CA', 75, 84.75),
((SELECT id FROM services WHERE name = 'Oven & Fridge Cleaning'), 'CA', 40, 45.20),
((SELECT id FROM services WHERE name = 'Carpet Steam Cleaning'), 'CA', 140, 158.20),
((SELECT id FROM services WHERE name = 'Weekly Meal Prep'), 'CA', 80, 90.40),
((SELECT id FROM services WHERE name = 'Daily Home Cooking'), 'CA', 42, 47.46),
((SELECT id FROM services WHERE name = 'Special Diet Meals'), 'CA', 50, 56.50),
((SELECT id FROM services WHERE name = 'Festive Feast Preparation'), 'CA', 170, 192.10),
((SELECT id FROM services WHERE name = 'Baking Service'), 'CA', 62, 70.06),
((SELECT id FROM services WHERE name = 'Lawn Mowing & Edging'), 'CA', 45, 50.85),
((SELECT id FROM services WHERE name = 'Hedge & Shrub Trimming'), 'CA', 58, 65.54),
((SELECT id FROM services WHERE name = 'Complete Garden Tidy'), 'CA', 90, 101.70),
((SELECT id FROM services WHERE name = 'Tree Pruning'), 'CA', 80, 90.40),
((SELECT id FROM services WHERE name = 'Seasonal Planting'), 'CA', 70, 79.10),
((SELECT id FROM services WHERE name = 'Shopping Assistant'), 'CA', 32, 36.16),
((SELECT id FROM services WHERE name = 'Medication Management'), 'CA', 22, 24.86),
((SELECT id FROM services WHERE name = 'Companionship Visit'), 'CA', 38, 42.94),
((SELECT id FROM services WHERE name = 'Transport to Appointments'), 'CA', 45, 50.85),
((SELECT id FROM services WHERE name = 'Technology Help'), 'CA', 38, 42.94),
((SELECT id FROM services WHERE name = 'Handyman Services'), 'CA', 65, 73.45),
((SELECT id FROM services WHERE name = 'Air Conditioner Service'), 'CA', 55, 62.15),
((SELECT id FROM services WHERE name = 'Gutter Cleaning'), 'CA', 72, 81.36),
((SELECT id FROM services WHERE name = 'Snow Shoveling'), 'CA', 40, 45.20),
((SELECT id FROM services WHERE name = 'Pressure Washing'), 'CA', 82, 92.66);

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  user_type TEXT DEFAULT 'customer', -- 'customer' or 'provider'
  country_code TEXT REFERENCES countries(code),
  city TEXT,
  address TEXT,
  postal_code TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  birth_date DATE,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  medical_notes TEXT,
  preferred_language TEXT DEFAULT 'EN',
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Providers table (for dual feedback)
CREATE TABLE service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  country_code TEXT REFERENCES countries(code),
  city TEXT,
  address TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  specialties TEXT[], -- Array of service IDs they provide
  bio TEXT,
  years_experience INTEGER,
  certifications TEXT[],
  profile_image TEXT,
  rating DECIMAL(3,1) DEFAULT 5.0,
  total_ratings INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP,
  available_hours TEXT, -- JSON format: {"monday": "9am-5pm", ...}
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  service_id UUID REFERENCES services(id),
  provider_id UUID REFERENCES service_providers(id),
  country_code TEXT REFERENCES countries(code),
  booking_date DATE NOT NULL,
  booking_time TIME NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  special_instructions TEXT,
  status TEXT DEFAULT 'PENDING', -- PENDING, CONFIRMED, COMPLETED, CANCELLED
  total_price DECIMAL(10,2),
  payment_status TEXT DEFAULT 'UNPAID',
  stripe_payment_intent_id TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Customer Feedback (customer rates provider and service)
CREATE TABLE customer_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id),
  provider_id UUID REFERENCES service_providers(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  punctuality_rating INTEGER CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  would_rebook BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider Feedback (provider rates customer experience)
CREATE TABLE provider_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id),
  customer_id UUID REFERENCES users(id),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  review TEXT,
  customer_preparation_rating INTEGER CHECK (customer_preparation_rating >= 1 AND customer_preparation_rating <= 5),
  accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  would_service_again BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider Pricing (custom rates set by each provider)
CREATE TABLE provider_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  country_code TEXT REFERENCES countries(code),
  custom_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, service_id, country_code)
);

-- Provider Availability
CREATE TABLE provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, day_of_week)
);

-- Payment Transactions
CREATE TABLE payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  stripe_payment_intent_id TEXT UNIQUE,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending', -- pending, succeeded, failed, refunded
  customer_email TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Messaging System - Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  last_message TEXT,
  last_message_at TIMESTAMP,
  customer_read_at TIMESTAMP,
  provider_read_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(booking_id)
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Booking Status History (for tracking acceptance/rejection)
CREATE TABLE booking_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  old_status TEXT,
  new_status TEXT,
  changed_by UUID REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_status_history ENABLE ROW LEVEL SECURITY;

-- Messaging RLS Policies
CREATE POLICY "Users can view conversations they're part of" ON conversations FOR SELECT USING (
  auth.uid() = customer_id OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = conversations.provider_id AND auth.uid() = service_providers.user_id)
);

CREATE POLICY "Users can create conversations" ON conversations FOR INSERT WITH CHECK (
  auth.uid() = customer_id OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = conversations.provider_id AND auth.uid() = service_providers.user_id)
);

CREATE POLICY "Users can view messages in their conversations" ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND 
    (auth.uid() = conversations.customer_id OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = conversations.provider_id AND auth.uid() = service_providers.user_id)))
);

CREATE POLICY "Users can send messages in their conversations" ON messages FOR INSERT WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM conversations WHERE conversations.id = messages.conversation_id AND 
    (auth.uid() = conversations.customer_id OR EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = conversations.provider_id AND auth.uid() = service_providers.user_id)))
);

CREATE POLICY "Anyone can view booking status history" ON booking_status_history FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = booking_status_history.booking_id AND 
    (auth.uid() = bookings.user_id OR (bookings.provider_id IS NOT NULL AND EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = bookings.provider_id AND auth.uid() = service_providers.user_id))))
);

-- Create policies
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Providers can view own bookings" ON bookings FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Anyone can view services" ON services FOR SELECT USING (true);
CREATE POLICY "Anyone can view service prices" ON service_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can view countries" ON countries FOR SELECT USING (true);
CREATE POLICY "Anyone can view providers" ON service_providers FOR SELECT USING (true);
CREATE POLICY "Anyone can view provider availability" ON provider_availability FOR SELECT USING (true);
CREATE POLICY "Providers can view own pricing" ON provider_pricing FOR SELECT USING (
  EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = provider_pricing.provider_id AND auth.uid() = service_providers.user_id)
);
CREATE POLICY "Providers can manage own pricing" ON provider_pricing FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM service_providers WHERE service_providers.id = provider_pricing.provider_id AND auth.uid() = service_providers.user_id)
);
CREATE POLICY "Users can view own feedback" ON customer_feedback FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Users can create own feedback" ON customer_feedback FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Providers can view own feedback" ON provider_feedback FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can create own feedback" ON provider_feedback FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Users can view own transactions" ON payment_transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM bookings WHERE bookings.id = payment_transactions.booking_id AND auth.uid() = bookings.user_id)
);
