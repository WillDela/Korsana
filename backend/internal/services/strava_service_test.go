package services

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"sync"
	"sync/atomic"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
	"github.com/korsana/backend/internal/models"
	pkgstrava "github.com/korsana/backend/pkg/strava"
)

// mockStravaDB is an in-memory stub for stravaQuerier used in service tests.
type mockStravaDB struct {
	mu             sync.Mutex
	existingUserID uuid.UUID
	getErr         error
	execErr        error
	connections    map[uuid.UUID]*models.StravaConnection
	execCount      atomic.Int32
}

func (m *mockStravaDB) GetContext(_ context.Context, dest any, _ string, args ...any) error {
	if m.getErr != nil {
		return m.getErr
	}

	switch target := dest.(type) {
	case *uuid.UUID:
		if m.existingUserID == uuid.Nil {
			return sql.ErrNoRows
		}
		*target = m.existingUserID
		return nil
	case *models.StravaConnection:
		if len(args) == 0 {
			return sql.ErrNoRows
		}
		id, ok := args[0].(uuid.UUID)
		if !ok {
			return sql.ErrNoRows
		}
		m.mu.Lock()
		defer m.mu.Unlock()
		conn := m.connections[id]
		if conn == nil {
			return sql.ErrNoRows
		}
		*target = *conn
		return nil
	case *sql.NullTime:
		*target = sql.NullTime{}
		return nil
	default:
		return sql.ErrNoRows
	}
}

func (m *mockStravaDB) ExecContext(_ context.Context, _ string, args ...any) (sql.Result, error) {
	m.execCount.Add(1)
	if m.execErr != nil {
		return nil, m.execErr
	}

	if len(args) == 4 {
		if id, ok := args[3].(uuid.UUID); ok {
			m.mu.Lock()
			defer m.mu.Unlock()
			if conn := m.connections[id]; conn != nil {
				if accessToken, ok := args[0].(string); ok {
					conn.AccessToken = accessToken
				}
				if refreshToken, ok := args[1].(string); ok {
					conn.RefreshToken = refreshToken
				}
				if expiresAt, ok := args[2].(time.Time); ok {
					conn.TokenExpiresAt = expiresAt
				}
			}
		}
	}

	return nil, nil
}

func (m *mockStravaDB) NamedQueryContext(_ context.Context, _ string, _ any) (*sqlx.Rows, error) {
	return nil, nil
}

func (m *mockStravaDB) SelectContext(_ context.Context, _ any, _ string, _ ...any) error {
	return nil
}

type mockStravaClient struct {
	getAuthorizationURLFn func(state string) string
	exchangeTokenFn       func(code string) (*pkgstrava.TokenResponse, error)
	refreshTokenFn        func(ctx context.Context, refreshToken string) (*pkgstrava.TokenResponse, error)
	getActivitiesFn       func(ctx context.Context, accessToken string, page int, perPage int) ([]pkgstrava.Activity, error)
}

func (m *mockStravaClient) GetAuthorizationURL(state string) string {
	if m.getAuthorizationURLFn != nil {
		return m.getAuthorizationURLFn(state)
	}
	return ""
}

func (m *mockStravaClient) ExchangeToken(code string) (*pkgstrava.TokenResponse, error) {
	if m.exchangeTokenFn != nil {
		return m.exchangeTokenFn(code)
	}
	return nil, errors.New("not implemented")
}

func (m *mockStravaClient) RefreshToken(ctx context.Context, refreshToken string) (*pkgstrava.TokenResponse, error) {
	if m.refreshTokenFn != nil {
		return m.refreshTokenFn(ctx, refreshToken)
	}
	return nil, errors.New("not implemented")
}

func (m *mockStravaClient) GetActivities(ctx context.Context, accessToken string, page int, perPage int) ([]pkgstrava.Activity, error) {
	if m.getActivitiesFn != nil {
		return m.getActivitiesFn(ctx, accessToken, page, perPage)
	}
	return nil, errors.New("not implemented")
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
	client := pkgstrava.NewClient("client-id", "client-secret", "http://localhost/callback")
	client.HTTPClient = &http.Client{
		Transport: &redirectTransport{
			scheme: serverURL.Scheme,
			host:   serverURL.Host,
		},
	}
	return &StravaService{
		db:           db,
		stravaClient: client,
	}
}

