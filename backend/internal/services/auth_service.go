package services

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// AuthService provides user-record helpers used by profile and other handlers.
// Authentication itself is handled by Supabase Auth.
type AuthService struct {
	db                     *database.DB
	supabaseURL            string
	supabaseServiceRoleKey string
}

func NewAuthService(db *database.DB, supabaseURL, supabaseServiceRoleKey string) *AuthService {
	return &AuthService{
		db:                     db,
		supabaseURL:            supabaseURL,
		supabaseServiceRoleKey: supabaseServiceRoleKey,
	}
}

// GetUserByID retrieves a user from auth.users by their Supabase UUID.
// auth.users is the canonical table for Supabase Auth users.
func (s *AuthService) GetUserByID(ctx context.Context, userID uuid.UUID) (*models.User, error) {
	var user models.User
	err := s.db.GetContext(ctx, &user,
		"SELECT id, email, created_at, updated_at FROM auth.users WHERE id = $1",
		userID,
	)
	if err != nil {
		return nil, errors.New("user not found")
	}
	return &user, nil
}

// UpdateEmail updates the user's email via the Supabase Auth Admin API.
func (s *AuthService) UpdateEmail(ctx context.Context, userID uuid.UUID, newEmail string) error {
	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", s.supabaseURL, userID)

	body, err := json.Marshal(map[string]string{"email": newEmail})
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.supabaseServiceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("supabase admin request: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("supabase returned %d: %v", resp.StatusCode, errBody)
	}
	return nil
}

// DeleteUser removes a user record and all cascaded rows.
// The corresponding auth.users row must be deleted separately via Supabase Admin API
// or the Supabase dashboard if a full account purge is needed.
func (s *AuthService) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", userID)
	return err
}
