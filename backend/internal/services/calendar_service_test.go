package services

import (
	"context"
	"database/sql"
	"strings"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/models"
)

type mockCalendarQuerier struct {
	getQuery string
	getArgs  []any
}

func (m *mockCalendarQuerier) NamedExecContext(_ context.Context, _ string, _ any) (sql.Result, error) {
	return nil, nil
}

func (m *mockCalendarQuerier) GetContext(_ context.Context, dest any, query string, args ...any) error {
	m.getQuery = query
	m.getArgs = append([]any(nil), args...)

	if entry, ok := dest.(*models.CalendarEntry); ok {
		entry.ID = args[0].(uuid.UUID)
		entry.UserID = args[1].(uuid.UUID)
	}

	return nil
}

func (m *mockCalendarQuerier) SelectContext(_ context.Context, _ any, _ string, _ ...any) error {
	return nil
}

func (m *mockCalendarQuerier) ExecContext(_ context.Context, _ string, _ ...any) (sql.Result, error) {
	return nil, nil
}

func TestCreateEntryScopesReadbackByUser(t *testing.T) {
	db := &mockCalendarQuerier{}
	svc := &CalendarService{db: db}
	userID := uuid.New()

	entry := &models.CalendarEntry{
		Date:        time.Date(2026, time.April, 18, 0, 0, 0, 0, time.UTC),
		WorkoutType: "easy",
		Title:       "Easy run",
		Status:      "planned",
	}

	result, err := svc.CreateEntry(context.Background(), userID, entry)
	if err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}
	if result == nil {
		t.Fatal("expected created entry")
	}
	if !strings.Contains(db.getQuery, "user_id = $2") {
		t.Fatalf("expected readback query to scope by user_id, got %q", db.getQuery)
	}
	if len(db.getArgs) != 2 {
		t.Fatalf("expected readback query to use entry id and user id, got %#v", db.getArgs)
	}
	if db.getArgs[1] != userID {
		t.Fatalf("expected second query arg to be userID, got %#v", db.getArgs[1])
	}
}
