package services

import (
	"context"
	"errors"
	"time"

	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
	"github.com/google/uuid"
)

// GoalsService handles race goal business logic
type GoalsService struct {
	db *database.DB
}

// NewGoalsService creates a new goals service
func NewGoalsService(db *database.DB) *GoalsService {
	return &GoalsService{
		db: db,
	}
}

// CreateGoal creates a new race goal for a user
func (s *GoalsService) CreateGoal(ctx context.Context, userID uuid.UUID, raceName string, raceDate time.Time, distanceMeters int, targetTimeSeconds *int, goalType string) (*models.RaceGoal, error) {
	// Set all existing goals to inactive before creating a new active one
	_, err := s.db.ExecContext(ctx, "UPDATE race_goals SET is_active = false WHERE user_id = $1", userID)
	if err != nil {
		return nil, err
	}

	goal := &models.RaceGoal{
		ID:                 uuid.New(),
		UserID:             userID,
		RaceName:           raceName,
		RaceDate:           raceDate,
		RaceDistanceMeters: distanceMeters,
		TargetTimeSeconds:  targetTimeSeconds,
		GoalType:           goalType,
		IsActive:           true,
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	query := `
		INSERT INTO race_goals (id, user_id, race_name, race_date, race_distance_meters, target_time_seconds, goal_type, is_active, created_at, updated_at)
		VALUES (:id, :user_id, :race_name, :race_date, :race_distance_meters, :target_time_seconds, :goal_type, :is_active, :created_at, :updated_at)
	`
	_, err = s.db.NamedExecContext(ctx, query, goal)
	if err != nil {
		return nil, err
	}

	return goal, nil
}

// GetUserGoals retrieves all goals for a user
func (s *GoalsService) GetUserGoals(ctx context.Context, userID uuid.UUID) ([]models.RaceGoal, error) {
	var goals []models.RaceGoal
	err := s.db.SelectContext(ctx, &goals, "SELECT * FROM race_goals WHERE user_id = $1 ORDER BY race_date ASC", userID)
	if err != nil {
		return nil, err
	}
	return goals, nil
}

// GetGoalByID retrieves a specific goal by ID
func (s *GoalsService) GetGoalByID(ctx context.Context, userID uuid.UUID, goalID uuid.UUID) (*models.RaceGoal, error) {
	var goal models.RaceGoal
	err := s.db.GetContext(ctx, &goal, "SELECT * FROM race_goals WHERE id = $1 AND user_id = $2", goalID, userID)
	if err != nil {
		return nil, errors.New("goal not found")
	}
	return &goal, nil
}

// GetActiveGoal retrieves the active goal for a user
func (s *GoalsService) GetActiveGoal(ctx context.Context, userID uuid.UUID) (*models.RaceGoal, error) {
	var goal models.RaceGoal
	err := s.db.GetContext(ctx, &goal, "SELECT * FROM race_goals WHERE user_id = $1 AND is_active = true", userID)
	if err != nil {
		return nil, errors.New("no active goal found")
	}
	return &goal, nil
}

// UpdateGoal updates an existing goal
func (s *GoalsService) UpdateGoal(ctx context.Context, userID uuid.UUID, goalID uuid.UUID, raceName string, raceDate time.Time, distanceMeters int, targetTimeSeconds *int, goalType string) (*models.RaceGoal, error) {
	query := `
		UPDATE race_goals
		SET race_name = $1, race_date = $2, race_distance_meters = $3, target_time_seconds = $4, goal_type = $5, updated_at = $6
		WHERE id = $7 AND user_id = $8
	`
	result, err := s.db.ExecContext(ctx, query, raceName, raceDate, distanceMeters, targetTimeSeconds, goalType, time.Now(), goalID, userID)
	if err != nil {
		return nil, err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return nil, errors.New("goal not found")
	}

	return s.GetGoalByID(ctx, userID, goalID)
}

// DeleteGoal deletes a goal
func (s *GoalsService) DeleteGoal(ctx context.Context, userID uuid.UUID, goalID uuid.UUID) error {
	result, err := s.db.ExecContext(ctx, "DELETE FROM race_goals WHERE id = $1 AND user_id = $2", goalID, userID)
	if err != nil {
		return err
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		return errors.New("goal not found")
	}

	return nil
}
