package database_test

import (
	"context"
	"errors"
	"fmt"
	"os"
	"reflect"
	"strings"
	"testing"
	"time"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"github.com/korsana/backend/internal/database/migrations"
	"github.com/korsana/backend/internal/models"
)

// schemaTargets is the explicit (table → model) registry. Adding a new model
// means adding one line here; missing entries are silently ignored, which is
// the intentional failure mode — easy to spot in code review.
var schemaTargets = []struct {
	table string
	model any
}{
	{"users", models.User{}},
	{"strava_connections", models.StravaConnection{}},
	{"race_goals", models.RaceGoal{}},
	{"activities", models.Activity{}},
	{"connected_integrations", models.ConnectedIntegration{}},
	{"coach_sessions", models.CoachSession{}},
	{"coach_conversations", models.CoachConversation{}},
	{"weekly_summaries", models.WeeklySummary{}},
	{"training_calendar", models.CalendarEntry{}},
	{"cross_training_goals", models.CrossTrainingGoal{}},
	{"user_profiles", models.UserProfile{}},
	{"notification_deliveries", models.NotificationDelivery{}},
	{"integration_interest_requests", models.IntegrationInterestRequest{}},
	{"personal_records", models.PersonalRecord{}},
	{"training_zones", models.TrainingZone{}},
}

// TestSchemaDrift asserts every db: tag on every registered model struct
// resolves to a real column in information_schema. Boots a fresh public
// schema, applies every embedded migration, then walks the registry.
//
// Gated on TEST_DATABASE_URL — local `go test ./...` without Docker still
// passes by skipping. CI sets the env var via a postgres service container.
func TestSchemaDrift(t *testing.T) {
	dbURL := os.Getenv("TEST_DATABASE_URL")
	if dbURL == "" {
		t.Skip("TEST_DATABASE_URL not set; skipping schema drift test")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 60*time.Second)
	defer cancel()

	db := openCleanDB(t, ctx, dbURL)
	t.Cleanup(func() { _ = db.Close() })

	applyMigrations(t, dbURL)

	columns := loadColumnIndex(t, ctx, db)

	for _, target := range schemaTargets {
		t.Run(target.table, func(t *testing.T) {
			cols, ok := columns[target.table]
			if !ok {
				t.Errorf("table %q is registered for %T but does not exist in the database", target.table, target.model)
				return
			}
			missing := missingColumns(target.model, cols)
			if len(missing) > 0 {
				t.Errorf("table %q is missing columns for %T: %s",
					target.table, target.model, strings.Join(missing, ", "))
			}
		})
	}
}

// openCleanDB connects to dbURL and recreates the public schema so each run
// starts from zero. Re-running locally is idempotent.
func openCleanDB(t *testing.T, ctx context.Context, dbURL string) *sqlx.DB {
	t.Helper()
	db, err := sqlx.ConnectContext(ctx, "postgres", dbURL)
	if err != nil {
		t.Fatalf("connect: %v", err)
	}
	if _, err := db.ExecContext(ctx, "DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;"); err != nil {
		t.Fatalf("reset schema: %v", err)
	}
	return db
}

// applyMigrations runs every embedded migration against the test DB. Mirrors
// cmd/migrate/main.go so production and tests apply the exact same set.
func applyMigrations(t *testing.T, dbURL string) {
	t.Helper()
	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		t.Fatalf("load migrations: %v", err)
	}
	m, err := migrate.NewWithSourceInstance("iofs", source, dbURL)
	if err != nil {
		t.Fatalf("init migrator: %v", err)
	}
	defer func() { _, _ = m.Close() }()
	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		t.Fatalf("apply migrations: %v", err)
	}
}

// loadColumnIndex returns table → set-of-column-names from information_schema,
// limited to the public schema since auth/storage are Supabase-managed and
// out of scope for this drift check.
func loadColumnIndex(t *testing.T, ctx context.Context, db *sqlx.DB) map[string]map[string]struct{} {
	t.Helper()
	rows, err := db.QueryContext(ctx,
		`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public'`)
	if err != nil {
		t.Fatalf("query information_schema: %v", err)
	}
	defer rows.Close()

	out := map[string]map[string]struct{}{}
	for rows.Next() {
		var table, column string
		if err := rows.Scan(&table, &column); err != nil {
			t.Fatalf("scan column row: %v", err)
		}
		if _, ok := out[table]; !ok {
			out[table] = map[string]struct{}{}
		}
		out[table][column] = struct{}{}
	}
	return out
}

// missingColumns returns the db: tags on model whose names don't exist in
// the column set. Tags of `-` and embedded/anonymous fields are skipped.
func missingColumns(model any, cols map[string]struct{}) []string {
	t := reflect.TypeOf(model)
	var missing []string
	for i := 0; i < t.NumField(); i++ {
		tag := t.Field(i).Tag.Get("db")
		if tag == "" || tag == "-" {
			continue
		}
		// db:"name,opt" — only the name matters for column matching.
		name := strings.Split(tag, ",")[0]
		if _, ok := cols[name]; !ok {
			missing = append(missing, fmt.Sprintf("%s (struct field %s)", name, t.Field(i).Name))
		}
	}
	return missing
}
