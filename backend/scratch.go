package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"

	_ "github.com/lib/pq"
)

func main() {
	db, err := sql.Open("postgres", "postgresql://postgres.mrvxngihnyxxyeahapvt:6qG%2FpJP%2CRYiY9xk@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require")
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	rows, err := db.QueryContext(context.Background(), "SELECT user_id, date, used_count, daily_limit FROM coach_rate_limits")
	if err != nil {
		log.Fatal(err)
	}
	defer rows.Close()

	fmt.Println("coach_rate_limits:")
	for rows.Next() {
		var userID string
		var date string
		var usedCount int
		var dailyLimit int
		if err := rows.Scan(&userID, &date, &usedCount, &dailyLimit); err != nil {
			log.Fatal(err)
		}
		fmt.Printf("user: %s, date: %s, used: %d, limit: %d\n", userID, date, usedCount, dailyLimit)
	}
	
	fmt.Println("Done.")
}
