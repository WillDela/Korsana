import { useState, useEffect } from 'react';
import { calendarAPI } from '../api/calendar';

const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getMonday = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const ConsistencyTracker = ({ activities = [] }) => {
  const [calendarEntries, setCalendarEntries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCurrentWeek = async () => {
      try {
        const monday = getMonday();
        const data = await calendarAPI.getWeek(formatDateKey(monday));
        setCalendarEntries(data.entries || []);
      } catch (err) {
        console.error('Failed to fetch calendar for consistency:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCurrentWeek();
  }, []);

  // Count planned sessions this week
  const planned = calendarEntries.filter(e => e.workout_type !== 'rest').length;

  // Count completed activities this week
  const now = new Date();
  const monday = getMonday(now);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);
  const completedThisWeek = activities.filter(a => {
    const d = new Date(a.start_time);
    return d >= monday && d < sunday;
  }).length;

  const displayPlanned = Math.max(planned, completedThisWeek);
  const dots = Math.max(displayPlanned, 7);

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        This Week
      </h3>

      {loading ? (
        <div className="flex gap-2">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-border-light animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-3">
            {[...Array(dots)].map((_, i) => {
              const isCompleted = i < completedThisWeek;
              const isPlanned = i < displayPlanned;
              return (
                <div
                  key={i}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-sage text-white'
                      : isPlanned
                        ? 'border-2 border-border bg-white text-text-muted'
                        : 'bg-border-light text-text-muted/50'
                  }`}
                >
                  {isCompleted ? '✓' : i + 1}
                </div>
              );
            })}
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="font-mono font-bold text-text-primary">{completedThisWeek}/{displayPlanned}</span>
            <span className="text-text-secondary">
              {completedThisWeek >= displayPlanned && displayPlanned > 0
                ? 'All planned runs done!'
                : completedThisWeek > 0
                  ? `${displayPlanned - completedThisWeek} left this week`
                  : 'Get moving!'}
            </span>
          </div>
        </>
      )}
    </div>
  );
};

export default ConsistencyTracker;
