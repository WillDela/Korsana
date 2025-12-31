package services

import (
	"context"
	"errors"
	"time"

	"github.com/allinrun/backend/internal/database"
	"github.com/allinrun/backend/internal/models"
	"github.com/allinrun/backend/pkg/strava"
	"github.com/google/uuid"
)

// StravaService handles Strava business logic
type StravaService struct {
	db           *database.DB
	stravaClient *strava.Client
}

// NewStravaService creates a new Strava service
func NewStravaService(db *database.DB, client *strava.Client) *StravaService {
	return &StravaService{
		db:           db,
		stravaClient: client,
	}
}

// GetAuthURL returns the Strava OAuth URL
func (s *StravaService) GetAuthURL() string {
	return s.stravaClient.GetAuthorizationURL()
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
