import { ACTIVITY_CONFIGS, DISTANCE_BASED_TYPES } from '../../constants/activityTypes';

const METERS_PER_MILE = 1609.34;

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatPace = (seconds, meters) => {
  if (!meters || meters <= 0) return '--:--';
  const miles = meters / METERS_PER_MILE;
  const paceSeconds = seconds / miles;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.floor(paceSeconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const RecentRunsTable = ({ activities = [] }) => {
  const recent = activities.slice(0, 7);

  if (recent.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-text-muted">
        No recent activities
      </div>
    );
  }

  return (
    <div className="card overflow-hidden p-0">
      <table className="w-full text-sm">
        <thead>
          <tr>
            <th className="table-header">Date</th>
            <th className="table-header">Activity</th>
            <th className="table-header text-right">Distance</th>
            <th className="table-header text-right">Pace / Duration</th>
            <th className="table-header text-right">HR</th>
          </tr>
        </thead>
        <tbody>
          {recent.map((a, i) => {
            const cfg = ACTIVITY_CONFIGS[a.activity_type] || ACTIVITY_CONFIGS.workout;
            const isDistanceBased = DISTANCE_BASED_TYPES.has(a.activity_type);
            const miles = isDistanceBased
              ? ((a.distance_meters || 0) / METERS_PER_MILE).toFixed(1)
              : null;
            const hr = a.average_heart_rate;

            return (
              <tr key={i} className="table-row">
                <td className="table-cell text-text-secondary">
                  {formatDate(a.start_time)}
                </td>
                <td className="table-cell">
                  <span className="inline-flex items-center gap-1.5">
                    <span
                      className="inline-flex items-center justify-center w-5 h-5 rounded text-xs"
                      style={{ background: cfg.color + '22', color: cfg.color }}
                    >
                      {cfg.icon}
                    </span>
                    <span className="text-text-secondary text-xs font-medium">
                      {cfg.label}
                    </span>
                  </span>
                </td>
                <td className="table-cell text-right font-mono">
                  {isDistanceBased ? `${miles} mi` : '\u2014'}
                </td>
                <td className="table-cell text-right font-mono">
                  {isDistanceBased
                    ? `${formatPace(a.duration_seconds, a.distance_meters)}/mi`
                    : formatDuration(a.duration_seconds || 0)}
                </td>
                <td className="table-cell text-right font-mono">
                  {hr ? hr : '\u2014'}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default RecentRunsTable;
