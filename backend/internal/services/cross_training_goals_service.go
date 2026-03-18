package services

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// CrossTrainingGoalsService manages weekly cross-training targets
type CrossTrainingGoalsService struct {
	db *database.DB
}

// NewCrossTrainingGoalsService creates a new CrossTrainingGoalsService
func NewCrossTrainingGoalsService(db *database.DB) *CrossTrainingGoalsService {
	return &CrossTrainingGoalsService{db: db}
}

// UpsertGoal creates or updates a cross-training goal
func (s *CrossTrainingGoalsService) UpsertGoal(
	ctx context.Context,
	userID uuid.UUID,
	activityType string,
	sessionsPerWeek int,
) (*models.CrossTrainingGoal, error) {
	if sessionsPerWeek < 1 || sessionsPerWeek > 14 {
		return nil, fmt.Errorf(
			"sessions_per_week must be between 1 and 14, got %d",
			sessionsPerWeek,
		)
	}

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
	if !validTypes[activityType] {
		return nil, fmt.Errorf("invalid activity_type: %q", activityType)
	}

	query := `
		INSERT INTO cross_training_goals
			(user_id, activity_type, sessions_per_week, is_active, updated_at)
		VALUES ($1, $2, $3, true, NOW())
		ON CONFLICT (user_id, activity_type) DO UPDATE SET
			sessions_per_week = EXCLUDED.sessions_per_week,
			is_active = true,
			updated_at = NOW()
		RETURNING id, user_id, activity_type, sessions_per_week,
		          is_active, created_at, updated_at
	`
	var goal models.CrossTrainingGoal
	err := s.db.QueryRowContext(
		ctx, query, userID, activityType, sessionsPerWeek,
	).Scan(
		&goal.ID, &goal.UserID, &goal.ActivityType,
		&goal.SessionsPerWeek, &goal.IsActive,
		&goal.CreatedAt, &goal.UpdatedAt,
	)
	if err != nil {
		return nil, fmt.Errorf("failed to upsert cross-training goal: %w", err)
	}
	return &goal, nil
}

// GetGoals returns all active cross-training goals for a user
func (s *CrossTrainingGoalsService) GetGoals(
	ctx context.Context,
	userID uuid.UUID,
) ([]models.CrossTrainingGoal, error) {
	var goals []models.CrossTrainingGoal
	err := s.db.SelectContext(ctx, &goals, `
		SELECT id, user_id, activity_type, sessions_per_week,
		       is_active, created_at, updated_at
		FROM cross_training_goals
		WHERE user_id = $1 AND is_active = true
		ORDER BY created_at ASC
	`, userID)
	if err != nil {
		return nil, err
	}
	return goals, nil
}

// DeleteGoal soft-deletes a cross-training goal
func (s *CrossTrainingGoalsService) DeleteGoal(
	ctx context.Context,
	userID uuid.UUID,
	goalID uuid.UUID,
) error {
	result, err := s.db.ExecContext(ctx, `
		UPDATE cross_training_goals
		SET is_active = false, updated_at = NOW()
		WHERE id = $1 AND user_id = $2
	`, goalID, userID)
	if err != nil {
		return err
	}
	rows, _ := result.RowsAffected()
	if rows == 0 {
		return errors.New("goal not found")
	}
	return nil
}

// GetWeeklyProgress returns session counts this week per activity type,
// combining Strava-synced activities and manually logged cross-training sessions.
func (s *CrossTrainingGoalsService) GetWeeklyProgress(
	ctx context.Context,
	userID uuid.UUID,
) (map[string]int, error) {
	result := make(map[string]int)

	// Count from Strava-synced activities (excludes runs).
	type actRow struct {
		ActivityType string `db:"activity_type"`
		Count        int    `db:"count"`
	}
	var actRows []actRow
	if err := s.db.SelectContext(ctx, &actRows, `
		SELECT activity_type, COUNT(*) as count
		FROM activities
		WHERE user_id = $1
		  AND activity_type != 'run'
		  AND start_time >= date_trunc('week', NOW())
		  AND start_time < date_trunc('week', NOW()) + INTERVAL '7 days'
		GROUP BY activity_type
	`, userID); err != nil {
		return nil, err
	}
	for _, r := range actRows {
		result[r.ActivityType] += r.Count
	}

	// Count from manually logged cross-training sessions.
	// "weightlifting" is the legacy type name — map it to the canonical "weight_lifting".
	type ctRow struct {
		Type  string `db:"type"`
		Count int    `db:"count"`
	}
	var ctRows []ctRow
	_ = s.db.SelectContext(ctx, &ctRows, `
		SELECT type, COUNT(*) as count
		FROM cross_training_sessions
		WHERE user_id = $1
		  AND date >= date_trunc('week', NOW())::date
		  AND date < (date_trunc('week', NOW()) + INTERVAL '7 days')::date
		GROUP BY type
	`, userID)
	for _, r := range ctRows {
		t := r.Type
		if t == "weightlifting" {
			t = "weight_lifting"
		}
		result[t] += r.Count
	}

	return result, nil
}

// GetGoalsWithProgress returns goals and this week's session counts
func (s *CrossTrainingGoalsService) GetGoalsWithProgress(
	ctx context.Context,
	userID uuid.UUID,
) ([]models.CrossTrainingGoal, map[string]int, error) {
	goals, err := s.GetGoals(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	progress, err := s.GetWeeklyProgress(ctx, userID)
	if err != nil {
		return nil, nil, err
	}
	return goals, progress, nil
}
