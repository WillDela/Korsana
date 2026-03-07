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
	ID                      uuid.UUID      `json:"id" db:"id"`
	UserID                  uuid.UUID      `json:"user_id" db:"user_id"`
	Source                  string         `json:"source" db:"source"` // "strava", "garmin", "manual"
	SourceActivityID        string         `json:"source_activity_id" db:"source_activity_id"`
	ActivityType            string         `json:"activity_type" db:"activity_type"` // "run", "long_run", "workout", "race"
	Name                    string         `json:"name" db:"name"`
	DistanceMeters          float64        `json:"distance_meters" db:"distance_meters"`
	DurationSeconds         int            `json:"duration_seconds" db:"duration_seconds"`
	StartTime               time.Time      `json:"start_time" db:"start_time"`
	AveragePaceSecondsPerKm float64        `json:"average_pace_seconds_per_km" db:"average_pace_seconds_per_km"`
	AverageHeartRate        *int           `json:"average_heart_rate" db:"average_heart_rate"`
	MaxHeartRate            *int           `json:"max_heart_rate" db:"max_heart_rate"`
	ElevationGainMeters     *float64       `json:"elevation_gain_meters" db:"elevation_gain_meters"`
	AverageCadence          *float64       `json:"average_cadence" db:"average_cadence"`
	SufferScore             *int           `json:"suffer_score" db:"suffer_score"`
	SyncedAt                time.Time      `json:"synced_at" db:"synced_at"`
	CustomFields            map[string]any `json:"custom_fields,omitempty" db:"-"`
}

// ConnectedIntegration tracks a user's OAuth connection to an external data source.
// Valid sources: "strava", "garmin", "coros".
// Strava is always is_primary when connected. Only one primary per user (enforced by DB index).
type ConnectedIntegration struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id"`
	Source         string     `json:"source" db:"source"`
	AccessToken    string     `json:"-" db:"access_token"`
	RefreshToken   *string    `json:"-" db:"refresh_token"`
	TokenExpiresAt *time.Time `json:"token_expires_at" db:"token_expires_at"`
	ExternalUserID *string    `json:"external_user_id" db:"external_user_id"`
	IsActive       bool       `json:"is_active" db:"is_active"`
	IsPrimary      bool       `json:"is_primary" db:"is_primary"`
	ConnectedAt    time.Time  `json:"connected_at" db:"connected_at"`
	LastSyncedAt   *time.Time `json:"last_synced_at" db:"last_synced_at"`
}

// CoachSession groups a set of coach messages into a named conversation.
type CoachSession struct {
	ID        uuid.UUID `json:"id" db:"id"`
	UserID    uuid.UUID `json:"user_id" db:"user_id"`
	Title     string    `json:"title" db:"title"`
	CreatedAt time.Time `json:"created_at" db:"created_at"`
	UpdatedAt time.Time `json:"updated_at" db:"updated_at"`
}

