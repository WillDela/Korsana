package services

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
)

type mockNotificationDB struct {
	execCalls int
}

func (m *mockNotificationDB) ExecContext(_ context.Context, _ string, _ ...any) (sql.Result, error) {
	m.execCalls++
	return nil, nil
}

func (m *mockNotificationDB) SelectContext(_ context.Context, _ any, _ string, _ ...any) error {
	return nil
}

func TestSendTestNotification_UnconfiguredEmailRecordsSkippedDelivery(t *testing.T) {
	db := &mockNotificationDB{}
	svc := &NotificationService{
		db:            db,
		frontendURL:   "https://korsana.run",
		smtpFromEmail: "",
	}

	user := &models.User{ID: uuid.New(), Email: "runner@example.com"}
	profile := &models.UserProfile{}

	delivery, err := svc.SendTestNotification(context.Background(), user, profile, nil, "weekly_summary")
	if !errors.Is(err, ErrEmailNotConfigured) {
		t.Fatalf("expected ErrEmailNotConfigured, got %v", err)
	}
	if delivery == nil {
		t.Fatal("expected skipped delivery to be returned")
	}
	if delivery.Status != "skipped" {
		t.Fatalf("expected skipped status, got %q", delivery.Status)
	}
	if db.execCalls != 1 {
		t.Fatalf("expected one delivery insert, got %d", db.execCalls)
	}
}

func TestBuildTestNotification_UnsupportedType(t *testing.T) {
	svc := &NotificationService{}
	_, _, err := svc.buildTestNotification(&models.User{Email: "runner@example.com"}, &models.UserProfile{}, nil, "unsupported")
	if !errors.Is(err, ErrNotificationTypeUnsupported) {
		t.Fatalf("expected ErrNotificationTypeUnsupported, got %v", err)
	}
}
