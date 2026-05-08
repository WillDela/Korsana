-- Add unique constraint on strava_activity_id so Strava-synced cross-training
-- sessions can be upserted without creating duplicates on re-sync.
ALTER TABLE cross_training_sessions
  ADD COLUMN IF NOT EXISTS strava_activity_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_cross_training_strava_activity_id
  ON cross_training_sessions (strava_activity_id)
  WHERE strava_activity_id IS NOT NULL;
