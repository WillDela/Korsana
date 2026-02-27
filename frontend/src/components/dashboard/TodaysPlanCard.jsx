const METERS_PER_MILE = 1609.34;

const TYPE_COLORS = {
  easy: 'bg-sage text-white',
  recovery: 'bg-sage text-white',
  tempo: 'bg-amber text-white',
  interval: 'bg-coral text-white',
  long: 'bg-navy text-white',
  race: 'bg-coral text-white',
  cross_train: 'bg-amber text-white',
  rest: 'bg-bg-app text-text-muted',
};

const CheckIcon = () => (
  <svg
    className="w-4 h-4"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const TodaysPlanCard = ({ entry, onMarkComplete }) => {
  const noWorkout = !entry;

  return (
    <div className="card p-5">
      <h3
        className="text-xs font-semibold uppercase tracking-wider
          text-text-muted mb-4"
        style={{ fontFamily: 'var(--font-heading)' }}
      >
        Today's Plan
      </h3>

      {noWorkout ? (
        <p className="text-sm text-text-muted">
          Rest day — no workout planned
        </p>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-semibold
                ${TYPE_COLORS[entry.workout_type] || TYPE_COLORS.easy}`}
            >
              {(entry.workout_type || 'easy').replace('_', ' ')}
            </span>
            {entry.status === 'completed' && (
              <span className="flex items-center gap-1 text-xs
                font-medium text-sage">
                <CheckIcon /> Completed
              </span>
            )}
          </div>

          <p className="text-sm font-medium text-text-primary">
            {entry.title}
          </p>

          <div className="flex items-center gap-4 text-xs text-text-secondary">
            {entry.planned_distance_meters > 0 && (
              <span className="font-mono">
                {(entry.planned_distance_meters / METERS_PER_MILE).toFixed(1)} mi
              </span>
            )}
            {entry.planned_pace_per_km > 0 && (
              <span className="font-mono">
                {Math.floor(entry.planned_pace_per_km / 60)}:
                {String(Math.floor(entry.planned_pace_per_km % 60))
                  .padStart(2, '0')}/km
              </span>
            )}
          </div>

          {entry.status === 'planned' && onMarkComplete && (
            <button
              onClick={() => onMarkComplete(entry.id)}
              className="btn btn-sm btn-secondary mt-1"
            >
              Mark Complete
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TodaysPlanCard;
