package services

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// ActivityService handles manual activity creation and retrieval
type ActivityService struct {
	db *database.DB
}

// NewActivityService creates a new ActivityService
func NewActivityService(db *database.DB) *ActivityService {
	return &ActivityService{db: db}
}

// CreateActivityRequest holds input for creating a manual activity
type CreateActivityRequest struct {
	ActivityType     string    `json:"activity_type"`
	Name             string    `json:"name"`
	StartTime        time.Time `json:"start_time"`
	DurationSeconds  int       `json:"duration_seconds"`
	DistanceMeters   float64   `json:"distance_meters"`
	AverageHeartRate *int      `json:"average_heart_rate"`
	Notes            string    `json:"notes"`
	RPE              *int      `json:"rpe"`
	MuscleGroup      string    `json:"muscle_group"`
	Floors           *int      `json:"floors"`
	ResistanceLevel  *int      `json:"resistance_level"`
	Calories         *int      `json:"calories"`
}

// CreateManualActivity creates a manually logged activity
func (s *ActivityService) CreateManualActivity(
	ctx context.Context,
	userID uuid.UUID,
	req *CreateActivityRequest,
) (*models.Activity, error) {
	validTypes := map[string]bool{
		models.ActivityTypeRun:           true,
		models.ActivityTypeCycling:       true,
		models.ActivityTypeSwimming:      true,
		models.ActivityTypeWalking:       true,
		models.ActivityTypeHiking:        true,
		models.ActivityTypeRowing:        true,
		models.ActivityTypeElliptical:    true,
		models.ActivityTypeStairMaster:   true,
		models.ActivityTypeWeightLifting: true,
		models.ActivityTypeWorkout:       true,
		models.ActivityTypeRecovery:      true,
	}
	if !validTypes[req.ActivityType] {
		return nil, fmt.Errorf("invalid activity_type: %q", req.ActivityType)
	}
	if req.DurationSeconds <= 0 {
		return nil, errors.New("duration_seconds must be greater than 0")
	}

	customFields := map[string]any{}
	if req.RPE != nil {
		customFields["rpe"] = *req.RPE
	}
	if req.MuscleGroup != "" {
		customFields["muscle_group"] = req.MuscleGroup
	}
	if req.Floors != nil {
		customFields["floors"] = *req.Floors
	}
	if req.ResistanceLevel != nil {
		customFields["resistance_level"] = *req.ResistanceLevel
	}
	if req.Calories != nil {
		customFields["calories"] = *req.Calories
	}
	if req.Notes != "" {
		customFields["notes"] = req.Notes
	}

	var customFieldsJSON []byte
	if len(customFields) > 0 {
		var err error
		customFieldsJSON, err = json.Marshal(customFields)
		if err != nil {
			return nil, fmt.Errorf("failed to encode custom fields: %w", err)
		}
	}

	var avgPace float64
	if models.DistanceBasedTypes[req.ActivityType] && req.DistanceMeters > 0 {
		distanceKm := req.DistanceMeters / 1000.0
		avgPace = float64(req.DurationSeconds) / distanceKm
	}

	name := req.Name
	if name == "" {
		name = req.ActivityType
	}

	activity := &models.Activity{
		ID:                      uuid.New(),
		UserID:                  userID,
		Source:                  "manual",
		SourceActivityID:        uuid.New().String(),
		ActivityType:            req.ActivityType,
		Name:                    name,
		DistanceMeters:          req.DistanceMeters,
		DurationSeconds:         req.DurationSeconds,
		StartTime:               req.StartTime,
		AveragePaceSecondsPerKm: avgPace,
		AverageHeartRate:        req.AverageHeartRate,
		SyncedAt:                time.Now(),
	}

	if len(customFieldsJSON) > 0 {
		query := `
			INSERT INTO activities (
				id, user_id, source, source_activity_id, activity_type, name,
				distance_meters, duration_seconds, start_time,
				average_pace_seconds_per_km, average_heart_rate,
				synced_at, custom_fields
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13
			) RETURNING id
		`
		var returnedID uuid.UUID
		err := s.db.QueryRowContext(ctx, query,
			activity.ID, userID, activity.Source,
			activity.SourceActivityID, activity.ActivityType,
			activity.Name, activity.DistanceMeters,
			activity.DurationSeconds, activity.StartTime,
			activity.AveragePaceSecondsPerKm,
			activity.AverageHeartRate, activity.SyncedAt,
			customFieldsJSON,
		).Scan(&returnedID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert activity: %w", err)
		}
		activity.CustomFields = customFields
	} else {
		query := `
			INSERT INTO activities (
				id, user_id, source, source_activity_id, activity_type, name,
				distance_meters, duration_seconds, start_time,
				average_pace_seconds_per_km, average_heart_rate, synced_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
			) RETURNING id
		`
		var returnedID uuid.UUID
		err := s.db.QueryRowContext(ctx, query,
			activity.ID, userID, activity.Source,
			activity.SourceActivityID, activity.ActivityType,
			activity.Name, activity.DistanceMeters,
			activity.DurationSeconds, activity.StartTime,
			activity.AveragePaceSecondsPerKm,
			activity.AverageHeartRate, activity.SyncedAt,
		).Scan(&returnedID)
		if err != nil {
			return nil, fmt.Errorf("failed to insert activity: %w", err)
		}
	}

	return activity, nil
}

