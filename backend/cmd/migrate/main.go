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
	"fmt"
	"os"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"
	"github.com/joho/godotenv"

	"github.com/korsana/backend/internal/config"
	"github.com/korsana/backend/internal/database/migrations"
	"github.com/korsana/backend/internal/logger"
)

func main() {
	_ = godotenv.Load()

	cfg, err := config.Load()
	if err != nil {
		fmt.Fprintf(os.Stderr, "Failed to load configuration: %v\n", err)
		os.Exit(1)
	}

	log := logger.Init(cfg.Environment, nil)

	source, err := iofs.New(migrations.FS, ".")
	if err != nil {
		log.Error("Failed to load embedded migrations", "error", err)
		os.Exit(1)
	}

	m, err := migrate.NewWithSourceInstance("iofs", source, cfg.DatabaseURL)
	if err != nil {
		log.Error("Failed to initialize migrator", "error", err)
		os.Exit(1)
	}
	defer func() {
		if srcErr, dbErr := m.Close(); srcErr != nil || dbErr != nil {
			log.Warn("Error closing migrator", "source_err", srcErr, "db_err", dbErr)
		}
	}()

	log.Info("Applying database migrations")
	if err := m.Up(); err != nil {
		if errors.Is(err, migrate.ErrNoChange) {
			log.Info("Database already up to date")
			return
		}
		log.Error("Failed to apply migrations", "error", err)
		os.Exit(1)
	}

	version, dirty, err := m.Version()
	if err != nil {
		log.Error("Failed to read schema version", "error", err)
		os.Exit(1)
	}
	log.Info("Migrations applied", "version", version, "dirty", dirty)
}
