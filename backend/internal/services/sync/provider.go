package sync

import (
	"time"

	"github.com/korsana/backend/internal/models"
)

// RawActivity is the normalized representation of an activity from any source.
// Each DataProvider maps its platform-specific fields into this struct.
type RawActivity struct {
	SourceID    string
	Source      string // "strava", "garmin", "coros", "manual"
	StartTime   time.Time
	Duration    int     // seconds
	Distance    float64 // meters
	AvgPace     float64 // seconds per km
	AvgHR       *int
	MaxHR       *int
	AvgCadence  *float64
	ElevGain    *float64
	SufferScore *int
	SportType   string // "run", "long_run", "workout", "race"
	Name        string
}

// DataProvider is the contract every integration must satisfy.
// Strava, Garmin, and Coros each implement this interface.
// The sync service never needs to know which provider it is calling.
type DataProvider interface {
	// GetProviderName returns the source string ("strava", "garmin", "coros").
	GetProviderName() string

	// FetchRecentActivities returns activities since the given time.
	// Used for incremental syncs triggered by webhooks or manual sync.
	FetchRecentActivities(integration *models.ConnectedIntegration, since time.Time) ([]RawActivity, error)

	// FetchAllActivities returns the full activity history for the user.
	// Used when a higher-priority source is first connected so its data
	// can upgrade existing lower-priority rows.
	FetchAllActivities(integration *models.ConnectedIntegration) ([]RawActivity, error)

	// RefreshTokenIfNeeded checks expiry and refreshes the stored token when needed.
	// Implementations should update the ConnectedIntegration row in the DB.
	RefreshTokenIfNeeded(integration *models.ConnectedIntegration) error
}
