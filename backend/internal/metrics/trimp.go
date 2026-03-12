package metrics

import "math"

// CalculateTRIMP computes Training Impulse for a single activity.
func CalculateTRIMP(avgHR, durationMin, restingHR, maxHR float64) float64 {
	if maxHR <= restingHR {
		return 0
	}
	hrr := (avgHR - restingHR) / (maxHR - restingHR)
	if hrr <= 0 {
		return 0
	}
	return durationMin * hrr * 0.64 * math.Exp(1.92*hrr)
}