// GetUserActivities retrieves activities with optional type filter
func (s *ActivityService) GetUserActivities(
	ctx context.Context,
	userID uuid.UUID,
	activityType string,
	limit, offset int,
) ([]models.Activity, int, error) {
	if limit <= 0 {
		limit = 30
	}

	var total int
	var activities []models.Activity

	if activityType != "" {
		err := s.db.GetContext(ctx, &total,
			"SELECT COUNT(*) FROM activities WHERE user_id = $1 AND activity_type = $2",
			userID, activityType)
		if err != nil {
			return nil, 0, err
		}
		err = s.db.SelectContext(ctx, &activities, `
			SELECT id, user_id, source, source_activity_id, activity_type,
				   name, distance_meters, duration_seconds, start_time,
				   average_pace_seconds_per_km, average_heart_rate,
				   max_heart_rate, elevation_gain_meters,
				   average_cadence, suffer_score, synced_at
			FROM activities
			WHERE user_id = $1 AND activity_type = $2
			ORDER BY start_time DESC
			LIMIT $3 OFFSET $4
		`, userID, activityType, limit, offset)
		if err != nil {
			return nil, 0, err
		}
	} else {
		err := s.db.GetContext(ctx, &total,
			"SELECT COUNT(*) FROM activities WHERE user_id = $1", userID)
		if err != nil {
			return nil, 0, err
		}
		err = s.db.SelectContext(ctx, &activities, `
			SELECT id, user_id, source, source_activity_id, activity_type,
				   name, distance_meters, duration_seconds, start_time,
				   average_pace_seconds_per_km, average_heart_rate,
				   max_heart_rate, elevation_gain_meters,
				   average_cadence, suffer_score, synced_at
			FROM activities
			WHERE user_id = $1
			ORDER BY start_time DESC
			LIMIT $2 OFFSET $3
		`, userID, limit, offset)
		if err != nil {
			return nil, 0, err
		}
	}

	return activities, total, nil
}

// DeleteActivity deletes an activity if it belongs to the user
func (s *ActivityService) DeleteActivity(ctx context.Context, userID uuid.UUID, activityID uuid.UUID) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM activities WHERE id = $1 AND user_id = $2", activityID, userID)
	if err != nil {
		return fmt.Errorf("failed to delete activity: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected == 0 {
		return errors.New("activity not found or unauthorized")
	}

	return nil
}
