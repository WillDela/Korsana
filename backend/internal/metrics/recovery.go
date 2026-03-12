package metrics

import (
	"fmt"
	"time"

	"github.com/korsana/backend/internal/models"
)

// RecoveryResult holds recovery status data.
type RecoveryResult struct {
	RecoveryPct    float64 `json:"recovery_pct"`
	LastHardDate   string  `json:"last_hard_date"`
	LastHardHR     int     `json:"last_hard_hr"`
	HoursSince     float64 `json:"hours_since"`
	NextQualityDay string  `json:"next_quality_day"`
}

// RecoveryStatus computes recovery percentage from the last hard session.
func RecoveryStatus(activities []models.Activity, restingHR, maxHR float64) RecoveryResult {
	if maxHR == 0 {
		maxHR = 190
	}
	if restingHR == 0 {
		restingHR = 55
	}

	now := time.Now()
	const hardHRThreshold = 162

	var lastHard *models.Activity
	for i := range activities {
		a := &activities[i]
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if a.AverageHeartRate == nil || *a.AverageHeartRate < hardHRThreshold {
			continue
		}
		if lastHard == nil || a.StartTime.After(lastHard.StartTime) {
			lastHard = a
		}
	}

	if lastHard == nil {
		return RecoveryResult{
			RecoveryPct:    100,
			NextQualityDay: "Ready now",
		}
	}

	hr := float64(*lastHard.AverageHeartRate)
	durationMin := float64(lastHard.DurationSeconds) / 60.0
	tss := CalculateTRIMP(hr, durationMin, restingHR, maxHR)
	baseRecovery := tss * 0.8
	if baseRecovery < 12 {
		baseRecovery = 12
	}

	hoursSince := now.Sub(lastHard.StartTime).Hours()
	recoveryPct := (hoursSince / baseRecovery) * 100
	if recoveryPct > 100 {
		recoveryPct = 100
	}

	nextQuality := "Ready now"
	hoursRemaining := baseRecovery - hoursSince
	if hoursRemaining > 0 {
		nextDay := now.Add(time.Duration(hoursRemaining) * time.Hour)
		daysDiff := int(nextDay.Sub(time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())).Hours() / 24)
		switch daysDiff {
		case 0:
			nextQuality = "Later today"
		case 1:
			nextQuality = "Tomorrow"
		default:
			nextQuality = fmt.Sprintf("In %d days", daysDiff)
		}
	}

	lastHardHR := 0
	if lastHard.AverageHeartRate != nil {
		lastHardHR = *lastHard.AverageHeartRate
	}

	return RecoveryResult{
		RecoveryPct:    round2(recoveryPct),
		LastHardDate:   lastHard.StartTime.Format("2006-01-02"),
		LastHardHR:     lastHardHR,
		HoursSince:     round2(hoursSince),
		NextQualityDay: nextQuality,
	}
}
