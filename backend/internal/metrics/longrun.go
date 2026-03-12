package metrics

import (
	"time"

	"github.com/korsana/backend/internal/models"
)

// LongRunResult holds long run coverage data.
type LongRunResult struct {
	LongRunCount int     `json:"long_run_count"`
	MaxDistKm    float64 `json:"max_dist_km"`
	CoveragePct  float64 `json:"coverage_pct"`
	Confidence   string  `json:"confidence"`
	RaceDistKm   float64 `json:"race_dist_km"`
}

// LongRunConfidence evaluates long run readiness vs. race distance.
func LongRunConfidence(activities []models.Activity, raceDistKm float64) LongRunResult {
	if raceDistKm <= 0 {
		raceDistKm = 42.195
	}

	cutoff := time.Now().AddDate(0, 0, -84)
	const longRunThresholdKm = 22.5

	var maxDistKm float64
	longRunCount := 0

	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if a.StartTime.Before(cutoff) {
			continue
		}
		distKm := a.DistanceMeters / 1000.0
		if distKm >= longRunThresholdKm {
			longRunCount++
		}
		if distKm > maxDistKm {
			maxDistKm = distKm
		}
	}

	coveragePct := 0.0
	if raceDistKm > 0 && maxDistKm > 0 {
		coveragePct = (maxDistKm / raceDistKm) * 100
		if coveragePct > 100 {
			coveragePct = 100
		}
	}

	confidence := "Needs work"
	switch {
	case coveragePct >= 90 && longRunCount >= 3:
		confidence = "Strong"
	case coveragePct >= 60 || longRunCount >= 2:
		confidence = "Building"
	}

	return LongRunResult{
		LongRunCount: longRunCount,
		MaxDistKm:    round2(maxDistKm),
		CoveragePct:  round2(coveragePct),
		Confidence:   confidence,
		RaceDistKm:   round2(raceDistKm),
	}
}
