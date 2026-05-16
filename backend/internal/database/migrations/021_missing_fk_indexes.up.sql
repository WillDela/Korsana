-- Phase 3.4 — backfill missing user_id indexes.
-- strava_connections, personal_records, and training_zones all have a
-- user_id FK but no index on it, so per-user lookups scan. Verified
-- against migrations 001-020 — these three indexes do not exist yet.

CREATE INDEX IF NOT EXISTS idx_strava_connections_user_id
    ON strava_connections(user_id);

CREATE INDEX IF NOT EXISTS idx_personal_records_user_id
    ON personal_records(user_id);

CREATE INDEX IF NOT EXISTS idx_training_zones_user_id
    ON training_zones(user_id);
