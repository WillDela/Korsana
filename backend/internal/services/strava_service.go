package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
	"github.com/korsana/backend/pkg/strava"
	"github.com/redis/go-redis/v9"
)

// StravaService handles Strava business logic
type StravaService struct {
	db           *database.DB
	stravaClient *strava.Client
	redis        *redis.Client
	calendarSvc  *CalendarService
}

// NewStravaService creates a new Strava service
func NewStravaService(db *database.DB, client *strava.Client, redisClient *redis.Client, calendarService *CalendarService) *StravaService {
	return &StravaService{
		db:           db,
		stravaClient: client,
		redis:        redisClient,
		calendarSvc:  calendarService,
	}
}

// GenerateOAuthState creates a secure random state parameter and stores it in Redis.
// returnTo is an optional frontend path (e.g. "/dashboard") to redirect to after connect.
func (s *StravaService) GenerateOAuthState(ctx context.Context, userID uuid.UUID, returnTo string) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	state := hex.EncodeToString(b)

	// Value format: "userID|returnTo" (returnTo may be empty)
	value := userID.String() + "|" + returnTo
	key := fmt.Sprintf("strava_oauth_state:%s", state)
	if err := s.redis.Set(ctx, key, value, 10*time.Minute).Err(); err != nil {
		return "", err
	}

	return state, nil
}

// ValidateOAuthState validates the state parameter and returns the user ID and optional returnTo path.
func (s *StravaService) ValidateOAuthState(ctx context.Context, state string) (uuid.UUID, string, error) {
	key := fmt.Sprintf("strava_oauth_state:%s", state)
	val, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return uuid.Nil, "", errors.New("invalid or expired state")
	}

	// Delete the state (one-time use)
	s.redis.Del(ctx, key)

	parts := strings.SplitN(val, "|", 2)
	userID, err := uuid.Parse(parts[0])
	if err != nil {
		return uuid.Nil, "", errors.New("invalid user ID in state")
	}

	returnTo := ""
	if len(parts) > 1 {
		returnTo = parts[1]
	}

	return userID, returnTo, nil
}

// GenerateLoginOAuthState creates a state for the unauthenticated Strava login flow.
func (s *StravaService) GenerateLoginOAuthState(ctx context.Context) (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	state := hex.EncodeToString(b)

	key := fmt.Sprintf("strava_login_state:%s", state)
	err := s.redis.Set(ctx, key, "login", 10*time.Minute).Err()
	if err != nil {
		return "", err
	}

	return state, nil
}

// ValidateLoginOAuthState confirms the state belongs to the login flow and deletes it.
func (s *StravaService) ValidateLoginOAuthState(ctx context.Context, state string) error {
	key := fmt.Sprintf("strava_login_state:%s", state)
	val, err := s.redis.Get(ctx, key).Result()
	if err != nil || val != "login" {
		return errors.New("invalid or expired login state")
	}
	s.redis.Del(ctx, key)
	return nil
}

// GetLoginURL returns the Strava OAuth URL for the unauthenticated login flow.
func (s *StravaService) GetLoginURL(ctx context.Context) (string, error) {
	state, err := s.GenerateLoginOAuthState(ctx)
	if err != nil {
		return "", err
	}
	return s.stravaClient.GetAuthorizationURL(state), nil
}

// LoginWithStrava exchanges the OAuth code and finds or creates a user.
// Returns the user and whether they are newly created.
func (s *StravaService) LoginWithStrava(ctx context.Context, code string) (*models.User, bool, error) {
	tokenResp, err := s.stravaClient.ExchangeToken(code)
	if err != nil {
		return nil, false, err
	}

	athleteID := tokenResp.Athlete.ID

	// Check if this Strava account is already connected to a user.
	var conn models.StravaConnection
	err = s.db.GetContext(ctx, &conn,
		"SELECT * FROM strava_connections WHERE strava_athlete_id = $1", athleteID)
	if err == nil {
		// Existing user — update tokens and return.
		updateQuery := `
			UPDATE strava_connections
			SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
			WHERE strava_athlete_id = $4
		`
		expiresAt := time.Unix(tokenResp.ExpiresAt, 0)
		if _, execErr := s.db.ExecContext(ctx, updateQuery,
			tokenResp.AccessToken, tokenResp.RefreshToken, expiresAt, athleteID); execErr != nil {
			return nil, false, execErr
		}

		var user models.User
		if userErr := s.db.GetContext(ctx, &user, "SELECT * FROM users WHERE id = $1", conn.UserID); userErr != nil {
			return nil, false, userErr
		}
		return &user, false, nil
	}

	// Strava is a data source, not an auth provider. The OAuth state is tied
	// to an authenticated user, so reaching here without finding a user means
	// the state was invalid or the user was deleted. Return an error.
	return nil, false, fmt.Errorf("no user found for strava athlete %d", athleteID)
}

