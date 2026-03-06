package main

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"
)

func main() {
	db, err := sqlx.Connect("postgres", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}

	// 1. Find all duplicate activities based on completed_activity_id
	queryDuplicates := `
		SELECT completed_activity_id, date, title, COUNT(*)
		FROM training_calendar 
		WHERE source = 'strava' AND completed_activity_id IS NOT NULL 
		GROUP BY completed_activity_id, date, title
		HAVING COUNT(*) > 1
	`
	type DupeCal struct {
		CompletedActivityID string `db:"completed_activity_id"`
		Date                string `db:"date"`
		Title               string `db:"title"`
		Count               int    `db:"count"`
	}
	var dupIDs []DupeCal
	if err := db.Select(&dupIDs, queryDuplicates); err != nil {
		log.Println("No exact Strava completed_id duplicates found or querying error:", err)
	}

	fmt.Printf("Found %d duplicated Strava events inside training_calendar.\n", len(dupIDs))
	for _, d := range dupIDs {
		fmt.Printf("Duplicate: %s on %s count: %d\n", d.Title, d.Date, d.Count)

		var ids []string
		err := db.Select(&ids, "SELECT id::text FROM training_calendar WHERE completed_activity_id = $1 ORDER BY created_at DESC", d.CompletedActivityID)
		if err == nil && len(ids) > 1 {
			keepID := ids[0]
			deleteIDs := ids[1:]
			for _, did := range deleteIDs {
				db.Exec("DELETE FROM training_calendar WHERE id = $1", did)
			}
			fmt.Printf("Kept newest entry %s, deleted %d older ones.\n", keepID, len(deleteIDs))
		}
	}

	// Also check for NULL completed_activity_id duplicates
	queryDuplicatesNull := `
		SELECT date, title, COUNT(*)
		FROM training_calendar 
		WHERE source = 'strava' AND completed_activity_id IS NULL AND status = 'completed'
		GROUP BY date, title
		HAVING COUNT(*) > 1
	`
	type DupeCalNull struct {
		Date  string `db:"date"`
		Title string `db:"title"`
		Count int    `db:"count"`
	}
	var dupNulls []DupeCalNull
	if err := db.Select(&dupNulls, queryDuplicatesNull); err == nil {
		fmt.Printf("Found %d duplicated Strava events with NULL activity_id.\n", len(dupNulls))
	}

	fmt.Println("Cleanup complete!")
}
