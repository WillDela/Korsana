package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func main() {
	db, err := sqlx.Connect("postgres", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}
	defer db.Close()

	migrationsDir := "internal/database/migrations"
	migrations := []string{
		"005_connected_integrations.sql",
		"006_multi_activity.sql",
		"007_drop_calendar_unique.sql",
		"008_user_profiles.sql",
		"009_profile_preferences.sql",
		"010_coach_rate_limits.sql",
		"011_coach_sessions.sql",
		"019_notifications_and_integration_interest.sql",
	}

	for _, migrationFile := range migrations {
		filePath := filepath.Join(migrationsDir, migrationFile)
		content, err := os.ReadFile(filePath)
		if err != nil {
			log.Fatalf("Failed to read migration %s: %v", migrationFile, err)
		}

		fmt.Printf("Running migration: %s\n", migrationFile)
		_, err = db.Exec(string(content))
		if err != nil {
			log.Fatalf("Failed to execute migration %s: %v", migrationFile, err)
		}
	}

	fmt.Println("Successfully applied all migrations.")
}
