package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// AutoMatchActivity finds a planned calendar entry on the activity's date
// and marks it completed if the activity type is compatible.
func (s *CalendarService) AutoMatchActivity(
	ctx context.Context,
	userID uuid.UUID,
	activity *models.Activity,
) error {
	date := activity.StartTime.UTC().Truncate(24 * time.Hour)

	var entry models.CalendarEntry
	err := s.db.GetContext(ctx, &entry, `
		SELECT * FROM training_calendar
		WHERE user_id = $1 AND date = $2 AND status = 'planned'
		LIMIT 1
	`, userID, date)

	// If we found a compatible planned entry, mark it completed.
	if err == nil && isActivityCompatibleWithWorkout(activity.ActivityType, entry.WorkoutType) {
		_, err = s.db.ExecContext(ctx, `
			UPDATE training_calendar
			SET status = 'completed', completed_activity_id = $1, updated_at = NOW()
			WHERE id = $2 AND user_id = $3 AND status = 'planned'
		`, activity.ID, entry.ID, userID)
		return err
	}

	// Otherwise, there was no planned entry (or it was incompatible).
	// We should create a new ad-hoc completed entry so this activity appears on the calendar.
	workoutType := mapActivityToWorkoutType(activity.ActivityType)

	newEntry := models.CalendarEntry{
		ID:                  uuid.New(),
		UserID:              userID,
		Date:                date,
		WorkoutType:         workoutType,
		Title:               activity.Name,
		Status:              "completed",
		CompletedActivityID: &activity.ID,
		Source:              "strava",
		CreatedAt:           time.Now(),
		UpdatedAt:           time.Now(),
	}

	// For runs, set distance explicitly. For all activities, set duration.
	durMins := int(activity.DurationSeconds / 60)
	newEntry.PlannedDurationMinutes = &durMins

	if workoutType == "easy" || workoutType == "long" || workoutType == "race" || workoutType == "interval" || workoutType == "tempo" {
		distInt := int(activity.DistanceMeters)
		newEntry.PlannedDistanceMeters = &distInt
	}

	// Check if this activity is already on the calendar
	var exists bool
	err = s.db.GetContext(ctx, &exists,
		`SELECT EXISTS(SELECT 1 FROM training_calendar
		 WHERE user_id = $1 AND completed_activity_id = $2)`,
		userID, activity.ID)
	if err != nil {
		return err
	}
	if exists {
		return nil
	}

	query := `
		INSERT INTO training_calendar (
			id, user_id, date, workout_type, title,
			planned_distance_meters, planned_duration_minutes,
			status, completed_activity_id, source, created_at, updated_at
		) VALUES (
			:id, :user_id, :date, :workout_type, :title,
			:planned_distance_meters, :planned_duration_minutes,
			:status, :completed_activity_id, :source, :created_at, :updated_at
		)
	`
	_, err = s.db.NamedExecContext(ctx, query, newEntry)
	return err
}

func mapActivityToWorkoutType(activityType string) string {
	if activityType == models.ActivityTypeRun {
		return "easy" // Default unmatched runs to 'easy'
	}
	if activityType == models.ActivityTypeRecovery {
		return "recovery"
	}
	// Everything else is cross training
	return "cross_train"
}

// isActivityCompatibleWithWorkout checks if an activity type matches a
// calendar workout type.
func isActivityCompatibleWithWorkout(activityType, workoutType string) bool {
	switch workoutType {
	case "easy", "tempo", "interval", "long", "race":
		return activityType == models.ActivityTypeRun
	case "cross_train":
		crossTrainTypes := map[string]bool{
			models.ActivityTypeCycling:       true,
			models.ActivityTypeSwimming:      true,
			models.ActivityTypeRowing:        true,
			models.ActivityTypeWalking:       true,
			models.ActivityTypeHiking:        true,
			models.ActivityTypeElliptical:    true,
			models.ActivityTypeStairMaster:   true,
			models.ActivityTypeWeightLifting: true,
		}
		return crossTrainTypes[activityType]
	case "recovery":
		return activityType == models.ActivityTypeRecovery
	default:
		return false
	}
}

// CalendarService handles training calendar business logic
type CalendarService struct {
	db *database.DB
}

// NewCalendarService creates a new calendar service
func NewCalendarService(db *database.DB) *CalendarService {
	return &CalendarService{
		db: db,
	}
}

// GetWeekEntries retrieves calendar entries for a 7-day period starting from weekStart
func (s *CalendarService) GetWeekEntries(ctx context.Context, userID uuid.UUID, weekStart time.Time) ([]models.CalendarEntry, error) {
	weekEnd := weekStart.AddDate(0, 0, 7)

	var entries []models.CalendarEntry
	query := `
		SELECT * FROM training_calendar
		WHERE user_id = $1 AND date >= $2 AND date < $3
		ORDER BY date ASC
	`
	err := s.db.SelectContext(ctx, &entries, query, userID, weekStart, weekEnd)
	if err != nil {
		return nil, err
	}
	return entries, nil
}