// CoachConversation represents a message in the AI coach conversation
type CoachConversation struct {
	ID        uuid.UUID  `json:"id" db:"id"`
	UserID    uuid.UUID  `json:"user_id" db:"user_id"`
	Role      string     `json:"role" db:"role"` // "user", "assistant"
	Content   string     `json:"content" db:"content"`
	CreatedAt time.Time  `json:"created_at" db:"created_at"`
	SessionID *uuid.UUID `json:"session_id,omitempty" db:"session_id"`
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

// CrossTrainingGoal represents a user's weekly cross-training target
type CrossTrainingGoal struct {
	ID              uuid.UUID `json:"id" db:"id"`
	UserID          uuid.UUID `json:"user_id" db:"user_id"`
	ActivityType    string    `json:"activity_type" db:"activity_type"`
	SessionsPerWeek int       `json:"sessions_per_week" db:"sessions_per_week"`
	IsActive        bool      `json:"is_active" db:"is_active"`
	CreatedAt       time.Time `json:"created_at" db:"created_at"`
	UpdatedAt       time.Time `json:"updated_at" db:"updated_at"`
}

// UserProfile represents a user's extended profile setting
type UserProfile struct {
	ID                       uuid.UUID `json:"id" db:"id"`
	UserID                   uuid.UUID `json:"user_id" db:"user_id"`
	DisplayName              *string   `json:"display_name" db:"display_name"`
	ProfilePictureURL        *string   `json:"profile_picture_url" db:"profile_picture_url"`
	MaxHeartRate             *int      `json:"max_heart_rate" db:"max_heart_rate"`
	RestingHeartRate         *int      `json:"resting_heart_rate" db:"resting_heart_rate"`
	WeeklyDistanceGoalMeters *int      `json:"weekly_distance_goal_meters" db:"weekly_distance_goal_meters"`
	UnitsPreference          string    `json:"units_preference" db:"units_preference"`
	NotifyWeeklySummary      bool      `json:"notify_weekly_summary" db:"notify_weekly_summary"`
	NotifyGoalReminders      bool      `json:"notify_goal_reminders" db:"notify_goal_reminders"`
	NotifySyncFailures       bool      `json:"notify_sync_failures" db:"notify_sync_failures"`
	CreatedAt                time.Time `json:"created_at" db:"created_at"`
	UpdatedAt                time.Time `json:"updated_at" db:"updated_at"`
}

// PersonalRecord represents an athlete's best time for a given distance
type PersonalRecord struct {
	ID             uuid.UUID  `json:"id" db:"id"`
	UserID         uuid.UUID  `json:"user_id" db:"user_id"`
	Label          string     `json:"label" db:"label"`
	DistanceMeters *int       `json:"distance_meters" db:"distance_meters"`
	TimeSeconds    int        `json:"time_seconds" db:"time_seconds"`
	Source         string     `json:"source" db:"source"`
	ActivityID     *uuid.UUID `json:"activity_id" db:"activity_id"`
	RecordedAt     *time.Time `json:"recorded_at" db:"recorded_at"`
	Notes          *string    `json:"notes" db:"notes"`
	CreatedAt      time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at" db:"updated_at"`
}

// TrainingZone represents HR or Pace zones (Z1-Z5)
type TrainingZone struct {
	ID               uuid.UUID `json:"id" db:"id"`
	UserID           uuid.UUID `json:"user_id" db:"user_id"`
	ZoneType         string    `json:"zone_type" db:"zone_type"`
	ZoneNumber       int       `json:"zone_number" db:"zone_number"`
	Label            *string   `json:"label" db:"label"`
	Description      *string   `json:"description" db:"description"`
	MinValue         *int      `json:"min_value" db:"min_value"`
	MaxValue         *int      `json:"max_value" db:"max_value"`
	IsAutoCalculated bool      `json:"is_auto_calculated" db:"is_auto_calculated"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// Activity type constants
const (
	ActivityTypeRun           = "run"
	ActivityTypeCycling       = "cycling"
	ActivityTypeSwimming      = "swimming"
	ActivityTypeWalking       = "walking"
	ActivityTypeHiking        = "hiking"
	ActivityTypeRowing        = "rowing"
	ActivityTypeElliptical    = "elliptical"
	ActivityTypeStairMaster   = "stair_master"
	ActivityTypeWeightLifting = "weight_lifting"
	ActivityTypeWorkout       = "workout"
	ActivityTypeRecovery      = "recovery"
)

// DistanceBasedTypes identifies activity types measured by distance
var DistanceBasedTypes = map[string]bool{
	ActivityTypeRun:      true,
	ActivityTypeCycling:  true,
	ActivityTypeSwimming: true,
	ActivityTypeWalking:  true,
	ActivityTypeHiking:   true,
	ActivityTypeRowing:   true,
}

// Common race distances in meters
const (
	Distance5K           = 5000
	Distance10K          = 10000
	DistanceHalfMarathon = 21097
	DistanceMarathon     = 42195
)
