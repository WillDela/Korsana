import { useState, useMemo } from 'react';
import { ACTIVITY_CONFIGS, DISTANCE_BASED_TYPES } from '../../constants/activityTypes';
import { activitiesAPI } from '../../api/activities';

const METERS_PER_MILE = 1609.34;

const formatDuration = (seconds) => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const hDisplay = h > 0 ? `${h}h ` : '';
  const mDisplay = m > 0 ? `${m}m` : '';
  return hDisplay + mDisplay || '< 1m';
};

const formatDate = (dateStr) =>
  new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

const TrashIcon = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"></polyline>
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
  </svg>
);

const CrossTrainingCard = ({ activities = [], onActivityDeleted }) => {
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

  const crossTrainingActs = useMemo(() => {
    if (!activities || activities.length === 0) return [];

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    return activities
      .filter((a) => a.activity_type !== 'run' && new Date(a.start_time) >= startOfWeek)
      .sort((a, b) => new Date(b.start_time) - new Date(a.start_time));
  }, [activities]);

  const weeklyCount = crossTrainingActs.length;

  if (activities.length === 0) {
    return null;
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3
          className="text-xs font-semibold uppercase tracking-wider text-text-muted"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Cross Training
        </h3>
        {weeklyCount > 0 && (
          <span className="px-2 py-0.5 rounded-full bg-navy/10 text-navy text-[10px] font-bold">
            {weeklyCount} this week
          </span>
        )}
      </div>

      {crossTrainingActs.length === 0 ? (
        <p className="text-sm text-text-muted pb-2">
          No cross-training logged this week.
        </p>
      ) : (
        <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
          {crossTrainingActs.map((a, i) => {
            const cfg = ACTIVITY_CONFIGS[a.activity_type] || ACTIVITY_CONFIGS.workout;
            const isDistanceBased = DISTANCE_BASED_TYPES.has(a.activity_type);
            const miles = isDistanceBased
              ? ((a.distance_meters || 0) / METERS_PER_MILE).toFixed(1)
              : null;

            return (
              <div key={i} className={`flex items-center gap-3 group pb-1 ${deletingId === a.id ? 'opacity-50' : ''}`}>
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: cfg.color + '15', color: cfg.color }}
                >
                  <span className="text-lg">{cfg.icon}</span>
                </div>

                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-medium text-text-primary truncate">
                        {a.activity_type !== 'workout' ? cfg.label : (a.name || cfg.label)}
                      </p>
                      <span className="text-xs font-mono text-text-secondary shrink-0">
                        {isDistanceBased && miles > 0 ? `${miles} mi` : formatDuration(a.duration_seconds || 0)}
                      </span>
                    </div>
                    <p className="text-[11px] text-text-muted truncate">
                      {formatDate(a.start_time)}
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="p-1.5 opacity-0 group-hover:opacity-100 text-text-muted hover:text-error hover:bg-error/10 rounded-md transition-all disabled:opacity-50 cursor-pointer border-none bg-transparent shrink-0 ml-2"
                    title="Delete Activity"
                  >
                    <TrashIcon />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CrossTrainingCard;