// GetAuthURL returns the Strava OAuth URL with state parameter.
// returnTo is an optional frontend path to redirect to after connection (e.g. "/dashboard").
func (s *StravaService) GetAuthURL(ctx context.Context, userID uuid.UUID, returnTo string) (string, error) {
	state, err := s.GenerateOAuthState(ctx, userID, returnTo)
	if err != nil {
		return "", err
	}
	return s.stravaClient.GetAuthorizationURL(state), nil
}

// HandleCallback processes the OAuth callback and saves the connection
func (s *StravaService) HandleCallback(ctx context.Context, userID uuid.UUID, code string) error {
	// 1. Exchange code for token
	tokenResp, err := s.stravaClient.ExchangeToken(code)
	if err != nil {
		return err
	}

	// 2. Save or update connection in database
	query := `
		INSERT INTO strava_connections (
			user_id, strava_athlete_id, access_token, refresh_token, token_expires_at, updated_at
		) VALUES ($1, $2, $3, $4, $5, NOW())
		ON CONFLICT (strava_athlete_id) 
		DO UPDATE SET 
			access_token = EXCLUDED.access_token,
			refresh_token = EXCLUDED.refresh_token,
			token_expires_at = EXCLUDED.token_expires_at,
			updated_at = NOW()
	`

	expiresAt := time.Unix(tokenResp.ExpiresAt, 0)
	_, err = s.db.ExecContext(ctx, query,
		userID,
		tokenResp.Athlete.ID,
		tokenResp.AccessToken,
		tokenResp.RefreshToken,
		expiresAt,
	)

	return err
}

// GetConnection retrieves the Strava connection for a user
func (s *StravaService) GetConnection(ctx context.Context, userID uuid.UUID) (*models.StravaConnection, error) {
	var conn models.StravaConnection
	err := s.db.GetContext(ctx, &conn, "SELECT * FROM strava_connections WHERE user_id = $1", userID)
	if err != nil {
		return nil, errors.New("strava connection not found")
	}
	return &conn, nil
}

// RefreshAccessToken refreshes the Strava access token if expired
func (s *StravaService) RefreshAccessToken(ctx context.Context, conn *models.StravaConnection) (*models.StravaConnection, error) {
	// Check if token is expired or about to expire (within 5 minutes)
	if time.Now().Before(conn.TokenExpiresAt.Add(-5 * time.Minute)) {
		// Token still valid
		return conn, nil
	}

	// Refresh the token
	tokenResp, err := s.stravaClient.RefreshToken(ctx, conn.RefreshToken)
	if err != nil {
		return nil, err
	}

	// Update connection in database
	query := `
		UPDATE strava_connections
		SET access_token = $1, refresh_token = $2, token_expires_at = $3, updated_at = NOW()
		WHERE id = $4
	`
	expiresAt := time.Unix(tokenResp.ExpiresAt, 0)
	_, err = s.db.ExecContext(ctx, query, tokenResp.AccessToken, tokenResp.RefreshToken, expiresAt, conn.ID)
	if err != nil {
		return nil, err
	}

	// Return updated connection
	conn.AccessToken = tokenResp.AccessToken
	conn.RefreshToken = tokenResp.RefreshToken
	conn.TokenExpiresAt = expiresAt
	conn.UpdatedAt = time.Now()

	return conn, nil
}

// mapStravaType converts Strava activity types to internal types
func mapStravaType(stravaType, sportType string) string {
	t := sportType
	if t == "" {
		t = stravaType
	}
	switch t {
	case "Run", "VirtualRun":
		return models.ActivityTypeRun
	case "Ride", "VirtualRide", "EBikeRide":
		return models.ActivityTypeCycling
	case "Swim":
		return models.ActivityTypeSwimming
	case "Walk":
		return models.ActivityTypeWalking
	case "Hike":
		return models.ActivityTypeHiking
	case "Rowing", "Canoeing":
		return models.ActivityTypeRowing
	case "Elliptical":
		return models.ActivityTypeElliptical
	case "StairStepper":
		return models.ActivityTypeStairMaster
	case "WeightTraining":
		return models.ActivityTypeWeightLifting
	case "Yoga", "Stretching":
		return models.ActivityTypeRecovery
	default:
		return models.ActivityTypeWorkout
	}
}

