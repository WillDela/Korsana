package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

type Activity struct {
	ID                      uuid.UUID      `json:"id" db:"id"`
	UserID                  uuid.UUID      `json:"user_id" db:"user_id"`
	Source                  string         `json:"source" db:"source"`
	SourceActivityID        string         `json:"source_activity_id" db:"source_activity_id"`
	ActivityType            string         `json:"activity_type" db:"activity_type"`
	Name                    string         `json:"name" db:"name"`
	DistanceMeters          float64        `json:"distance_meters" db:"distance_meters"`
	DurationSeconds         int            `json:"duration_seconds" db:"duration_seconds"`
	StartTime               time.Time      `json:"start_time" db:"start_time"`
	AveragePaceSecondsPerKm float64        `json:"average_pace_seconds_per_km" db:"average_pace_seconds_per_km"`
	AverageHeartRate        *int           `json:"average_heart_rate" db:"average_heart_rate"`
	MaxHeartRate            *int           `json:"max_heart_rate" db:"max_heart_rate"`
	ElevationGainMeters     *float64       `json:"elevation_gain_meters" db:"elevation_gain_meters"`
	AverageCadence          *float64       `json:"average_cadence" db:"average_cadence"`
	SufferScore             *int           `json:"suffer_score" db:"suffer_score"`
	SyncedAt                time.Time      `json:"synced_at" db:"synced_at"`
	CustomFields            map[string]any `json:"custom_fields,omitempty" db:"-"`
}

func main() {
	db, err := sqlx.Connect("postgres", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}

	var activities []Activity
	err = db.SelectContext(context.Background(), &activities, `
		SELECT id, user_id, source, source_activity_id, activity_type,
			   name, distance_meters, duration_seconds, start_time,
			   average_pace_seconds_per_km, average_heart_rate,
			   max_heart_rate, elevation_gain_meters,
			   average_cadence, suffer_score, synced_at
		FROM activities
		ORDER BY start_time DESC
		LIMIT 30 OFFSET 0
	`)
	if err != nil {
		log.Fatalf("SelectContext error: %v", err)
	}
	fmt.Printf("Successfully fetched %d activities\n", len(activities))
}
