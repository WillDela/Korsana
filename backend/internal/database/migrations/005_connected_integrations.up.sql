-- Create connected_integrations table to track all OAuth connections per user.
-- Replaces the Strava-specific strava_connections table for future sources.
-- strava_connections is kept intact so existing Strava flows are not affected.
CREATE TABLE IF NOT EXISTS connected_integrations (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    source           VARCHAR(20) NOT NULL,
    access_token     TEXT NOT NULL,
    refresh_token    TEXT,
    token_expires_at TIMESTAMPTZ,
    external_user_id VARCHAR(100),
    is_active        BOOLEAN NOT NULL DEFAULT true,
    is_primary       BOOLEAN NOT NULL DEFAULT false,
    connected_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_synced_at   TIMESTAMPTZ,
    UNIQUE(user_id, source)
);

-- Only one primary source per user at the DB level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user
    ON connected_integrations(user_id)
    WHERE is_primary = true;

-- Fix activities unique index to be scoped per user.
-- The existing (source, source_activity_id) constraint is too broad —
-- two users could have the same source_activity_id from the same platform.
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_source_source_activity_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_user_source_id
    ON activities(user_id, source, source_activity_id);
