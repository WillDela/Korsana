-- Cross-training manual sessions
CREATE TABLE IF NOT EXISTS cross_training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  date DATE NOT NULL,
  duration_minutes INT NOT NULL,
  intensity VARCHAR(20),
  distance_meters FLOAT,
  notes TEXT,
  source VARCHAR(20) DEFAULT 'manual',
  strava_activity_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cross_training_user_date ON cross_training_sessions(user_id, date);

-- Shoe tracking
CREATE TABLE IF NOT EXISTS gear_shoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  brand VARCHAR(100),
  max_miles INT DEFAULT 450,
  date_purchased DATE,
  is_primary BOOL DEFAULT false,
  usage_label VARCHAR(100),
  is_active BOOL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_gear_shoes_user ON gear_shoes(user_id);

-- Manual race predictor overrides
CREATE TABLE IF NOT EXISTS manual_predictor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distance_label VARCHAR(20) NOT NULL,
  time_seconds INT NOT NULL,
  date_recorded DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_predictor_user ON manual_predictor_entries(user_id);
