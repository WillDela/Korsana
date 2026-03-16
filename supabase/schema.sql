-- ============================================================
-- Korsana — Supabase Schema
-- Run this entire file in SQL Editor → New query
-- ============================================================

-- ── 001: Core tables ─────────────────────────────────────────

-- password_hash is nullable because Supabase Auth manages passwords.
-- The trigger below auto-populates this table on every signup.
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS strava_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    strava_athlete_id BIGINT UNIQUE NOT NULL,
    access_token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,
    token_expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS race_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    race_name VARCHAR(255) NOT NULL,
    race_date DATE NOT NULL,
    race_distance_meters INTEGER NOT NULL,
    target_time_seconds INTEGER,
    goal_type VARCHAR(50) DEFAULT 'finish',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    source VARCHAR(50) NOT NULL,
    source_activity_id VARCHAR(255),
    activity_type VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    distance_meters FLOAT NOT NULL,
    duration_seconds INTEGER NOT NULL,
    start_time TIMESTAMP NOT NULL,
    average_pace_seconds_per_km FLOAT,
    average_heart_rate INTEGER,
    elevation_gain_meters FLOAT,
    synced_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS weekly_summaries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    week_start DATE NOT NULL,
    total_distance_meters FLOAT,
    total_duration_seconds INTEGER,
    run_count INTEGER,
    average_pace_seconds_per_km FLOAT,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_race_goals_user_id ON race_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON coach_conversations(user_id);

-- ── 002: Training calendar ───────────────────────────────────

CREATE TABLE IF NOT EXISTS training_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    workout_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    planned_distance_meters INTEGER,
    planned_duration_minutes INTEGER,
    planned_pace_per_km INTEGER,
    status VARCHAR(20) DEFAULT 'planned',
    completed_activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_calendar_user_date ON training_calendar(user_id, date);

-- ── 003: Calendar source column ──────────────────────────────

ALTER TABLE training_calendar
    ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'manual';

-- ── 004: Extra activity fields ───────────────────────────────

ALTER TABLE activities
    ADD COLUMN IF NOT EXISTS average_cadence FLOAT,
    ADD COLUMN IF NOT EXISTS suffer_score INTEGER,
    ADD COLUMN IF NOT EXISTS max_heart_rate INTEGER;

ALTER TABLE weekly_summaries
    ADD COLUMN IF NOT EXISTS longest_run_meters FLOAT,
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- ── 005: Connected integrations ──────────────────────────────

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_one_primary_per_user
    ON connected_integrations(user_id)
    WHERE is_primary = true;

CREATE UNIQUE INDEX IF NOT EXISTS idx_activities_user_source_id
    ON activities(user_id, source, source_activity_id);

-- ── 006: Multi-activity / cross-training ─────────────────────

ALTER TABLE activities ADD COLUMN IF NOT EXISTS custom_fields JSONB;

CREATE INDEX IF NOT EXISTS idx_activities_custom_fields
    ON activities USING gin(custom_fields) WHERE custom_fields IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_activities_user_type
    ON activities(user_id, activity_type);

CREATE TABLE IF NOT EXISTS cross_training_goals (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_type    VARCHAR(50) NOT NULL,
    sessions_per_week INTEGER NOT NULL CHECK (sessions_per_week BETWEEN 1 AND 14),
    is_active        BOOLEAN NOT NULL DEFAULT true,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, activity_type)
);

ALTER TABLE weekly_summaries
    ADD COLUMN IF NOT EXISTS cardio_session_count  INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS strength_session_count INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS activity_type_breakdown JSONB;

-- ── 007: Drop calendar unique constraint ─────────────────────

ALTER TABLE training_calendar DROP CONSTRAINT IF EXISTS training_calendar_user_id_date_key;

-- ── 008: User profiles ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    display_name VARCHAR(100),
    profile_picture_url TEXT,
    max_heart_rate INTEGER,
    resting_heart_rate INTEGER,
    weekly_distance_goal_meters INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS personal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    label VARCHAR(50) NOT NULL,
    distance_meters INTEGER,
    time_seconds INTEGER NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'manual',
    activity_id UUID REFERENCES activities(id) ON DELETE SET NULL,
    recorded_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, label)
);

