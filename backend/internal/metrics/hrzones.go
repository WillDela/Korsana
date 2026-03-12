package metrics

import (
	"time"

	"github.com/korsana/backend/internal/models"
)

// HRZone holds data for one HR zone.
type HRZone struct {
	Name    string  `json:"name"`
	BPM     string  `json:"bpm"`
	Minutes float64 `json:"minutes"`
	Pct     float64 `json:"pct"`
	InRange bool    `json:"in_range"`
}

// HRZonesResult holds the full HR zone distribution.
type HRZonesResult struct {
	Zones        []HRZone `json:"zones"`
	Z1Z2Combined float64  `json:"z1z2_combined"`
}

// HRZoneDistribution computes time in each HR zone for the last 7 days.
func HRZoneDistribution(activities []models.Activity) HRZonesResult {
	cutoff := time.Now().AddDate(0, 0, -7)

	zones := []HRZone{
		{Name: "Z1 Easy", BPM: "< 130"},
		{Name: "Z2 Aerobic", BPM: "130-148"},
		{Name: "Z3 Tempo", BPM: "148-162"},
		{Name: "Z4 Threshold", BPM: "162-174"},
		{Name: "Z5 Max", BPM: "174+"},
	}

	thresholds := []int{0, 130, 148, 162, 174, 999}

	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if a.StartTime.Before(cutoff) {
			continue
		}
		if a.AverageHeartRate == nil {
			continue
		}
		hr := *a.AverageHeartRate
		durationMin := float64(a.DurationSeconds) / 60.0

		for i := range zones {
			if hr >= thresholds[i] && hr < thresholds[i+1] {
				zones[i].Minutes += durationMin
				break
			}
		}
	}

	total := 0.0
	for _, z := range zones {
		total += z.Minutes
	}

	if total == 0 {
		total = 1
	}

	for i := range zones {
		zones[i].Pct = round2((zones[i].Minutes / total) * 100)
	}

	z1z2 := round2(zones[0].Pct + zones[1].Pct)
	zones[0].InRange = true
	zones[1].InRange = z1z2 >= 80

	return HRZonesResult{
		Zones:        zones,
		Z1Z2Combined: z1z2,
	}
}
