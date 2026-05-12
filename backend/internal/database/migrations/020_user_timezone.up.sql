-- Phase 3.1 — timezone unification (foundation).
-- Adds the user-level IANA timezone preference and a per-activity local_date column.
-- This migration is a no-behavior-change foundation; subsequent PRs populate
-- these columns and switch read paths to use them.

ALTER TABLE user_profiles
    ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'UTC';

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS local_date DATE;

CREATE INDEX IF NOT EXISTS idx_activities_user_local_date
    ON activities(user_id, local_date);
