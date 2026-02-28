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

	var activities []struct {
		ID   string `db:"id"`
		Type string `db:"activity_type"`
		Name string `db:"name"`
	}
	err = db.Select(&activities, "SELECT id, activity_type, name FROM activities")
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Printf("Total activities: %d\n", len(activities))
	for _, a := range activities {
		fmt.Printf("- %s: %s\n", a.Type, a.Name)
	}
}
