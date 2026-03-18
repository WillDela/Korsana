-- Ensure the per-user unique index on activities exists.
-- Migration 005 created this, but if it was skipped this provides a safe fallback.
-- The OLD global constraint (source, source_activity_id) must be dropped first
-- because it blocks the narrower per-user index from enforcing correctly.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_source_source_activity_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_user_source_id
    ON activities(user_id, source, source_activity_id);