// SyncActivities fetches and stores recent activities from Strava
func (s *StravaService) SyncActivities(ctx context.Context, userID uuid.UUID) (int, error) {
	// Get connection
	conn, err := s.GetConnection(ctx, userID)
	if err != nil {
		return 0, err
	}

	// Refresh token if needed
	conn, err = s.RefreshAccessToken(ctx, conn)
	if err != nil {
		return 0, err
	}

	// Fetch the most recent 50 activities from Strava.
	// Higher values cause excessive sequential DB round-trips on remote databases.
	activities, err := s.stravaClient.GetActivities(ctx, conn.AccessToken, 1, 50)
	if err != nil {
		return 0, err
	}

	syncedCount := 0
	insertFailCount := 0

	for _, act := range activities {
		// Use local date so calendar bucketing matches the athlete's timezone.
		// start_date_local is formatted as RFC3339 but represents local time.
		localDateStr := act.StartDateLocal
		if localDateStr == "" {
			localDateStr = act.StartDate
		}
		startTime, err := time.Parse(time.RFC3339, localDateStr)
		if err != nil {
			log.Printf("strava sync: skipping activity %d (%s): bad date format %q: %v", act.ID, act.Name, localDateStr, err)
			continue
		}

		internalType := mapStravaType(act.Type, act.SportType)

		var avgPace float64
		if models.DistanceBasedTypes[internalType] && act.Distance > 0 {
			distanceKm := act.Distance / 1000.0
			avgPace = float64(act.MovingTime) / distanceKm
		}

		var avgHR *int
		if act.AverageHeartrate > 0 {
			hr := int(act.AverageHeartrate)
			avgHR = &hr
		}

		var elevGain *float64
		if act.TotalElevationGain > 0 {
			elevGain = &act.TotalElevationGain
		}

		var maxHR *int
		if act.MaxHeartrate > 0 {
			mhr := int(act.MaxHeartrate)
			maxHR = &mhr
		}

		var cadence *float64
		if act.AverageCadence > 0 {
			cadence = &act.AverageCadence
		}

		var sufferScore *int
		if act.SufferScore > 0 {
			ss := act.SufferScore
			sufferScore = &ss
		}

		activity := &models.Activity{
			ID:                      uuid.New(),
			UserID:                  userID,
			Source:                  "strava",
			SourceActivityID:        fmt.Sprintf("%d", act.ID),
			ActivityType:            internalType,
			Name:                    act.Name,
			DistanceMeters:          act.Distance,
			DurationSeconds:         act.MovingTime,
			StartTime:               startTime,
			AveragePaceSecondsPerKm: avgPace,
			AverageHeartRate:        avgHR,
			MaxHeartRate:            maxHR,
			ElevationGainMeters:     elevGain,
			AverageCadence:          cadence,
			SufferScore:             sufferScore,
			SyncedAt:                time.Now(),
		}

		query := `
			INSERT INTO activities (
				id, user_id, source, source_activity_id, activity_type, name,
				distance_meters, duration_seconds, start_time, average_pace_seconds_per_km,
				average_heart_rate, max_heart_rate, elevation_gain_meters,
				average_cadence, suffer_score, synced_at
			) VALUES (
				:id, :user_id, :source, :source_activity_id, :activity_type, :name,
				:distance_meters, :duration_seconds, :start_time, :average_pace_seconds_per_km,
				:average_heart_rate, :max_heart_rate, :elevation_gain_meters,
				:average_cadence, :suffer_score, :synced_at
			)
			ON CONFLICT (user_id, source, source_activity_id) DO UPDATE SET
				name = EXCLUDED.name,
				activity_type = EXCLUDED.activity_type,
				distance_meters = EXCLUDED.distance_meters,
				duration_seconds = EXCLUDED.duration_seconds,
				start_time = EXCLUDED.start_time,
				average_pace_seconds_per_km = EXCLUDED.average_pace_seconds_per_km,
				average_heart_rate = EXCLUDED.average_heart_rate,
				max_heart_rate = EXCLUDED.max_heart_rate,
				elevation_gain_meters = EXCLUDED.elevation_gain_meters,
				average_cadence = EXCLUDED.average_cadence,
				suffer_score = EXCLUDED.suffer_score,
				synced_at = EXCLUDED.synced_at
		`

		// RETURNING id captures the real stored ID in one round-trip.
		// ON CONFLICT DO UPDATE keeps the original row, so this avoids a
		// separate SELECT that would otherwise double the DB calls per activity.
		rows, err := s.db.NamedQueryContext(ctx, query+" RETURNING id", activity)
		if err != nil {
			log.Printf("strava sync: failed to upsert activity %d (%s): %v", act.ID, act.Name, err)
			insertFailCount++
			continue
		}
		if rows.Next() {
			var storedID uuid.UUID
			if scanErr := rows.Scan(&storedID); scanErr == nil {
				activity.ID = storedID
			}
		}
		rows.Close()

		if s.calendarSvc != nil {
			_ = s.calendarSvc.AutoMatchActivity(ctx, userID, activity)
		}

		syncedCount++
	}

	// If every activity failed to insert, surface the error so the caller
	// doesn't silently report "0 synced" when the real issue is a DB problem
	// (e.g. a missing unique index from a pending migration).
	if insertFailCount > 0 && syncedCount == 0 && len(activities) > 0 {
		return 0, fmt.Errorf(
			"all %d activities failed to save — check server logs for details (hint: ensure migration 005 has been applied to your database)",
			insertFailCount,
		)
	}

	// After syncing, compute and upsert weekly summaries
	if syncedCount > 0 {
		_ = s.computeWeeklySummaries(ctx, userID)
	}

	return syncedCount, nil
}

