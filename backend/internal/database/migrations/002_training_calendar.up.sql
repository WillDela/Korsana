-- Create training_calendar table
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
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_training_calendar_user_date
    ON training_calendar(user_id, date);
