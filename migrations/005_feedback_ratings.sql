-- =====================================================
-- MODULE 5: Feedback, Ratings & Reputation
-- =====================================================

-- Ratings table (already exists, adding more fields)
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS response_text TEXT;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS response_at TIMESTAMP;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE ratings ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Rating reports (for flagged reviews)
CREATE TABLE IF NOT EXISTS rating_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES users(id),
  reason TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending', -- pending, reviewed, upheld, dismissed
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Provider responses to ratings
CREATE TABLE IF NOT EXISTS rating_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id UUID REFERENCES ratings(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id),
  response_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Monthly/quarterly provider stats
CREATE TABLE IF NOT EXISTS provider_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_bookings INTEGER DEFAULT 0,
  completed_bookings INTEGER DEFAULT 0,
  cancelled_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  total_ratings INTEGER DEFAULT 0,
  five_star_count INTEGER DEFAULT 0,
  four_star_count INTEGER DEFAULT 0,
  three_star_count INTEGER DEFAULT 0,
  two_star_count INTEGER DEFAULT 0,
  one_star_count INTEGER DEFAULT 0,
  response_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider_id, period_start, period_end)
);

-- Badges/Achievements
CREATE TABLE IF NOT EXISTS provider_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  badge_type TEXT NOT NULL, -- 'top_rated', 'fast_responder', 'gold_customer', 'verified', 'super_provider'
  badge_name TEXT NOT NULL,
  badge_description TEXT,
  awarded_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  UNIQUE(provider_id, badge_type)
);

-- RLS Policies
ALTER TABLE rating_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_badges ENABLE ROW LEVEL SECURITY;

-- Users can view ratings
CREATE POLICY "Anyone can view ratings" ON ratings
  FOR SELECT USING (is_public = true);

-- Providers can respond to ratings
CREATE POLICY "Providers can respond to ratings" ON rating_responses
  FOR ALL USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Users can report ratings
CREATE POLICY "Users can report ratings" ON rating_reports
  FOR INSERT WITH CHECK (reported_by = auth.uid());

-- Providers can view their stats
CREATE POLICY "Providers can view own stats" ON provider_stats
  FOR SELECT USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Providers can view their badges
CREATE POLICY "Providers can view own badges" ON provider_badges
  FOR SELECT USING (
    provider_id IN (SELECT id FROM service_providers WHERE user_id = auth.uid())
  );

-- Function to update provider average rating
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_provider_id UUID;
  v_avg_rating DECIMAL(3,2);
  v_total INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_provider_id := NEW.provider_id;
  ELSE
    v_provider_id := OLD.provider_id;
  END IF;

  SELECT AVG(rating)::DECIMAL(3,2), COUNT(*) INTO v_avg_rating, v_total
  FROM ratings 
  WHERE provider_id = v_provider_id AND is_public = true;

  UPDATE service_providers 
  SET rating = COALESCE(v_avg_rating, 5.0), 
      total_ratings = COALESCE(v_total, 0)
  WHERE id = v_provider_id;

  IF TG_OP = 'INSERT' THEN
    RETURN NEW;
  ELSE
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_rating_trigger
  AFTER INSERT OR DELETE ON ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();