// computeWeeklySummaries aggregates activity data into weekly_summaries
func (s *StravaService) computeWeeklySummaries(ctx context.Context, userID uuid.UUID) error {
	query := `
		INSERT INTO weekly_summaries (id, user_id, week_start, total_distance_meters, total_duration_seconds, run_count, average_pace_seconds_per_km, longest_run_meters, updated_at)
		SELECT
			gen_random_uuid(),
			user_id,
			date_trunc('week', start_time)::date AS week_start,
			SUM(distance_meters) AS total_distance_meters,
			SUM(duration_seconds) AS total_duration_seconds,
			COUNT(*) AS run_count,
			CASE WHEN SUM(distance_meters) > 0
				THEN SUM(duration_seconds) / (SUM(distance_meters) / 1000.0)
				ELSE 0
			END AS average_pace_seconds_per_km,
			MAX(distance_meters) AS longest_run_meters,
			NOW()
		FROM activities
		WHERE user_id = $1
			AND start_time >= NOW() - INTERVAL '8 weeks'
		GROUP BY user_id, date_trunc('week', start_time)
		ON CONFLICT (user_id, week_start) DO UPDATE SET
			total_distance_meters = EXCLUDED.total_distance_meters,
			total_duration_seconds = EXCLUDED.total_duration_seconds,
			run_count = EXCLUDED.run_count,
			average_pace_seconds_per_km = EXCLUDED.average_pace_seconds_per_km,
			longest_run_meters = EXCLUDED.longest_run_meters,
			updated_at = NOW()
	`
	_, err := s.db.ExecContext(ctx, query, userID)
	return err
}

// GetUserActivities retrieves activities for a user
func (s *StravaService) GetUserActivities(ctx context.Context, userID uuid.UUID, limit, offset int) ([]models.Activity, int, error) {
	if limit <= 0 {
		limit = 30
	}

	var total int
	err := s.db.GetContext(ctx, &total, "SELECT COUNT(*) FROM activities WHERE user_id = $1", userID)
	if err != nil {
		return nil, 0, err
	}

	var activities []models.Activity
	query := `
		SELECT * FROM activities
		WHERE user_id = $1
		ORDER BY start_time DESC
		LIMIT $2 OFFSET $3
	`
	err = s.db.SelectContext(ctx, &activities, query, userID, limit, offset)
	if err != nil {
		return nil, 0, err
	}

	return activities, total, nil
}

// DisconnectStrava removes the user's Strava connection
func (s *StravaService) DisconnectStrava(ctx context.Context, userID uuid.UUID) error {
	_, err := s.db.ExecContext(ctx, "DELETE FROM strava_connections WHERE user_id = $1", userID)
	return err
}
