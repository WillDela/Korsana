package services

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/korsana/backend/internal/database"
	"github.com/korsana/backend/internal/metrics"
	"github.com/korsana/backend/internal/models"
)

// MetricsService computes dashboard analytics.
type MetricsService struct {
	db *database.DB
}

// NewMetricsService creates a new MetricsService.
func NewMetricsService(db *database.DB) *MetricsService {
	return &MetricsService{db: db}
}

// CrossTrainingSession represents a cross-training session.
type CrossTrainingSession struct {
	ID               uuid.UUID `json:"id" db:"id"`
	UserID           uuid.UUID `json:"user_id" db:"user_id"`
	Type             string    `json:"type" db:"type"`
	Date             time.Time `json:"date" db:"date"`
	DurationMinutes  int       `json:"duration_minutes" db:"duration_minutes"`
	Intensity        *string   `json:"intensity" db:"intensity"`
	DistanceMeters   *float64  `json:"distance_meters" db:"distance_meters"`
	Notes            *string   `json:"notes" db:"notes"`
	Source           string    `json:"source" db:"source"`
	StravaActivityID *string   `json:"strava_activity_id" db:"strava_activity_id"`
	CreatedAt        time.Time `json:"created_at" db:"created_at"`
	UpdatedAt        time.Time `json:"updated_at" db:"updated_at"`
}

// GearShoe represents a tracked running shoe.
type GearShoe struct {
	ID            uuid.UUID  `json:"id" db:"id"`
	UserID        uuid.UUID  `json:"user_id" db:"user_id"`
	Name          string     `json:"name" db:"name"`
	Brand         *string    `json:"brand" db:"brand"`
	MaxMiles      int        `json:"max_miles" db:"max_miles"`
	DatePurchased *time.Time `json:"date_purchased" db:"date_purchased"`
	IsPrimary     bool       `json:"is_primary" db:"is_primary"`
	UsageLabel    *string    `json:"usage_label" db:"usage_label"`
	IsActive      bool       `json:"is_active" db:"is_active"`
	CreatedAt     time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at" db:"updated_at"`
	CurrentMiles  float64    `json:"current_miles" db:"-"`
}

// ManualPredictorEntry is a user-overridden race time.
type ManualPredictorEntry struct {
	ID            uuid.UUID `json:"id" db:"id"`
	UserID        uuid.UUID `json:"user_id" db:"user_id"`
	DistanceLabel string    `json:"distance_label" db:"distance_label"`
	TimeSeconds   int       `json:"time_seconds" db:"time_seconds"`
	DateRecorded  time.Time `json:"date_recorded" db:"date_recorded"`
	CreatedAt     time.Time `json:"created_at" db:"created_at"`
}

// DashboardData is the full dashboard API response.
type DashboardData struct {
	TrainingLoad  metrics.LoadResult       `json:"training_load"`
	InjuryRisk    metrics.InjuryRiskResult `json:"injury_risk"`
	Predictor     PredictorData            `json:"predictor"`
	LongRun       metrics.LongRunResult    `json:"long_run"`
	Recovery      metrics.RecoveryResult   `json:"recovery"`
	HRZones       metrics.HRZonesResult    `json:"hr_zones"`
	Execution     metrics.ExecutionResult  `json:"execution"`
	CrossTraining CrossTrainingDashboard   `json:"cross_training"`
	Shoes         []GearShoe               `json:"shoes"`
}

// PredictorData holds predictor widget data.
type PredictorData struct {
	SourceDistance string                  `json:"source_distance"`
	SourceSeconds  float64                 `json:"source_time_seconds"`
	Predictions    []metrics.PredictionRow `json:"predictions"`
	GoalSeconds    *int                    `json:"goal_seconds"`
	ManualOverride *ManualPredictorEntry   `json:"manual_override"`
}

// CrossTrainingDashboard holds cross-training widget data.
type CrossTrainingDashboard struct {
	Sessions      []CrossTrainingSession `json:"sessions"`
	MonthlyCounts map[string]int         `json:"monthly_counts"`
}

