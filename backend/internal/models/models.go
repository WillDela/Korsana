package models

import (
	"time"

	"github.com/google/uuid"
)

// User represents a user in the system
type User struct {
	ID           uuid.UUID `json:"id" db:"id"`
	Email        string    `json:"email" db:"email"`
	PasswordHash string    `json:"-" db:"password_hash"`
	CreatedAt    time.Time `json:"created_at" db:"created_at"`
	UpdatedAt    time.Time `json:"updated_at" db:"updated_at"`
}

// StravaConnection represents a user's Strava OAuth connection
type StravaConnection struct {
	ID              uuid.UUID `json:"id" db:"id"`
	UserID          uuid.UUID `json:"user_id" db:"user_id"`
	StravaAthleteID int64     `json:"strava_athlete_id" db:"strava_athlete_id"`
	AccessToken     string    `json:"-" db:"access_token"`
	RefreshToken    string    `json:"-" db:"refresh_token"`
	TokenExpiresAt  time.Time `json:"token_expires_at" db:"token_expires_at"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// RaceGoal represents a user's race goal (the "North Star")
type RaceGoal struct {
	ID                 uuid.UUID `json:"id" db:"id"`
	UserID             uuid.UUID `json:"user_id" db:"user_id"`
	RaceName           string    `json:"race_name" db:"race_name"`
	RaceDate           time.Time `json:"race_date" db:"race_date"`
	RaceDistanceMeters int       `json:"race_distance_meters" db:"race_distance_meters"`
	TargetTimeSeconds  *int      `json:"target_time_seconds" db:"target_time_seconds"` // nil if just "finish"
	GoalType           string    `json:"goal_type" db:"goal_type"`                     // "finish", "time", "pr"
	IsActive           bool      `json:"is_active" db:"is_active"`
	CreatedAt          time.Time `json:"created_at" db:"created_at"`
	UpdatedAt          time.Time `json:"updated_at" db:"updated_at"`
}

// Activity represents a running activity synced from external sources
type Activity struct {
	ID                      uuid.UUID `json:"id" db:"id"`
	UserID                  uuid.UUID `json:"user_id" db:"user_id"`
	Source                  string    `json:"source" db:"source"` // "strava", "garmin", "manual"
	SourceActivityID        string    `json:"source_activity_id" db:"source_activity_id"`
	ActivityType            string    `json:"activity_type" db:"activity_type"` // "run", "long_run", "workout", "race"
	Name                    string    `json:"name" db:"name"`
	DistanceMeters          float64   `json:"distance_meters" db:"distance_meters"`
	DurationSeconds         int       `json:"duration_seconds" db:"duration_seconds"`
	StartTime               time.Time `json:"start_time" db:"start_time"`
	AveragePaceSecondsPerKm float64   `json:"average_pace_seconds_per_km" db:"average_pace_seconds_per_km"`
	AverageHeartRate        *int      `json:"average_heart_rate" db:"average_heart_rate"`
	MaxHeartRate            *int      `json:"max_heart_rate" db:"max_heart_rate"`
	ElevationGainMeters     *float64  `json:"elevation_gain_meters" db:"elevation_gain_meters"`
	AverageCadence          *float64  `json:"average_cadence" db:"average_cadence"`
	SufferScore             *int      `json:"suffer_score" db:"suffer_score"`
	SyncedAt                time.Time `json:"synced_at" db:"synced_at"`
}

// CoachConversation represents a message in the AI coach conversation
type CoachConversation struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Role      string    `json:"role" db:"role"` // "user", "assistant"
	Content   string    `json:"content" db:"content"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
}

// WeeklySummary represents aggregated weekly training data
type WeeklySummary struct {
	ID                      uuid.UUID `json:"id" db:"id"`
	UserID                  uuid.UUID `json:"user_id" db:"user_id"`
	WeekStart               time.Time `json:"week_start" db:"week_start"`
	TotalDistanceMeters     float64   `json:"total_distance_meters" db:"total_distance_meters"`
	TotalDurationSeconds    int       `json:"total_duration_seconds" db:"total_duration_seconds"`
	RunCount                int       `json:"run_count" db:"run_count"`
	AveragePaceSecondsPerKm float64   `json:"average_pace_seconds_per_km" db:"average_pace_seconds_per_km"`
	LongestRunMeters        *float64  `json:"longest_run_meters" db:"longest_run_meters"`
	CreatedAt               time.Time `json:"created_at" db:"created_at"`
	UpdatedAt               time.Time `json:"updated_at" db:"updated_at"`
}

// CalendarEntry represents a planned or completed workout on a specific day
type CalendarEntry struct {
	ID                     uuid.UUID  `json:"id" db:"id"`
	UserID                 uuid.UUID  `json:"user_id" db:"user_id"`
	Date                   time.Time  `json:"date" db:"date"`
	WorkoutType            string     `json:"workout_type" db:"workout_type"`
	Title                  string     `json:"title" db:"title"`
	Description            *string    `json:"description" db:"description"`
	PlannedDistanceMeters  *int       `json:"planned_distance_meters" db:"planned_distance_meters"`
	PlannedDurationMinutes *int       `json:"planned_duration_minutes" db:"planned_duration_minutes"`
	PlannedPacePerKm       *int       `json:"planned_pace_per_km" db:"planned_pace_per_km"`
	Status                 string     `json:"status" db:"status"`
	CompletedActivityID    *uuid.UUID `json:"completed_activity_id" db:"completed_activity_id"`
	Source                 string     `json:"source" db:"source"`
	CreatedAt              time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt              time.Time  `json:"updated_at" db:"updated_at"`
}

// Common race distances in meters
const (
	Distance5K           = 5000
	Distance10K          = 10000
	DistanceHalfMarathon = 21097
	DistanceMarathon     = 42195
)