CREATE TABLE IF NOT EXISTS training_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    zone_type VARCHAR(10) NOT NULL,
    zone_number INTEGER NOT NULL,
    label VARCHAR(50),
    description VARCHAR(100),
    min_value INTEGER,
    max_value INTEGER,
    is_auto_calculated BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, zone_type, zone_number)
);

-- ── 009: Profile preferences ─────────────────────────────────

ALTER TABLE user_profiles
  ADD COLUMN IF NOT EXISTS units_preference VARCHAR(10) NOT NULL DEFAULT 'metric',
  ADD COLUMN IF NOT EXISTS notify_weekly_summary BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_goal_reminders BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS notify_sync_failures BOOLEAN NOT NULL DEFAULT true;

-- ── 010: Coach rate limits ───────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_rate_limits (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date        DATE        NOT NULL DEFAULT CURRENT_DATE,
    used_count  INTEGER     NOT NULL DEFAULT 0,
    daily_limit INTEGER     NOT NULL DEFAULT 10,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, date),
    CONSTRAINT used_count_non_negative  CHECK (used_count >= 0),
    CONSTRAINT used_count_within_limit  CHECK (used_count <= daily_limit)
);

CREATE INDEX IF NOT EXISTS idx_coach_rate_limits_user_date
    ON coach_rate_limits (user_id, date);

CREATE OR REPLACE FUNCTION try_consume_coach_quota(
    p_user_id UUID,
    p_date    DATE
) RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_used  INTEGER;
    v_limit INTEGER;
BEGIN
    SELECT used_count, daily_limit
      INTO v_used, v_limit
      FROM coach_rate_limits
     WHERE user_id = p_user_id AND date = p_date
       FOR UPDATE;

    IF NOT FOUND THEN
        INSERT INTO coach_rate_limits (user_id, date, used_count, daily_limit)
             VALUES (p_user_id, p_date, 1, 10)
          RETURNING used_count INTO v_used;
        RETURN v_used;
    END IF;

    IF v_used >= v_limit THEN
        RETURN NULL;
    END IF;

    UPDATE coach_rate_limits
       SET used_count = used_count + 1,
           updated_at = NOW()
     WHERE user_id = p_user_id AND date = p_date
     RETURNING used_count INTO v_used;

    RETURN v_used;
END;
$$;

CREATE OR REPLACE FUNCTION get_coach_quota(
    p_user_id UUID,
    p_date    DATE
) RETURNS TABLE (used INTEGER, limit_val INTEGER)
LANGUAGE sql
AS $$
    SELECT used_count, daily_limit
      FROM coach_rate_limits
     WHERE user_id = p_user_id AND date = p_date
    UNION ALL
    SELECT 0, 10
     WHERE NOT EXISTS (
         SELECT 1 FROM coach_rate_limits
          WHERE user_id = p_user_id AND date = p_date
     );
$$;

-- ── 011: Coach sessions ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS coach_sessions (
    id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title      VARCHAR(120) NOT NULL DEFAULT 'New session',
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_coach_sessions_user
    ON coach_sessions (user_id, created_at DESC);

ALTER TABLE coach_conversations
    ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES coach_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_coach_conversations_session
    ON coach_conversations (session_id, created_at ASC);

-- ── 012: Dashboard metrics ───────────────────────────────────

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

CREATE TABLE IF NOT EXISTS manual_predictor_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  distance_label VARCHAR(20) NOT NULL,
  time_seconds INT NOT NULL,
  date_recorded DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_predictor_user ON manual_predictor_entries(user_id);

-- ── Supabase Auth trigger ────────────────────────────────────
-- Syncs auth.users → public.users automatically on every signup.

CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Keeps public.users.email in sync when user changes their email via Supabase.
CREATE OR REPLACE FUNCTION handle_auth_user_updated()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.users
     SET email = NEW.email, updated_at = NOW()
   WHERE id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_auth_user_updated();
