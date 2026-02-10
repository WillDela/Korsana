package services

import (
	"context"
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

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

// UpsertEntry creates or updates a calendar entry (upsert on user_id + date)
func (s *CalendarService) UpsertEntry(ctx context.Context, userID uuid.UUID, entry *models.CalendarEntry) (*models.CalendarEntry, error) {
	entry.UserID = userID
	entry.UpdatedAt = time.Now()

	if entry.ID == uuid.Nil {
		entry.ID = uuid.New()
		entry.CreatedAt = time.Now()
	}

	query := `
		INSERT INTO training_calendar (
			id, user_id, date, workout_type, title, description,
			planned_distance_meters, planned_duration_minutes, planned_pace_per_km,
			status, completed_activity_id, created_at, updated_at
		) VALUES (
			:id, :user_id, :date, :workout_type, :title, :description,
			:planned_distance_meters, :planned_duration_minutes, :planned_pace_per_km,
			:status, :completed_activity_id, :created_at, :updated_at
		)
		ON CONFLICT (user_id, date) DO UPDATE SET
			workout_type = EXCLUDED.workout_type,
			title = EXCLUDED.title,
			description = EXCLUDED.description,
			planned_distance_meters = EXCLUDED.planned_distance_meters,
			planned_duration_minutes = EXCLUDED.planned_duration_minutes,
			planned_pace_per_km = EXCLUDED.planned_pace_per_km,
			status = EXCLUDED.status,
			completed_activity_id = EXCLUDED.completed_activity_id,
			updated_at = EXCLUDED.updated_at
	`
	_, err := s.db.NamedExecContext(ctx, query, entry)
	if err != nil {
		return nil, err
	}

	// Fetch the upserted entry to return it with correct ID (in case of conflict)
	var result models.CalendarEntry
	err = s.db.GetContext(ctx, &result, "SELECT * FROM training_calendar WHERE user_id = $1 AND date = $2", userID, entry.Date)
	if err != nil {
		return nil, err
	}
	return &result, nil
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
