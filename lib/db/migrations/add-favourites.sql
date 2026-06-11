-- Add favourites table for saving favourite providers
CREATE TABLE IF NOT EXISTS favourites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS favourites_user_idx ON favourites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS favourites_user_provider_uq ON favourites(user_id, provider_id);
