package main

import (
	"context"
	"log"

	"github.com/joho/godotenv"
	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database"
)

func main() {
	_ = godotenv.Load()
	cfg := config.Load()

	db, err := database.NewPostgresDB(cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close() // this actually just defers closing a pool if it was a connection, but NewPostgresDB handles it cleanly

	ctx := context.Background()
	query := `
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
		)
		ON CONFLICT (user_id, date) DO NOTHING;
	`

	res, err := db.ExecContext(ctx, query)
	if err != nil {
		log.Fatalf("Failed to execute sync script: %v", err)
	}

	rows, _ := res.RowsAffected()
	log.Printf("Successfully injected %d missing Strava activities into the Calendar!", rows)
}
