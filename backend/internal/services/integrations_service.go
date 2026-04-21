package services

import (
	"context"
	"database/sql"
	"errors"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/models"
)

var ErrIntegrationSourceUnsupported = errors.New("unsupported integration source")

type integrationsQuerier interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	SelectContext(ctx context.Context, dest any, query string, args ...any) error
	GetContext(ctx context.Context, dest any, query string, args ...any) error
}

type IntegrationsService struct {
	db integrationsQuerier
}

func NewIntegrationsService(db *database.DB) *IntegrationsService {
	return &IntegrationsService{db: db}
}

func (s *IntegrationsService) ListInterestRequests(ctx context.Context, userID uuid.UUID) ([]models.IntegrationInterestRequest, error) {
	var requests []models.IntegrationInterestRequest
	query := `
		SELECT id, user_id, source, status, notes, created_at, updated_at
		FROM integration_interest_requests
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	if err := s.db.SelectContext(ctx, &requests, query, userID); err != nil {
		return nil, err
	}
	return requests, nil
}

func (s *IntegrationsService) UpsertInterestRequest(ctx context.Context, userID uuid.UUID, source string) (*models.IntegrationInterestRequest, error) {
	source = normalizeIntegrationSource(source)
	if !isRequestableIntegrationSource(source) {
		return nil, ErrIntegrationSourceUnsupported
	}

	id := uuid.New()
	now := time.Now()
	status := "requested"

	query := `
		INSERT INTO integration_interest_requests (id, user_id, source, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6)
		ON CONFLICT (user_id, source) DO UPDATE SET
			status = EXCLUDED.status,
			updated_at = EXCLUDED.updated_at
		RETURNING id, user_id, source, status, notes, created_at, updated_at
	`

	var request models.IntegrationInterestRequest
	if err := s.db.GetContext(ctx, &request, query, id, userID, source, status, now, now); err != nil {
		return nil, err
	}
	return &request, nil
}

func normalizeIntegrationSource(source string) string {
	return strings.ToLower(strings.TrimSpace(source))
}

func isRequestableIntegrationSource(source string) bool {
	switch source {
	case "garmin", "coros":
		return true
	default:
		return false
	}
}
