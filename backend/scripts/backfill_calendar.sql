-- Backfill activities into the calendar
INSERT INTO training_calendar (
    id, user_id, date, workout_type, title,
    planned_distance_meters, planned_duration_minutes,
    status, completed_activity_id, source, created_at, updated_at
)
SELECT
    gen_random_uuid(), user_id, date_trunc('day', start_time),
    CASE 
        WHEN activity_type = 'run' THEN 'easy' 
        WHEN activity_type = 'recovery' THEN 'recovery' 
        ELSE 'cross_train' 
    END AS workout_type,
    name,
    CASE WHEN activity_type = 'run' THEN distance_meters ELSE NULL END AS planned_distance_meters,
    duration_seconds / 60 AS planned_duration_minutes,
    'completed' AS status,
    id AS completed_activity_id,
    'strava' AS source,
    NOW(), NOW()
FROM activities
WHERE NOT EXISTS (
    SELECT 1 FROM training_calendar tc WHERE tc.completed_activity_id = activities.id
);
