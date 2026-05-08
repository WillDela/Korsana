-- Create user_profiles table
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

-- Create personal_records table
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

-- Create training_zones table
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
