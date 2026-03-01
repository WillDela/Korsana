package main

import (
	"fmt"
	"log"

	"github.com/jmoiron/sqlx"
	"github.com/korsana/backend/pkg/strava"
	_ "github.com/lib/pq"
)

func main() {
	db, err := sqlx.Connect("postgres", "postgres://postgres:postgres@localhost:5432/korsana?sslmode=disable")
	if err != nil {
		log.Fatalln(err)
	}

	var accessToken string
	err = db.Get(&accessToken, "SELECT access_token FROM strava_connections LIMIT 1")
	if err != nil {
		log.Fatalln("No token found")
	}

	client := strava.NewClient("", "", "")
	activities, err := client.GetActivities(accessToken, 1, 30)
	if err != nil {
		log.Fatalln(err)
	}

	fmt.Printf("Fetched %d activities from Strava\n", len(activities))
	for _, act := range activities {
		fmt.Printf("- ID: %d, Type: %s, SportType: %s, Name: %s\n", act.ID, act.Type, act.SportType, act.Name)
	}
}
