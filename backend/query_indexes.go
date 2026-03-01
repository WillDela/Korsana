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

	var indexes []struct {
		Indexname string `db:"indexname"`
		Indexdef  string `db:"indexdef"`
	}
	err = db.Select(&indexes, "SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'activities'")
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Printf("Found %d indexes on activities table:\n", len(indexes))
	for _, idx := range indexes {
		fmt.Printf("- %s: %s\n", idx.Indexname, idx.Indexdef)
	}
}
