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

	var count int
	err = db.Get(&count, "SELECT count(*) FROM activities")
	if err != nil {
		log.Fatalln(err)
	}
	fmt.Printf("Total activities: %d\n", count)
}