func newActivity(id int64, when time.Time) pkgstrava.Activity {
	formatted := when.Format(time.RFC3339)
	return pkgstrava.Activity{
		ID:             id,
		Name:           "Activity",
		Type:           "Run",
		SportType:      "Run",
		Distance:       5000,
		MovingTime:     1500,
		StartDate:      formatted,
		StartDateLocal: formatted,
	}
}

func TestHandleCallback_NewAthlete(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	svc := newTestStravaService(&mockStravaDB{existingUserID: uuid.Nil}, ts)

	if err := svc.HandleCallback(context.Background(), uuid.New(), "auth-code"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}

func TestHandleCallback_SameUserRefresh(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	userID := uuid.New()
	svc := newTestStravaService(&mockStravaDB{existingUserID: userID}, ts)

	if err := svc.HandleCallback(context.Background(), userID, "auth-code"); err != nil {
		t.Errorf("want nil, got %v", err)
	}
}

func TestHandleCallback_DifferentUserConflict(t *testing.T) {
	const athleteID = int64(100)
	ts := newStravaTokenServer(t, athleteID)
	defer ts.Close()

	otherUserID := uuid.New()
	svc := newTestStravaService(&mockStravaDB{existingUserID: otherUserID}, ts)

	err := svc.HandleCallback(context.Background(), uuid.New(), "auth-code")
	if !errors.Is(err, ErrStravaAlreadyConnected) {
		t.Errorf("want ErrStravaAlreadyConnected, got %v", err)
	}
}

func TestCollectActivitiesForSyncInitialBackfillIsBounded(t *testing.T) {
	now := time.Date(2026, time.April, 19, 9, 0, 0, 0, time.UTC)
	var pages []int
	client := &mockStravaClient{
		getActivitiesFn: func(_ context.Context, _ string, page int, perPage int) ([]pkgstrava.Activity, error) {
			pages = append(pages, page)
			activities := make([]pkgstrava.Activity, perPage)
			for i := 0; i < perPage; i++ {
				activities[i] = newActivity(int64((page-1)*perPage+i+1), now.Add(-time.Duration((page-1)*perPage+i)*time.Hour))
			}
			return activities, nil
		},
	}
	svc := &StravaService{stravaClient: client}

	activities, partial, pagesFetched, err := svc.collectActivitiesForSync(context.Background(), "token", nil, syncPolicyForHistory(false))
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if !partial {
		t.Fatal("expected initial backfill to mark truncated sync as partial")
	}
	if len(activities) != stravaInitialSyncMaxPages*stravaSyncPerPage {
		t.Fatalf("expected %d activities, got %d", stravaInitialSyncMaxPages*stravaSyncPerPage, len(activities))
	}
	if pagesFetched != stravaInitialSyncMaxPages {
		t.Fatalf("expected %d pages fetched, got %d", stravaInitialSyncMaxPages, pagesFetched)
	}
	if len(pages) != stravaInitialSyncMaxPages {
		t.Fatalf("expected %d client calls, got %d", stravaInitialSyncMaxPages, len(pages))
	}
}

func TestCollectActivitiesForSyncStopsAtKnownBoundary(t *testing.T) {
	now := time.Date(2026, time.April, 19, 9, 0, 0, 0, time.UTC)
	latest := now.Add(-2 * time.Hour)
	client := &mockStravaClient{
		getActivitiesFn: func(_ context.Context, _ string, page int, _ int) ([]pkgstrava.Activity, error) {
			if page > 1 {
				t.Fatalf("expected sync to stop after first page, requested page %d", page)
			}
			return []pkgstrava.Activity{
				newActivity(1, now),
				newActivity(2, now.Add(-1*time.Hour)),
				newActivity(3, now.Add(-2*time.Hour)),
				newActivity(4, now.Add(-3*time.Hour)),
			}, nil
		},
	}
	svc := &StravaService{stravaClient: client}

	activities, partial, pagesFetched, err := svc.collectActivitiesForSync(context.Background(), "token", &latest, syncPolicyForHistory(true))
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if partial {
		t.Fatal("expected boundary stop to be a normal incremental sync, not partial")
	}
	if len(activities) != 2 {
		t.Fatalf("expected 2 new activities before the known boundary, got %d", len(activities))
	}
	if pagesFetched != 1 {
		t.Fatalf("expected 1 page fetched, got %d", pagesFetched)
	}
}

func TestFetchActivitiesPageWithRetryRetries429(t *testing.T) {
	var calls int32
	client := &mockStravaClient{
		getActivitiesFn: func(_ context.Context, _ string, _ int, _ int) ([]pkgstrava.Activity, error) {
			attempt := atomic.AddInt32(&calls, 1)
			if attempt < 3 {
				return nil, &pkgstrava.APIError{StatusCode: 429, RetryAfter: time.Millisecond}
			}
			return []pkgstrava.Activity{newActivity(1, time.Now())}, nil
		},
	}
	svc := &StravaService{stravaClient: client}

	activities, err := svc.fetchActivitiesPageWithRetry(context.Background(), "token", 1, 50)
	if err != nil {
		t.Fatalf("expected retry to recover, got %v", err)
	}
	if len(activities) != 1 {
		t.Fatalf("expected 1 activity after retry, got %d", len(activities))
	}
	if got := atomic.LoadInt32(&calls); got != 3 {
		t.Fatalf("expected 3 attempts, got %d", got)
	}
}

func TestCollectActivitiesForSyncReturnsPartialAfterLaterRateLimit(t *testing.T) {
	var calls int32
	client := &mockStravaClient{
		getActivitiesFn: func(_ context.Context, _ string, page int, _ int) ([]pkgstrava.Activity, error) {
			atomic.AddInt32(&calls, 1)
			if page == 1 {
				activities := make([]pkgstrava.Activity, stravaSyncPerPage)
				for i := range activities {
					activities[i] = newActivity(int64(i+1), time.Now().Add(-time.Duration(i)*time.Hour))
				}
				return activities, nil
			}
			return nil, &pkgstrava.APIError{StatusCode: 429, RetryAfter: time.Millisecond}
		},
	}
	svc := &StravaService{stravaClient: client}

	activities, partial, pagesFetched, err := svc.collectActivitiesForSync(context.Background(), "token", nil, syncPolicyForHistory(false))
	if err != nil {
		t.Fatalf("expected nil error for partial sync, got %v", err)
	}
	if !partial {
		t.Fatal("expected rate-limited follow-up page to downgrade into a partial sync")
	}
	if len(activities) != stravaSyncPerPage {
		t.Fatalf("expected first page activities to be preserved, got %d", len(activities))
	}
	if pagesFetched != 1 {
		t.Fatalf("expected 1 completed page before partial return, got %d", pagesFetched)
	}
}

func TestRefreshAccessTokenCoordinatesConcurrentRefresh(t *testing.T) {
	connID := uuid.New()
	db := &mockStravaDB{
		connections: map[uuid.UUID]*models.StravaConnection{
			connID: {
				ID:             connID,
				UserID:         uuid.New(),
				AccessToken:    "old-access",
				RefreshToken:   "old-refresh",
				TokenExpiresAt: time.Now().Add(-time.Minute),
			},
		},
	}
	var refreshCalls int32
	client := &mockStravaClient{
		refreshTokenFn: func(_ context.Context, refreshToken string) (*pkgstrava.TokenResponse, error) {
			atomic.AddInt32(&refreshCalls, 1)
			time.Sleep(10 * time.Millisecond)
			return &pkgstrava.TokenResponse{
				AccessToken:  "new-access",
				RefreshToken: "new-refresh",
				ExpiresAt:    time.Now().Add(time.Hour).Unix(),
			}, nil
		},
	}
	svc := &StravaService{db: db, stravaClient: client}

	seed := db.connections[connID]
	ctx := context.Background()
	results := make(chan *models.StravaConnection, 2)
	errs := make(chan error, 2)

	for range 2 {
		go func() {
			clone := *seed
			updated, err := svc.RefreshAccessToken(ctx, &clone)
			if err != nil {
				errs <- err
				return
			}
			results <- updated
		}()
	}

	for range 2 {
		select {
		case err := <-errs:
			t.Fatalf("unexpected refresh error: %v", err)
		case updated := <-results:
			if updated.AccessToken != "new-access" {
				t.Fatalf("expected refreshed access token, got %q", updated.AccessToken)
			}
		}
	}

	if got := atomic.LoadInt32(&refreshCalls); got != 1 {
		t.Fatalf("expected 1 refresh call, got %d", got)
	}
	if got := db.execCount.Load(); got != 1 {
		t.Fatalf("expected 1 database update, got %d", got)
	}
}
