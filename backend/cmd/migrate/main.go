// Package main applies all pending database migrations from
// internal/database/migrations to the database referenced by DATABASE_URL.
//
// Usage:
//
//	go run ./cmd/migrate
//
// The runner is idempotent: re-running with no new migrations is a no-op.
// Migration 013 (Supabase auth trigger) is excluded because it touches the
// auth schema and must be applied manually via the Supabase SQL editor.
// See internal/database/migrations/manual/README.md for the procedure.
package main

import (
	"errors"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"

	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database/migrations"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("Failed to load configuration: %v", err)
	}

	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		log.Fatalf("Failed to load embedded migrations: %v", err)
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("Failed to initialize migrator: %v", err)
	}
	defer func() {
		if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
			log.Printf("Warning: error closing migrator (source=%v db=%v)", srcErr, dbErr)
		}
	}()

	log.Println("Applying database migrations...")
	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Println("Database already up to date.")
			return
		}
		log.Fatalf("Failed to apply migrations: %v", err)
	}

	version, dirty, err := m.Version()
	if err != nil {
		log.Fatalf("Failed to read schema version: %v", err)
	}
	log.Printf("Migrations applied. Schema version: %d (dirty=%v)", version, dirty)
}
