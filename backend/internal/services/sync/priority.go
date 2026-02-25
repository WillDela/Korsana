package sync

// sourcePriority defines the hierarchy. Lower number = higher priority.
// Strava always wins. Manual always loses.
var sourcePriority = map[string]int{
	"strava": 1,
	"coros":  2,
	"garmin": 3,
	"manual": 4,
}

// HigherPriority returns true if incoming should replace an activity
// currently owned by existing.
func HigherPriority(incoming, existing string) bool {
	inPri, inOk := sourcePriority[incoming]
	exPri, exOk := sourcePriority[existing]
	if !inOk || !exOk {
		return false
	}
	return inPri < exPri
}
