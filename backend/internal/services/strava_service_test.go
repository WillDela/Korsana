package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/korsana/backend/pkg/strava"
)

// mockStravaQuerier is an in-memory stub for stravaQuerier used in strava service tests.
// Only GetContext and ExecContext are exercised by HandleCallback; the rest are no-ops.
type mockStravaQuerier struct {
	existingUserID uuid.UUID // uuid.Nil → no row (sql.ErrNoRows)
	getErr         error
	execErr        error
}

func (m *mockStravaQuerier) GetContext(_ context.Context, dest any, _ string, _ ...any) error {
	if m.getErr != nil {
		return m.getErr
	}
	if m.existingUserID == uuid.Nil {
		return sql.ErrNoRows
	}
	*dest.(*uuid.UUID) = m.existingUserID
	return nil
}

func (m *mockStravaQuerier) ExecContext(_ context.Context, _ string, _ ...any) (sql.Result, error) {
	return nil, m.execErr
}

func (m *mockStravaQuerier) NamedQueryContext(_ context.Context, _ string, _ any) (*sqlx.Rows, error) {
	return nil, nil // not called in HandleCallback
}

func (m *mockStravaQuerier) SelectContext(_ context.Context, _ any, _ string, _ ...any) error {
	return nil // not called in HandleCallback
}

// redirectTransport rewrites every outgoing request to target a specific httptest.Server.
// This lets us intercept Strava's hardcoded token URL without changing production code.
type redirectTransport struct {
	scheme string
	host   string
}

func (t *redirectTransport) RoundTrip(req *http.Request) (*http.Response, error) {
	r := req.Clone(req.Context())
	r.URL.Scheme = t.scheme
	r.URL.Host = t.host
	return http.DefaultTransport.RoundTrip(r)
}

// newStravaTokenServer returns a test server that responds to Strava's token exchange
// endpoint with a valid TokenResponse containing the given athlete ID.
func newStravaTokenServer(t *testing.T, athleteID int64) *httptest.Server {
	t.Helper()
	return httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{ //nolint:errcheck
			"access_token":  "test-access",
			"refresh_token": "test-refresh",
			"expires_at":    int64(9999999999),
			"athlete":       map[string]any{"id": athleteID},
		})
	}))
}

func newTestStravaService(db stravaQuerier, tokenServer *httptest.Server) *StravaService {
	serverURL, _ := url.Parse(tokenServer.URL)
	client := strava.NewClient("client-id", "client-secret", "http://localhost/callback")
	client.HTTPClient = &http.Client{
		Transport: &redirectTransport{
			scheme: serverURL.Scheme,
			host:   serverURL.Host,
		},
	}
	return &StravaService{
		db:           db,
		stravaClient: client,
		// redis and calendarSvc are unused in HandleCallback
	}
}

func TestHandleCallback_NewAthlete(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	// existingUserID = uuid.Nil → GetContext returns sql.ErrNoRows → new athlete, insert proceeds
	svc := newTestStravaService(&mockStravaQuerier{existingUserID: uuid.Nil}, ts)

	if err := svc.HandleCallback(context.Background(), uuid.New(), "auth-code"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}

func TestHandleCallback_SameUserRefresh(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	userID := uuid.New()
	// existingUserID == userID → same user reconnecting, token refresh proceeds
	svc := newTestStravaService(&mockStravaQuerier{existingUserID: userID}, ts)

	if err := svc.HandleCallback(context.Background(), userID, "auth-code"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}

func TestHandleCallback_DifferentUserConflict(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	otherUserID := uuid.New()
	// existingUserID belongs to a different user → ownership conflict
	svc := newTestStravaService(&mockStravaQuerier{existingUserID: otherUserID}, ts)

	err := svc.HandleCallback(context.Background(), uuid.New(), "auth-code")
	if !errors.Is(err, ErrStravaAlreadyConnected) {
		t.Errorf("want ErrStravaAlreadyConnected, got %v", err)
	}
}
