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

	_, err = db.Exec("ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_source_source_activity_id_key")
	if err != nil {
		fmt.Printf("Error dropping constraint: %v\n", err)
	} else {
		fmt.Println("Dropped activities_source_source_activity_id_key successfully")
	}

	// Checking if there's an index with the same name that wasn't a constraint
	_, err = db.Exec("DROP INDEX IF EXISTS activities_source_source_activity_id_key")
	if err != nil {
		fmt.Printf("Error dropping index: %v\n", err)
	} else {
		fmt.Println("Dropped index activities_source_source_activity_id_key successfully")
	}

	// Checking if it was named something else by default
	_, err = db.Exec("ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_source_source_activity_id_key1")
	if err != nil {
		fmt.Printf("Error dropping constraint 1: %v\n", err)
	}
}
