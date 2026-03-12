package metrics

import (
	"time"

	"github.com/korsana/backend/internal/models"
)

// ExecutionRun holds per-run execution data.
type ExecutionRun struct {
	Date  string  `json:"date"`
	Type  string  `json:"type"`
	Score float64 `json:"score"`
	Issue string  `json:"issue"`
}

// ExecutionResult holds execution score data.
type ExecutionResult struct {
	WeeklyAvg float64        `json:"weekly_avg"`
	Runs      []ExecutionRun `json:"runs"`
}

// ExecutionScores computes planned vs actual execution scores for the last 30 days.
func ExecutionScores(activities []models.Activity, entries []models.CalendarEntry) ExecutionResult {
	cutoff := time.Now().AddDate(0, 0, -30)

	activityByID := make(map[string]*models.Activity)
	for i := range activities {
		activityByID[activities[i].ID.String()] = &activities[i]
	}

	var runs []ExecutionRun
	var totalScore float64

	for _, entry := range entries {
		if entry.Status != "completed" || entry.CompletedActivityID == nil {
			continue
		}
		if entry.Date.Before(cutoff) {
			continue
		}
		act, ok := activityByID[entry.CompletedActivityID.String()]
		if !ok {
			continue
		}

		score := 0.0
		issue := ""

		if entry.PlannedDistanceMeters != nil && *entry.PlannedDistanceMeters > 0 {
			ratio := act.DistanceMeters / float64(*entry.PlannedDistanceMeters)
			distScore := 40.0 * maxFloat(0, 1-absFloat(ratio-1)*2)
			score += distScore
			if distScore < 20 {
				issue = "Distance off-target"
			}
		} else {
			score += 20
		}

		if act.AverageHeartRate != nil {
			hrScore := estimateZoneScore(entry.WorkoutType, *act.AverageHeartRate)
			score += hrScore
			if hrScore < 30 && issue == "" {
				issue = "Effort off target"
			}
		} else {
			score += 30
		}

		if score > 100 {
			score = 100
		}

		runs = append(runs, ExecutionRun{
			Date:  entry.Date.Format("2006-01-02"),
			Type:  entry.WorkoutType,
			Score: round2(score),
			Issue: issue,
		})
		totalScore += score
	}

	if len(runs) > 5 {
		runs = runs[len(runs)-5:]
	}

	weeklyAvg := 0.0
	if len(runs) > 0 {
		weeklyAvg = round2(totalScore / float64(len(runs)))
	}

	return ExecutionResult{
		WeeklyAvg: weeklyAvg,
		Runs:      runs,
	}
}

func estimateZoneScore(workoutType string, avgHR int) float64 {
	expectedHR := 0
	switch workoutType {
	case "Easy", "Recovery":
		expectedHR = 135
	case "Long Run", "Long":
		expectedHR = 140
	case "Tempo":
		expectedHR = 155
	case "Intervals":
		expectedHR = 168
	default:
		expectedHR = 140
	}

	diff := absFloat(float64(avgHR - expectedHR))
	if diff <= 5 {
		return 60
	} else if diff <= 10 {
		return 45
	} else if diff <= 20 {
		return 30
	}
	return 15
}
