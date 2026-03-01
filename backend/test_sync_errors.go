package main

import (
	"context"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/korsana/backend/internal/models"
	"github.com/korsana/backend/pkg/strava"
	_ "github.com/lib/pq"
)

// mapStravaType is a copy of what's in strava_service.go
func mapStravaType(stravaType, sportType string) string {
	t := sportType
	if t == "" {
		t = stravaType
	}
	switch t {
	case "Run", "VirtualRun":
		return models.ActivityTypeRun
	case "Ride", "VirtualRide", "EBikeRide":
		return models.ActivityTypeCycling
	case "Swim":
		return models.ActivityTypeSwimming
	case "Walk":
		return models.ActivityTypeWalking
	case "Hike":
		return models.ActivityTypeHiking
	case "Rowing", "Canoeing":
		return models.ActivityTypeRowing
	case "Elliptical":
		return models.ActivityTypeElliptical
	case "StairStepper":
		return models.ActivityTypeStairMaster
	case "WeightTraining":
		return models.ActivityTypeWeightLifting
	case "Yoga", "Stretching":
		return models.ActivityTypeRecovery
	default:
		return models.ActivityTypeWorkout
	}
}

func main() {
	db, err := sqlx.Connect("postgres", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}

	var accessToken string
	err = db.Get(&accessToken, "SELECT access_token FROM strava_connections LIMIT 1")
	if err != nil {
		log.Fatalln("No token found")
	}

	var userID uuid.UUID
	err = db.Get(&userID, "SELECT user_id FROM strava_connections LIMIT 1")
	if err != nil {
		log.Fatalln("No user found")
	}

	client := strava.NewClient("", "", "")
	activities, err := client.GetActivities(accessToken, 1, 30)
	if err != nil {
		log.Fatalln(err)
	}

	for _, act := range activities {
		startTime, err := time.Parse(time.RFC3339, act.StartDate)
		if err != nil {
			fmt.Printf("Time parse error for %d: %v\n", act.ID, err)
			continue
		}

		internalType := mapStravaType(act.Type, act.SportType)

		var avgPace float64
		if models.DistanceBasedTypes[internalType] && act.Distance > 0 {
			distanceKm := act.Distance / 1000.0
			avgPace = float64(act.MovingTime) / distanceKm
		}

		var avgHR *int
		if act.AverageHeartrate > 0 {
			hr := int(act.AverageHeartrate)
			avgHR = &hr
		}

		var elevGain *float64
		if act.TotalElevationGain > 0 {
			elevGain = &act.TotalElevationGain
		}

		var maxHR *int
		if act.MaxHeartrate > 0 {
			mhr := int(act.MaxHeartrate)
			maxHR = &mhr
		}

		var cadence *float64
		if act.AverageCadence > 0 {
			cadence = &act.AverageCadence
		}

		var sufferScore *int
		if act.SufferScore > 0 {
			ss := act.SufferScore
			sufferScore = &ss
		}

		activity := &models.Activity{
			ID:                      uuid.New(),
			UserID:                  userID,
			Source:                  "strava",
			SourceActivityID:        fmt.Sprintf("%d", act.ID),
			ActivityType:            internalType,
			Name:                    act.Name,
			DistanceMeters:          act.Distance,
			DurationSeconds:         act.MovingTime,
			StartTime:               startTime,
			AveragePaceSecondsPerKm: avgPace,
			AverageHeartRate:        avgHR,
			MaxHeartRate:            maxHR,
			ElevationGainMeters:     elevGain,
			AverageCadence:          cadence,
			SufferScore:             sufferScore,
			SyncedAt:                time.Now(),
		}

		query := `
			INSERT INTO activities (
				id, user_id, source, source_activity_id, activity_type, name,
				distance_meters, duration_seconds, start_time, average_pace_seconds_per_km,
				average_heart_rate, max_heart_rate, elevation_gain_meters,
				average_cadence, suffer_score, synced_at
			) VALUES (
				:id, :user_id, :source, :source_activity_id, :activity_type, :name,
				:distance_meters, :duration_seconds, :start_time, :average_pace_seconds_per_km,
				:average_heart_rate, :max_heart_rate, :elevation_gain_meters,
				:average_cadence, :suffer_score, :synced_at
			)
			ON CONFLICT (source, source_activity_id) DO UPDATE SET
				name = EXCLUDED.name,
				activity_type = EXCLUDED.activity_type,
				distance_meters = EXCLUDED.distance_meters,
				duration_seconds = EXCLUDED.duration_seconds,
				average_pace_seconds_per_km = EXCLUDED.average_pace_seconds_per_km,
				average_heart_rate = EXCLUDED.average_heart_rate,
				max_heart_rate = EXCLUDED.max_heart_rate,
				elevation_gain_meters = EXCLUDED.elevation_gain_meters,
				average_cadence = EXCLUDED.average_cadence,
				suffer_score = EXCLUDED.suffer_score,
				synced_at = EXCLUDED.synced_at
		`

		_, err = db.NamedExecContext(context.Background(), query, activity)
		if err != nil {
			fmt.Printf("DB error for activity %d (Type: %s): %v\n", act.ID, act.Type, err)
		}
	}
}
