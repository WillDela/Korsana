package services

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

// ErrWrongPassword is returned when the supplied current password is incorrect.
var ErrWrongPassword = errors.New("current password is incorrect")

// authQuerier is the subset of database methods AuthService needs.
// *database.DB satisfies this interface via its embedded *sqlx.DB.
type authQuerier interface {
	GetContext(ctx context.Context, dest any, query string, args ...any) error
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

// AuthService provides user-record helpers used by profile and other handlers.
// Authentication itself is handled by Supabase Auth.
type AuthService struct {
	db                     authQuerier
	supabaseURL            string
	supabaseServiceRoleKey string
	httpClient             *http.Client // injectable for tests; defaults to http.DefaultClient
}

func NewAuthService(db *database.DB, supabaseURL, supabaseServiceRoleKey string) *AuthService {
	return &AuthService{
		db:                     db,
		supabaseURL:            supabaseURL,
		supabaseServiceRoleKey: supabaseServiceRoleKey,
		httpClient:             http.DefaultClient,
	}
}

// verifyCurrentPassword calls the Supabase sign-in endpoint to confirm the password
// is correct before allowing a sensitive account change (email or password update).
func (s *AuthService) verifyCurrentPassword(ctx context.Context, userID uuid.UUID, password string) error {
	user, err := s.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	body, err := json.Marshal(map[string]string{
		"email":    user.Email,
		"password": password,
	})
	if err != nil {
		return fmt.Errorf("marshal sign-in request: %w", err)
	}

	url := fmt.Sprintf("%s/auth/v1/token?grant_type=password", s.supabaseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create sign-in request: %w", err)
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("apikey", s.supabaseServiceRoleKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("supabase sign-in: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusUnauthorized {
		return ErrWrongPassword
	}
	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("supabase sign-in returned %d", resp.StatusCode)
	}
	return nil
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

// UpdateEmail verifies the current password then updates the user's email via the Supabase Admin API.
func (s *AuthService) UpdateEmail(ctx context.Context, userID uuid.UUID, currentPassword, newEmail string) error {
	if err := s.verifyCurrentPassword(ctx, userID, currentPassword); err != nil {
		return err
	}

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

	resp, err := s.httpClient.Do(req)
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

// ChangePassword verifies the current password then updates to the new one via the Supabase Admin API.
func (s *AuthService) ChangePassword(ctx context.Context, userID uuid.UUID, currentPassword, newPassword string) error {
	if err := s.verifyCurrentPassword(ctx, userID, currentPassword); err != nil {
		return err
	}

	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", s.supabaseURL, userID)

	body, err := json.Marshal(map[string]string{"password": newPassword})
	if err != nil {
		return fmt.Errorf("marshal request: %w", err)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodPatch, url, bytes.NewReader(body))
	if err != nil {
		return fmt.Errorf("create request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.supabaseServiceRoleKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.httpClient.Do(req)
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

// DeleteUser fully removes a user: first from Supabase Auth (blocks re-login
// immediately), then from public.users which cascades to all app data.
func (s *AuthService) DeleteUser(ctx context.Context, userID uuid.UUID) error {
	url := fmt.Sprintf("%s/auth/v1/admin/users/%s", s.supabaseURL, userID)

	req, err := http.NewRequestWithContext(ctx, http.MethodDelete, url, nil)
	if err != nil {
		return fmt.Errorf("create delete request: %w", err)
	}
	req.Header.Set("Authorization", "Bearer "+s.supabaseServiceRoleKey)

	resp, err := s.httpClient.Do(req)
	if err != nil {
		return fmt.Errorf("supabase admin delete: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNoContent {
		var errBody map[string]any
		_ = json.NewDecoder(resp.Body).Decode(&errBody)
		return fmt.Errorf("supabase returned %d: %v", resp.StatusCode, errBody)
	}

	_, err = s.db.ExecContext(ctx, "DELETE FROM users WHERE id = $1", userID)
	return err
}
