package services

import (
	"context"
	"crypto/rand"
	"encoding/hex"
	"errors"
	"fmt"
	"time"

	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
	"github.com/korsana/backend/pkg/strava"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

// StravaService handles Strava business logic
type StravaService struct {
	db           *database.DB
	stravaClient *strava.Client
	redis        *redis.Client
}

// NewStravaService creates a new Strava service
func NewStravaService(db *database.DB, client *strava.Client, redisClient *redis.Client) *StravaService {
	return &StravaService{
		db:           db,
		stravaClient: client,
		redis:        redisClient,
	}
}

// GenerateOAuthState creates a secure random state parameter and stores it in Redis
func (s *StravaService) GenerateOAuthState(ctx context.Context, userID uuid.UUID) (string, error) {
	// Generate random state
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	state := hex.EncodeToString(b)

	// Store state in Redis with 10 minute expiration
	key := fmt.Sprintf("strava_oauth_state:%s", state)
	err := s.redis.Set(ctx, key, userID.String(), 10*time.Minute).Err()
	if err != nil {
		return "", err
	}

	return state, nil
}

// ValidateOAuthState validates the state parameter and returns the associated user ID
func (s *StravaService) ValidateOAuthState(ctx context.Context, state string) (uuid.UUID, error) {
	key := fmt.Sprintf("strava_oauth_state:%s", state)
	userIDStr, err := s.redis.Get(ctx, key).Result()
	if err != nil {
		return uuid.Nil, errors.New("invalid or expired state")
	}

	// Delete the state (one-time use)
	s.redis.Del(ctx, key)

	userID, err := uuid.Parse(userIDStr)
	if err != nil {
		return uuid.Nil, errors.New("invalid user ID in state")
	}

	return userID, nil
}

// GetAuthURL returns the Strava OAuth URL with state parameter
func (s *StravaService) GetAuthURL(ctx context.Context, userID uuid.UUID) (string, error) {
	state, err := s.GenerateOAuthState(ctx, userID)
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
	tokenResp, err := s.stravaClient.RefreshToken(conn.RefreshToken)
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

	// Fetch activities from Strava (last 30 activities)
	activities, err := s.stravaClient.GetActivities(conn.AccessToken, 1, 30)
	if err != nil {
		return 0, err
	}

	syncedCount := 0

	// Store each activity (only runs)
	for _, act := range activities {
		if act.Type != "Run" {
			continue // Skip non-running activities
		}

		// Parse start time
		startTime, err := time.Parse(time.RFC3339, act.StartDate)
		if err != nil {
			continue
		}

		// Calculate pace (seconds per km)
		var avgPace float64
		if act.Distance > 0 {
			distanceKm := act.Distance / 1000.0
			avgPace = float64(act.MovingTime) / distanceKm
		}

		// Convert heart rate to int pointer
		var avgHR *int
		if act.AverageHeartrate > 0 {
			hr := int(act.AverageHeartrate)
			avgHR = &hr
		}

		// Convert elevation gain to float pointer
		var elevGain *float64
		if act.TotalElevationGain > 0 {
			elevGain = &act.TotalElevationGain
		}

		// Convert max heart rate
		var maxHR *int
		if act.MaxHeartrate > 0 {
			mhr := int(act.MaxHeartrate)
			maxHR = &mhr
		}

		// Convert cadence
		var cadence *float64
		if act.AverageCadence > 0 {
			cadence = &act.AverageCadence
		}

		// Convert suffer score
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
			ActivityType:            "run",
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
			ON CONFLICT (source, source_activity_id) DO UPDATE SET
				name = EXCLUDED.name,
				distance_meters = EXCLUDED.distance_meters,
				duration_seconds = EXCLUDED.duration_seconds,
				average_pace_seconds_per_km = EXCLUDED.average_pace_seconds_per_km,
				average_heart_rate = EXCLUDED.average_heart_rate,
				max_heart_rate = EXCLUDED.max_heart_rate,
				elevation_gain_meters = EXCLUDED.elevation_gain_meters,
				average_cadence = EXCLUDED.average_cadence,
				suffer_score = EXCLUDED.suffer_score,
				synced_at = EXCLUDED.synced_at
		`

		_, err = s.db.NamedExecContext(ctx, query, activity)
		if err != nil {
			continue
		}

		syncedCount++
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
func (s *StravaService) GetUserActivities(ctx context.Context, userID uuid.UUID, limit int) ([]models.Activity, error) {
	if limit == 0 {
		limit = 20
	}

	var activities []models.Activity
	query := `
		SELECT * FROM activities
		WHERE user_id = $1
		ORDER BY start_time DESC
		LIMIT $2
	`
	err := s.db.SelectContext(ctx, &activities, query, userID, limit)
	if err != nil {
		return nil, err
	}

	return activities, nil
}