// GetRangeEntries retrieves calendar entries for an explicit date range
func (s *CalendarService) GetRangeEntries(ctx context.Context, userID uuid.UUID, start, end time.Time) ([]models.CalendarEntry, error) {
	var entries []models.CalendarEntry
	query := `
		SELECT * FROM training_calendar
		WHERE user_id = $1 AND date >= $2 AND date <= $3
		ORDER BY date ASC
	`
	err := s.db.SelectContext(ctx, &entries, query, userID, start, end)
	if err != nil {
		return nil, err
	}
	return entries, nil
}

// CreateEntry inserts a new calendar entry and returns it.
func (s *CalendarService) CreateEntry(ctx context.Context, userID uuid.UUID, entry *models.CalendarEntry) (*models.CalendarEntry, error) {
	entry.ID = uuid.New()
	entry.UserID = userID
	entry.CreatedAt = time.Now()
	entry.UpdatedAt = time.Now()

	if entry.Source == "" {
		entry.Source = "manual"
	}

	query := `
		INSERT INTO training_calendar (
			id, user_id, date, workout_type, title, description,
			planned_distance_meters, planned_duration_minutes, planned_pace_per_km,
			status, completed_activity_id, source, created_at, updated_at
		) VALUES (
			:id, :user_id, :date, :workout_type, :title, :description,
			:planned_distance_meters, :planned_duration_minutes, :planned_pace_per_km,
			:status, :completed_activity_id, :source, :created_at, :updated_at
		)
	`
	_, err := s.db.NamedExecContext(ctx, query, entry)
	if err != nil {
		return nil, err
	}

	var result models.CalendarEntry
	err = s.db.GetContext(ctx, &result,
		"SELECT * FROM training_calendar WHERE id = $1", entry.ID)
	if err != nil {
		return nil, err
	}
	return &result, nil
}

// UpdateEntry updates an existing calendar entry by ID and returns it.
func (s *CalendarService) UpdateEntry(ctx context.Context, userID uuid.UUID, entryID uuid.UUID, entry *models.CalendarEntry) (*models.CalendarEntry, error) {
	query := `
		UPDATE training_calendar SET
			date = $1, workout_type = $2, title = $3, description = $4,
			planned_distance_meters = $5, planned_duration_minutes = $6,
			planned_pace_per_km = $7, status = $8, updated_at = $9
		WHERE id = $10 AND user_id = $11
	`
	result, err := s.db.ExecContext(ctx, query,
		entry.Date, entry.WorkoutType, entry.Title, entry.Description,
		entry.PlannedDistanceMeters, entry.PlannedDurationMinutes,
		entry.PlannedPacePerKm, entry.Status, time.Now(),
		entryID, userID,
	)
	if err != nil {
		return nil, err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, errors.New("entry not found")
	}

	var updated models.CalendarEntry
	err = s.db.GetContext(ctx, &updated,
		"SELECT * FROM training_calendar WHERE id = $1 AND user_id = $2",
		entryID, userID)
	if err != nil {
		return nil, err
	}
	return &updated, nil
}

// DeleteEntry deletes a calendar entry
func (s *CalendarService) DeleteEntry(ctx context.Context, userID uuid.UUID, entryID uuid.UUID) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM training_calendar WHERE id = $1 AND user_id = $2", entryID, userID)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("entry not found")
	}

	return nil
}

// UpdateStatus updates the status of a calendar entry
func (s *CalendarService) UpdateStatus(ctx context.Context, userID uuid.UUID, entryID uuid.UUID, status string, activityID *uuid.UUID) (*models.CalendarEntry, error) {
	// Validate status
	validStatuses := map[string]bool{"planned": true, "completed": true, "missed": true, "skipped": true}
	if !validStatuses[status] {
		return nil, errors.New("invalid status: must be planned, completed, missed, or skipped")
	}

	query := `
		UPDATE training_calendar
		SET status = $1, completed_activity_id = $2, updated_at = $3
		WHERE id = $4 AND user_id = $5
	`
	result, err := s.db.ExecContext(ctx, query, status, activityID, time.Now(), entryID, userID)
	if err != nil {
		return nil, err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, errors.New("entry not found")
	}

	var entry models.CalendarEntry
	err = s.db.GetContext(ctx, &entry, "SELECT * FROM training_calendar WHERE id = $1 AND user_id = $2", entryID, userID)
	if err != nil {
		return nil, err
	}
	return &entry, nil
}
