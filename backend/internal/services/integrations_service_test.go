package services

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
)

type mockIntegrationsDB struct {
	lastSource string
}

func (m *mockIntegrationsDB) ExecContext(_ context.Context, _ string, _ ...any) (sql.Result, error) {
	return nil, nil
}

func (m *mockIntegrationsDB) SelectContext(_ context.Context, _ any, _ string, _ ...any) error {
	return nil
}

func (m *mockIntegrationsDB) GetContext(_ context.Context, dest any, _ string, args ...any) error {
	m.lastSource = args[2].(string)
	request := dest.(*models.IntegrationInterestRequest)
	*request = models.IntegrationInterestRequest{
		ID:        uuid.New(),
		UserID:    args[1].(uuid.UUID),
		Source:    m.lastSource,
		Status:    args[3].(string),
		CreatedAt: args[4].(time.Time),
		UpdatedAt: args[5].(time.Time),
	}
	return nil
}

func TestUpsertInterestRequest_NormalizesSupportedSource(t *testing.T) {
	db := &mockIntegrationsDB{}
	svc := &IntegrationsService{db: db}

	request, err := svc.UpsertInterestRequest(context.Background(), uuid.New(), " Garmin ")
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if request.Source != "garmin" {
		t.Fatalf("expected normalized source garmin, got %q", request.Source)
	}
}

func TestUpsertInterestRequest_RejectsUnsupportedSource(t *testing.T) {
	svc := &IntegrationsService{db: &mockIntegrationsDB{}}
	_, err := svc.UpsertInterestRequest(context.Background(), uuid.New(), "polar")
	if !errors.Is(err, ErrIntegrationSourceUnsupported) {
		t.Fatalf("expected ErrIntegrationSourceUnsupported, got %v", err)
	}
}
