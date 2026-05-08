-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create strava_connections table
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

-- Create race_goals table
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

-- Create activities table
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
    synced_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(source, source_activity_id)
);

-- Create coach_conversations table
CREATE TABLE IF NOT EXISTS coach_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create weekly_summaries table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_time ON activities(start_time);
CREATE INDEX IF NOT EXISTS idx_race_goals_user_id ON race_goals(user_id);
CREATE INDEX IF NOT EXISTS idx_coach_conversations_user_id ON coach_conversations(user_id);
