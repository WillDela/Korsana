package services

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// AuthService provides user-record helpers used by profile and other handlers.
// Authentication itself is handled by Supabase Auth.
type AuthService struct {
	db *database.DB
}

func NewAuthService(db *database.DB) *AuthService {
	return &AuthService{db: db}
}

// GetUserByID retrieves a user from the public.users table by their Supabase UUID.
func (s *AuthService) GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	var user models.User
	err := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", userID)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

// DeleteUser removes a user record and all cascaded rows.
// The corresponding auth.users row must be deleted separately via Supabase Admin API
// or the Supabase dashboard if a full account purge is needed.
func (s *AuthService) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", userID)
	return err
}
