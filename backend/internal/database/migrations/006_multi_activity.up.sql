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
