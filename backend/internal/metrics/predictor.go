package metrics

import (
	"math"

	"github.com/korsana/backend/internal/models"
)

const (
	riegelExp = 1.06
)

// BestEfforts holds the best known time for standard distances.
type BestEfforts struct {
	Dist5K   *float64
	Dist10K  *float64
	DistHalf *float64
	DistFull *float64
}

// PredictionRow is a single distance prediction.
type PredictionRow struct {
	Label   string  `json:"label"`
	Seconds float64 `json:"seconds"`
	Low     float64 `json:"low"`
	High    float64 `json:"high"`
}

// RiegelPredict uses Riegel's formula to predict finish time.
func RiegelPredict(knownTimeSec, knownDistKm, targetDistKm float64) float64 {
	if knownTimeSec <= 0 || knownDistKm <= 0 || targetDistKm <= 0 {
		return 0
	}
	return knownTimeSec * math.Pow(targetDistKm/knownDistKm, riegelExp)
}

// PredictionBand returns +/-3% confidence band.
func PredictionBand(predicted float64) (low, high float64) {
	return predicted * 0.97, predicted * 1.03
}

// AutoDetectBestEfforts scans activities for best times near standard distances.
func AutoDetectBestEfforts(activities []models.Activity) BestEfforts {
	targets := []struct {
		distKm float64
		field  **float64
	}{
		{5.0, nil},
		{10.0, nil},
		{21.0975, nil},
		{42.195, nil},
	}

	var best5, best10, bestHalf, bestFull *float64
	targets[0].field = &best5
	targets[1].field = &best10
	targets[2].field = &bestHalf
	targets[3].field = &bestFull

	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if a.DistanceMeters <= 0 || a.DurationSeconds <= 0 {
			continue
		}
		distKm := a.DistanceMeters / 1000.0
		timeSec := float64(a.DurationSeconds)

		for i, t := range targets {
			ratio := distKm / t.distKm
			if ratio < 0.85 || ratio > 1.15 {
				continue
			}
			paceSecPerKm := timeSec / distKm
			estimated := paceSecPerKm * t.distKm
			if *targets[i].field == nil || estimated < **targets[i].field {
				v := estimated
				*targets[i].field = &v
			}
		}
	}

	return BestEfforts{
		Dist5K:   best5,
		Dist10K:  best10,
		DistHalf: bestHalf,
		DistFull: bestFull,
	}
}

// PredictAll generates predictions for all 4 standard distances from the best known effort.
func PredictAll(best BestEfforts) []PredictionRow {
	distances := []struct {
		label  string
		distKm float64
	}{
		{"5K", 5.0},
		{"10K", 10.0},
		{"Half Marathon", 21.0975},
		{"Marathon", 42.195},
	}

	type source struct {
		timeSec float64
		distKm  float64
	}
	var sources []source
	if best.Dist5K != nil {
		sources = append(sources, source{*best.Dist5K, 5.0})
	}
	if best.Dist10K != nil {
		sources = append(sources, source{*best.Dist10K, 10.0})
	}
	if best.DistHalf != nil {
		sources = append(sources, source{*best.DistHalf, 21.0975})
	}
	if best.DistFull != nil {
		sources = append(sources, source{*best.DistFull, 42.195})
	}

	rows := make([]PredictionRow, 0, 4)
	for _, d := range distances {
		var predicted float64
		for _, s := range sources {
			if s.distKm == d.distKm {
				predicted = s.timeSec
				break
			}
		}
		if predicted == 0 && len(sources) > 0 {
			s := sources[0]
			predicted = RiegelPredict(s.timeSec, s.distKm, d.distKm)
		}
		low, high := PredictionBand(predicted)
		rows = append(rows, PredictionRow{
			Label:   d.label,
			Seconds: round2(predicted),
			Low:     round2(low),
			High:    round2(high),
		})
	}
	return rows
}
