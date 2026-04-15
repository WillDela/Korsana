// Workout status → display configuration for StatusBadge, WorkoutCard, and calendar cells.
export const WORKOUT_STATUS = {
  planned:   { label: 'Planned',  variant: 'neutral',  icon: null },
  completed: { label: 'Done',     variant: 'success',  icon: '✓' },
  missed:    { label: 'Missed',   variant: 'danger',   icon: '✕' },
  synced:    { label: 'Strava',   variant: 'info',     icon: 'S' },
  adapted:   { label: 'Adapted',  variant: 'warning',  icon: '✦' },
};

/**
 * Returns StatusBadge props for a given status string.
 * Falls back to 'planned' config for unknown statuses.
 */
export function statusToBadge(status) {
  const cfg = WORKOUT_STATUS[status] || WORKOUT_STATUS.planned;
  return { label: cfg.label, variant: cfg.variant };
}
