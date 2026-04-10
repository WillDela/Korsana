package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
)

// mockAuthQuerier is an in-memory stub for authQuerier used in auth service tests.
type mockAuthQuerier struct {
	user   *models.User
	getErr error
}

func (m *mockAuthQuerier) GetContext(_ context.Context, dest any, _ string, _ ...any) error {
	if m.getErr != nil {
		return m.getErr
	}
	if m.user == nil {
		return sql.ErrNoRows
	}
	*dest.(*models.User) = *m.user
	return nil
}

func (m *mockAuthQuerier) ExecContext(_ context.Context, _ string, _ ...any) (sql.Result, error) {
	return nil, nil
}

// newSupabaseServer returns a test server that mimics Supabase Auth endpoints.
// signInStatus is returned for POST /auth/v1/token (sign-in verification).
// PATCH /auth/v1/admin/users/* always returns 200 OK.
func newSupabaseServer(t *testing.T, signInStatus int) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		switch {
		case r.Method == http.MethodPost && strings.Contains(r.URL.Path, "/token"):
			if signInStatus != http.StatusOK {
				w.WriteHeader(signInStatus)
				json.NewEncoder(w).Encode(map[string]string{"error": "invalid_grant"}) //nolint:errcheck
				return
			}
			json.NewEncoder(w).Encode(map[string]string{"access_token": "test-token"}) //nolint:errcheck
		case r.Method == http.MethodPatch && strings.Contains(r.URL.Path, "/admin/users/"):
			json.NewEncoder(w).Encode(map[string]string{"id": "ok"}) //nolint:errcheck
		default:
			w.WriteHeader(http.StatusNotFound)
		}
	}))
}

func newTestAuthService(db authQuerier, ts *httptest.Server) *AuthService {
	return &AuthService{
		db:                     db,
		supabaseURL:            ts.URL,
		supabaseServiceRoleKey: "test-service-role-key",
		httpClient:             &http.Client{},
	}
}

func TestChangePassword_WrongCurrentPassword(t *testing.T) {
	ts := newSupabaseServer(t, http.StatusUnauthorized)
	defer ts.Close()

	userID := uuid.New()
	svc := newTestAuthService(&mockAuthQuerier{
		user: &models.User{ID: userID, Email: "runner@example.com"},
	}, ts)

	err := svc.ChangePassword(context.Background(), userID, "wrong-password", "new-password")
	if !errors.Is(err, ErrWrongPassword) {
		t.Errorf("want ErrWrongPassword, got %v", err)
	}
}

func TestChangePassword_Success(t *testing.T) {
	ts := newSupabaseServer(t, http.StatusOK)
	defer ts.Close()

	userID := uuid.New()
	svc := newTestAuthService(&mockAuthQuerier{
		user: &models.User{ID: userID, Email: "runner@example.com"},
	}, ts)

	if err := svc.ChangePassword(context.Background(), userID, "correct-password", "new-password"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}

func TestUpdateEmail_WrongCurrentPassword(t *testing.T) {
	ts := newSupabaseServer(t, http.StatusUnauthorized)
	defer ts.Close()

	userID := uuid.New()
	svc := newTestAuthService(&mockAuthQuerier{
		user: &models.User{ID: userID, Email: "old@example.com"},
	}, ts)

	err := svc.UpdateEmail(context.Background(), userID, "wrong-password", "new@example.com")
	if !errors.Is(err, ErrWrongPassword) {
		t.Errorf("want ErrWrongPassword, got %v", err)
	}
}

func TestUpdateEmail_Success(t *testing.T) {
	ts := newSupabaseServer(t, http.StatusOK)
	defer ts.Close()

	userID := uuid.New()
	svc := newTestAuthService(&mockAuthQuerier{
		user: &models.User{ID: userID, Email: "old@example.com"},
	}, ts)

	if err := svc.UpdateEmail(context.Background(), userID, "correct-password", "new@example.com"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}
