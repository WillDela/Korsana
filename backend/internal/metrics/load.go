package metrics

import (
	"time"

	"github.com/korsana/backend/internal/models"
)

// LoadResult holds ATL/CTL/TSB and related fields.
type LoadResult struct {
	ATL       float64     `json:"atl"`
	CTL       float64     `json:"ctl"`
	TSB       float64     `json:"tsb"`
	FormLabel string      `json:"form_label"`
	LoadRatio float64     `json:"load_ratio"`
	RiskLevel string      `json:"risk_level"`
	History   []LoadPoint `json:"history"`
}

// LoadPoint is a single day entry in the ATL/CTL history.
type LoadPoint struct {
	Date string  `json:"date"`
	ATL  float64 `json:"atl"`
	CTL  float64 `json:"ctl"`
}

// InjuryRiskResult holds the composite risk score and breakdown.
type InjuryRiskResult struct {
	Score            int     `json:"score"`
	RiskLevel        string  `json:"risk_level"`
	PrimarySignal    string  `json:"primary_signal"`
	MileageJumpScore float64 `json:"mileage_jump_score"`
	LoadRatioScore   float64 `json:"load_ratio_score"`
	ConsecutiveScore float64 `json:"consecutive_score"`
}

// CalculateATLCTL computes acute/chronic training load using TRIMP.
func CalculateATLCTL(activities []models.Activity, restingHR, maxHR float64) LoadResult {
	if maxHR == 0 {
		maxHR = 190
	}
	if restingHR == 0 {
		restingHR = 55
	}

	today := time.Now().Truncate(24 * time.Hour)
	cutoff := today.AddDate(0, 0, -84)

	dailyTSS := make(map[string]float64)
	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if a.StartTime.Before(cutoff) {
			continue
		}
		hr := float64(0)
		if a.AverageHeartRate != nil {
			hr = float64(*a.AverageHeartRate)
		}
		if hr == 0 {
			durationMin := float64(a.DurationSeconds) / 60.0
			dailyTSS[a.StartTime.Format("2006-01-02")] += durationMin * 0.5
			continue
		}
		durationMin := float64(a.DurationSeconds) / 60.0
		tss := CalculateTRIMP(hr, durationMin, restingHR, maxHR)
		dailyTSS[a.StartTime.Format("2006-01-02")] += tss
	}

	var seedTotal float64
	seedCount := 0
	for i := 84; i >= 77; i-- {
		d := today.AddDate(0, 0, -i)
		key := d.Format("2006-01-02")
		if v, ok := dailyTSS[key]; ok {
			seedTotal += v
			seedCount++
		}
	}
	var atl, ctl float64
	if seedCount > 0 {
		avg := seedTotal / float64(seedCount)
		atl = avg
		ctl = avg
	}

	history := make([]LoadPoint, 0, 42)
	for i := 42; i >= 0; i-- {
		d := today.AddDate(0, 0, -i)
		key := d.Format("2006-01-02")
		tss := dailyTSS[key]
		atl += (tss - atl) / 7.0
		ctl += (tss - ctl) / 42.0
		history = append(history, LoadPoint{
			Date: key,
			ATL:  round2(atl),
			CTL:  round2(ctl),
		})
	}

	tsb := ctl - atl
	loadRatio := 0.0
	if ctl > 0 {
		loadRatio = round2(atl / ctl)
	}

	return LoadResult{
		ATL:       round2(atl),
		CTL:       round2(ctl),
		TSB:       round2(tsb),
		FormLabel: formLabel(tsb),
		LoadRatio: loadRatio,
		RiskLevel: riskLevel(loadRatio),
		History:   history,
	}
}

func formLabel(tsb float64) string {
	switch {
	case tsb > 10:
		return "Fresh"
	case tsb >= -10:
		return "Optimal"
	case tsb >= -30:
		return "Tired"
	default:
		return "Overreached"
	}
}

func riskLevel(ratio float64) string {
	switch {
	case ratio > 1.5:
		return "High"
	case ratio > 1.3:
		return "Moderate"
	default:
		return "Low"
	}
}

// InjuryRisk computes a composite injury risk score (0-100).
func InjuryRisk(activities []models.Activity, atl, ctl float64) InjuryRiskResult {
	today := time.Now()
	cutoff4w := today.AddDate(0, 0, -28)

	last7Start := today.AddDate(0, 0, -7)
	prev7Start := today.AddDate(0, 0, -14)
	var last7m, prev7m float64
	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		t := a.StartTime
		miles := a.DistanceMeters * 0.000621371
		if t.After(last7Start) {
			last7m += miles
		} else if t.After(prev7Start) {
			prev7m += miles
		}
	}
	jumpPct := 0.0
	if prev7m > 0 {
		jumpPct = ((last7m - prev7m) / prev7m) * 100
	}
	jumpScore := 0.0
	switch {
	case jumpPct > 30:
		jumpScore = 100
	case jumpPct > 20:
		jumpScore = 70
	case jumpPct > 10:
		jumpScore = 40
	default:
		jumpScore = 10
	}

	loadRatioScore := 0.0
	if ctl > 0 {
		ratio := atl / ctl
		switch {
		case ratio > 1.5:
			loadRatioScore = 100
		case ratio > 1.3:
			loadRatioScore = 65
		case ratio > 1.1:
			loadRatioScore = 30
		default:
			loadRatioScore = 10
		}
	}

	hardDays := 0
	for _, a := range activities {
		if a.ActivityType != models.ActivityTypeRun {
			continue
		}
		if !a.StartTime.After(cutoff4w) {
			continue
		}
		if a.AverageHeartRate != nil && *a.AverageHeartRate > 162 {
			hardDays++
		}
	}
	consScore := 0.0
	switch {
	case hardDays >= 4:
		consScore = 100
	case hardDays >= 3:
		consScore = 70
	case hardDays >= 2:
		consScore = 40
	default:
		consScore = 10
	}

	composite := jumpScore*0.40 + loadRatioScore*0.40 + consScore*0.20
	score := int(composite)

	riskLvl := "Low"
	primarySignal := "Training load is within safe range."
	switch {
	case score >= 70:
		riskLvl = "High"
		primarySignal = "Multiple risk factors elevated — consider an easy week."
	case score >= 40:
		riskLvl = "Moderate"
		primarySignal = "Monitor mileage increases and consecutive hard days."
	}

	return InjuryRiskResult{
		Score:            score,
		RiskLevel:        riskLvl,
		PrimarySignal:    primarySignal,
		MileageJumpScore: round2(jumpScore),
		LoadRatioScore:   round2(loadRatioScore),
		ConsecutiveScore: round2(consScore),
	}
}

func round2(v float64) float64 {
	return float64(int(v*100+0.5)) / 100
}

func absFloat(x float64) float64 {
	if x < 0 {
		return -x
	}
	return x
}

func maxFloat(a, b float64) float64 {
	if a > b {
		return a
	}
	return b
}