// ComputeDashboard fetches data and computes all dashboard metrics.
func (s *MetricsService) ComputeDashboard(ctx context.Context, userID uuid.UUID) (*DashboardData, error) {
	cutoff := time.Now().AddDate(0, 0, -90)
	var activities []models.Activity
	err := s.db.SelectContext(ctx, &activities, `
		SELECT id, user_id, source, source_activity_id, activity_type,
			   name, distance_meters, duration_seconds, start_time,
			   average_pace_seconds_per_km, average_heart_rate,
			   max_heart_rate, elevation_gain_meters, average_cadence,
			   suffer_score, synced_at
		FROM activities
		WHERE user_id = $1 AND start_time >= $2
		ORDER BY start_time ASC
	`, userID, cutoff)
	if err != nil {
		return nil, fmt.Errorf("fetch activities: %w", err)
	}

	calCutoff := time.Now().AddDate(0, 0, -30)
	var entries []models.CalendarEntry
	err = s.db.SelectContext(ctx, &entries, `
		SELECT id, user_id, date, workout_type, title, description,
			   planned_distance_meters, planned_duration_minutes, planned_pace_per_km,
			   status, completed_activity_id, source, created_at, updated_at
		FROM training_calendar
		WHERE user_id = $1 AND date >= $2
		ORDER BY date ASC
	`, userID, calCutoff)
	if err != nil {
		return nil, fmt.Errorf("fetch calendar: %w", err)
	}

	var profile models.UserProfile
	_ = s.db.GetContext(ctx, &profile, `SELECT * FROM user_profiles WHERE user_id = $1`, userID)
	restingHR := 55.0
	maxHR := 190.0
	if profile.RestingHeartRate != nil {
		restingHR = float64(*profile.RestingHeartRate)
	}
	if profile.MaxHeartRate != nil {
		maxHR = float64(*profile.MaxHeartRate)
	}

	var goal models.RaceGoal
	_ = s.db.GetContext(ctx, &goal, `SELECT * FROM race_goals WHERE user_id = $1 AND is_active = true LIMIT 1`, userID)
	raceDistKm := 42.195
	if goal.RaceDistanceMeters > 0 {
		raceDistKm = float64(goal.RaceDistanceMeters) / 1000.0
	}

	var manualEntry ManualPredictorEntry
	hasManual := false
	if err2 := s.db.GetContext(ctx, &manualEntry, `SELECT * FROM manual_predictor_entries WHERE user_id = $1`, userID); err2 == nil {
		hasManual = true
	}

	ctCutoff := time.Now().AddDate(0, 0, -28)
	var ctSessions []CrossTrainingSession
	_ = s.db.SelectContext(ctx, &ctSessions, `
		SELECT id, user_id, type, date, duration_minutes, intensity, distance_meters, notes, source, strava_activity_id, created_at, updated_at
		FROM cross_training_sessions
		WHERE user_id = $1 AND date >= $2
		ORDER BY date DESC
	`, userID, ctCutoff)

	var shoes []GearShoe
	_ = s.db.SelectContext(ctx, &shoes, `
		SELECT id, user_id, name, brand, max_miles, date_purchased, is_primary, usage_label, is_active, created_at, updated_at
		FROM gear_shoes
		WHERE user_id = $1 AND is_active = true
		ORDER BY is_primary DESC, created_at ASC
	`, userID)

	totalRunMiles := 0.0
	for _, a := range activities {
		if a.ActivityType == models.ActivityTypeRun {
			totalRunMiles += a.DistanceMeters * 0.000621371
		}
	}
	for i := range shoes {
		if len(shoes) > 0 {
			shoes[i].CurrentMiles = metricsRound2(totalRunMiles / float64(len(shoes)))
		}
	}

	loadResult := metrics.CalculateATLCTL(activities, restingHR, maxHR)
	riskResult := metrics.InjuryRisk(activities, loadResult.ATL, loadResult.CTL)
	longRunResult := metrics.LongRunConfidence(activities, raceDistKm)
	recoveryResult := metrics.RecoveryStatus(activities, restingHR, maxHR)
	hrZonesResult := metrics.HRZoneDistribution(activities)
	executionResult := metrics.ExecutionScores(activities, entries)

	best := metrics.AutoDetectBestEfforts(activities)

	// Layer completed race results on top of auto-detected efforts.
	// Results within 180 days replace auto-detection for that distance.
	// Manual overrides (below) still trump everything.
	raceCutoff := time.Now().AddDate(0, 0, -180)
	type completedGoalRow struct {
		RaceDistanceMeters int       `db:"race_distance_meters"`
		ResultTimeSeconds  int       `db:"result_time_seconds"`
		RaceDate           time.Time `db:"race_date"`
	}
	var completedGoals []completedGoalRow
	_ = s.db.SelectContext(ctx, &completedGoals, `
		SELECT race_distance_meters, result_time_seconds, race_date
		FROM race_goals
		WHERE user_id = $1
		  AND is_completed = true
		  AND result_time_seconds IS NOT NULL
		  AND race_date >= $2
		ORDER BY race_date DESC
	`, userID, raceCutoff)

	distanceBands := []struct {
		targetKm float64
		field    **float64
	}{
		{5.0, &best.Dist5K},
		{10.0, &best.Dist10K},
		{21.0975, &best.DistHalf},
		{42.195, &best.DistFull},
	}
	for _, cg := range completedGoals {
		distKm := float64(cg.RaceDistanceMeters) / 1000.0
		t := float64(cg.ResultTimeSeconds)
		for _, band := range distanceBands {
			ratio := distKm / band.targetKm
			if ratio < 0.97 || ratio > 1.03 {
				continue
			}
			// Most recent result per distance wins (query is ordered DESC).
			if *band.field == nil {
				*band.field = &t
			}
			break
		}
	}

	if hasManual {
		t := float64(manualEntry.TimeSeconds)
		switch manualEntry.DistanceLabel {
		case "5K":
			best.Dist5K = &t
		case "10K":
			best.Dist10K = &t
		case "half_marathon":
			best.DistHalf = &t
		case "marathon":
			best.DistFull = &t
		}
	}
	predictions := metrics.PredictAll(best)

	sourceDistLabel := "auto"
	sourceSeconds := 0.0
	if hasManual {
		sourceDistLabel = manualEntry.DistanceLabel
		sourceSeconds = float64(manualEntry.TimeSeconds)
	} else if best.Dist10K != nil {
		sourceDistLabel = "10K"
		sourceSeconds = *best.Dist10K
	} else if best.Dist5K != nil {
		sourceDistLabel = "5K"
		sourceSeconds = *best.Dist5K
	} else if best.DistHalf != nil {
		sourceDistLabel = "Half Marathon"
		sourceSeconds = *best.DistHalf
	}

	var manualPtr *ManualPredictorEntry
	if hasManual {
		manualPtr = &manualEntry
	}

	var goalSecs *int
	if goal.TargetTimeSeconds != nil {
		goalSecs = goal.TargetTimeSeconds
	}

	counts := map[string]int{"weightlifting": 0, "cycling": 0, "swimming": 0, "elliptical": 0}
	for _, sess := range ctSessions {
		if _, ok := counts[sess.Type]; ok {
			counts[sess.Type]++
		}
	}

	return &DashboardData{
		TrainingLoad: loadResult,
		InjuryRisk:   riskResult,
		LongRun:      longRunResult,
		Recovery:     recoveryResult,
		HRZones:      hrZonesResult,
		Execution:    executionResult,
		Predictor: PredictorData{
			SourceDistance: sourceDistLabel,
			SourceSeconds:  sourceSeconds,
			Predictions:    predictions,
			GoalSeconds:    goalSecs,
			ManualOverride: manualPtr,
		},
		CrossTraining: CrossTrainingDashboard{
			Sessions:      ctSessions,
			MonthlyCounts: counts,
		},
		Shoes: shoes,
	}, nil
}

func metricsRound2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}
