import { useState } from 'react';
import { ACTIVITY_CONFIGS, DISTANCE_BASED_TYPES } from '../../constants/activityTypes';
import { activitiesAPI } from '../../api/activities';
import { useUnits } from '../../context/UnitsContext';
import { formatDistance, formatPace } from '../../utils/units';

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const mm = String(m).padStart(2, '0');
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });

const TrashIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const RecentRunsTable = ({ activities = [], onActivityDeleted }) => {
  const { unit } = useUnits();
  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this activity?")) return;
    try {
      setDeletingId(id);
      await activitiesAPI.deleteActivity(id);
      if (onActivityDeleted) onActivityDeleted();
    } catch (err) {
      console.error('Failed to delete activity:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const recent = activities
    .filter((a) => a.activity_type === 'run')
    .slice(0, 7);

  if (recent.length === 0) {
    return (
      <div className="card p-6 text-center text-sm text-text-muted">
        No recent runs
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
            <th className="table-header text-right w-10"></th>
          </tr>
        </thead>
        <tbody>
          {recent.map((a, i) => {
            const cfg = ACTIVITY_CONFIGS[a.activity_type] || ACTIVITY_CONFIGS.workout;
            const isDistanceBased = DISTANCE_BASED_TYPES.has(a.activity_type);
            const hr = a.average_heart_rate;
            const distStr = isDistanceBased
              ? formatDistance(a.distance_meters, unit)
              : null;
            const paceSecPerKm = isDistanceBased && a.distance_meters > 0
              ? (a.duration_seconds / (a.distance_meters / 1000))
              : 0;

            return (
              <tr key={i} className={`table-row ${deletingId === a.id ? 'opacity-50' : ''}`}>
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
                  {isDistanceBased ? distStr : '\u2014'}
                </td>
                <td className="table-cell text-right font-mono">
                  {isDistanceBased
                    ? formatPace(paceSecPerKm, unit)
                    : formatDuration(a.duration_seconds || 0)}
                </td>
                <td className="table-cell text-right font-mono">
                  {hr ? hr : '\u2014'}
                </td>
                <td className="table-cell text-right w-10">
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="p-1.5 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-colors disabled:opacity-50 cursor-pointer border-none bg-transparent"
                    title="Delete Activity"
                  >
                    <TrashIcon />
                  </button>
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
