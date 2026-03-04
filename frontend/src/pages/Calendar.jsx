import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calendarAPI } from '../api/calendar';
import { stravaAPI } from '../api/strava';
import SessionDetailsModal, { WORKOUT_TYPES } from '../components/SessionDetailsModal';
import ManualActivityModal from '../components/ManualActivityModal';
import WeekCalendar from '../components/WeekCalendar';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const formatDateKey = (date) => {
  if (typeof date === 'string' && date.length >= 10) {
    return date.slice(0, 10);
  }
  const d = new Date(date);
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${String(d.getDate()).padStart(2, '0')}`;
};

const todayKey = () => formatDateKey(new Date());

const getGridRange = (month) => {
  const year = month.getFullYear();
  const mo = month.getMonth();
  const first = new Date(year, mo, 1);
  let dayOfWeek = first.getDay();
  if (dayOfWeek === 0) dayOfWeek = 7;
  const gridStart = new Date(first);
  gridStart.setDate(first.getDate() - (dayOfWeek - 1));
  const last = new Date(year, mo + 1, 0);
  let lastDow = last.getDay();
  if (lastDow === 0) lastDow = 7;
  const gridEnd = new Date(last);
  gridEnd.setDate(last.getDate() + (7 - lastDow));
  return { gridStart, gridEnd };
};

const getGridDates = (gridStart, gridEnd) => {
  const dates = [];
  const d = new Date(gridStart);
  while (d <= gridEnd) {
    dates.push(new Date(d));
    d.setDate(d.getDate() + 1);
  }
  return dates;
};

const getBadgeColor = (type) => {
  const t = WORKOUT_TYPES.find((w) => w.value === type);
  return t?.color || '#6B7280';
};

const getBadgeLabel = (type) => {
  const t = WORKOUT_TYPES.find((w) => w.value === type);
  return t?.badge || type?.toUpperCase() || '';
};

const getBadgeClasses = (type) => {
  const t = WORKOUT_TYPES.find((w) => w.value === type);
  if (!t) return 'bg-gray-100 text-gray-600';
  return `${t.badgeBg} ${t.badgeText}`;
};

const SourceBadge = ({ source }) => {
  if (source === 'strava') {
    return (
      <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-orange-100 text-orange-600 leading-none">
        S
      </span>
    );
  }
  if (source === 'ai_coach') {
    return (
      <div className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-sage/10 text-sage">
        <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        </svg>
        <span className="text-[7.5px] font-bold leading-none tracking-wide">AI</span>
      </div>
    );
  }
  return null;
};

const ActivityIcon = ({ type }) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('run')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5C12.5523 5 13 4.55228 13 4C13 3.44772 12.5523 3 12 3C11.4477 3 11 3.44772 11 4C11 4.55228 11.4477 5 12 5Z" />
        <path d="M12 5L10 10L12 15L15 22" />
        <path d="M10 10L6 11" />
        <path d="M12 15L9 21" />
        <path d="M20 14L15 12L13 7" />
      </svg>
    );
  }
  if (t.includes('bike') || t.includes('cycl')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="5.5" cy="17.5" r="3.5" />
        <circle cx="18.5" cy="17.5" r="3.5" />
        <path d="M15 6a1 1 0 100-2 1 1 0 000 2zm-3 11.5V14l-3-3 4-3 2 3h2" />
      </svg>
    );
  }
  if (t.includes('swim')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2.5 15.5L4 14l2 1.5L8 14l2 1.5L12 14l2 1.5L16 14l2 1.5L20 14l1.5 1.5" />
        <path d="M2.5 19.5L4 18l2 1.5L8 18l2 1.5L12 18l2 1.5L16 18l2 1.5L20 18l1.5 1.5" />
        <circle cx="12" cy="7" r="2" />
        <path d="M18 10l-4-3-3 3-2.5-1.5" />
      </svg>
    );
  }
  if (t.includes('strength') || t.includes('lift')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 5v14M18 5v14M4 8h16M4 16h16M2 12h20" />
      </svg>
    );
  }
  if (t.includes('yoga') || t.includes('flex')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7l-4 6h8l-4-6" />
        <path d="M8 13l-4 6M16 13l4 6" />
      </svg>
    );
  }
  if (t.includes('walk')) {
    return (
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="5" r="2" />
        <path d="M12 7v7" />
        <path d="M12 14l-4 6" />
        <path d="M12 14l2 6" />
        <path d="M8 10h8" />
      </svg>
    );
  }
  // Default activity dot
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="6" />
    </svg>
  );
};

const MiniCard = ({ entry }) => {
  const isCompleted = entry.status === 'completed';
  const isMissed = entry.status === 'missed';

  // Distances in km
  const distKm = entry.planned_distance_meters
    ? (entry.planned_distance_meters / 1000).toFixed(1)
    : null;

  let paceStr = null;
  if (entry.planned_pace_per_km) {
    const m = Math.floor(entry.planned_pace_per_km / 60);
    const s = Math.round(entry.planned_pace_per_km % 60);
    paceStr = `${m}:${s.toString().padStart(2, '0')}/km`;
  }

  const bgs = {
    completed: 'bg-[#82A895]/10 border border-[#82A895]/20',
    missed: 'bg-gray-100/80 border border-gray-200',
    planned: 'bg-navy/[0.04] border border-navy/10'
  };

  const textColors = {
    completed: 'text-text-primary',
    missed: 'text-gray-400',
    planned: 'text-text-primary'
  };

  const iconColors = {
    completed: 'text-sage',
    missed: 'text-gray-400',
    planned: 'text-navy'
  };

  const statusKey = isCompleted ? 'completed' : isMissed ? 'missed' : 'planned';

  return (
    <div className={`flex flex-col rounded-md min-w-0 p-2 group/card ${bgs[statusKey]}`}>
      {/* Top row: Icon + Mute + Source */}
      <div className="flex items-start justify-between mb-1">
        <div className={`flex items-center gap-1.5 ${iconColors[statusKey]}`}>
          <ActivityIcon type={entry.workout_type} />
        </div>
        <SourceBadge source={entry.source} />
      </div>

      {/* Title */}
      <div className={`text-[11px] font-bold truncate leading-tight mb-0.5 ${textColors[statusKey]}`}>
        {entry.title}
      </div>

      {/* Stats Line */}
      <div className={`text-[9px] font-mono leading-tight truncate ${isMissed ? 'text-gray-400' : 'text-text-secondary'}`}>
        {distKm && paceStr ? (
          <span>{distKm}km @ {paceStr}</span>
        ) : distKm ? (
          <span>{distKm}km</span>
        ) : entry.planned_duration_minutes ? (
          <span>{entry.planned_duration_minutes} min {entry.workout_type === 'strength' && '• Strength'}</span>
        ) : (
          <span>{entry.workout_type.toUpperCase()}</span>
        )}
      </div>

      {/* Strava Footer */}
      {entry.source === 'strava' && isCompleted && (
        <div className="mt-1.5 flex items-center gap-1 text-[8px] font-semibold text-orange-600/70 uppercase tracking-widest">
          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Strava Matched
        </div>
      )}

      {/* Missed BADGE */}
      {isMissed && (
        <div className="mt-1.5 flex">
          <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">Missed</span>
        </div>
      )}
    </div>
  );
};

const DayDetailModal = ({
  isOpen,
  onClose,
  date,
  entries,
  onAddWorkout,
  onLogActivity,
  onEditEntry,
}) => {
  if (!isOpen || !date) return null;

  const dateObj = new Date(date + 'T12:00:00');
  const formatted = dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(17,25,64,0.5)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-navy text-white flex items-center justify-between">
              <div>
                <h3
                  className="text-lg font-bold"
                  style={{ fontFamily: 'var(--font-heading)' }}
                >
                  {formatted}
                </h3>
                <p className="text-white/60 text-xs mt-0.5">
                  {entries.length} {entries.length === 1 ? 'activity' : 'activities'}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/70 hover:text-white cursor-pointer bg-transparent border-none transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Entries list */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {entries.length === 0 && (
                <div className="text-center py-10">
                  <div className="w-12 h-12 rounded-full bg-bg-app flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <p className="text-sm text-text-muted">No activities yet</p>
                  <p className="text-xs text-text-muted/60 mt-1">Add a workout or log an activity</p>
                </div>
              )}
              {entries.map((entry) => {
                const color = getBadgeColor(entry.workout_type);
                const distMi = entry.planned_distance_meters
                  ? (entry.planned_distance_meters * 0.000621371).toFixed(1)
                  : null;
                const durMin = entry.planned_duration_minutes;
                let paceStr = null;
                if (entry.planned_pace_per_km) {
                  const p = entry.planned_pace_per_km * 1.60934;
                  const m = Math.floor(p / 60);
                  const s = Math.round(p % 60);
                  paceStr = `${m}:${s.toString().padStart(2, '0')}/mi`;
                }

                return (
                  <motion.div
                    key={entry.id}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => onEditEntry(entry)}
                    className="p-3.5 rounded-xl cursor-pointer transition-shadow hover:shadow-md"
                    style={{
                      backgroundColor: `${color}08`,
                      border: `1px solid ${color}25`,
                    }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${getBadgeClasses(entry.workout_type)}`}
                      >
                        {getBadgeLabel(entry.workout_type)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${entry.status === 'completed'
                          ? 'bg-green-100 text-green-700'
                          : entry.status === 'missed'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-blue-50 text-blue-600'
                          }`}
                      >
                        {entry.status}
                      </span>
                      {entry.source && entry.source !== 'manual' && (
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${entry.source === 'strava'
                            ? 'bg-orange-100 text-orange-600'
                            : 'bg-sage/20 text-sage'
                            }`}
                        >
                          {entry.source === 'ai_coach'
                            ? 'AI'
                            : entry.source.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-text-primary">
                      {entry.title}
                    </p>
                    {(distMi || paceStr || durMin) && (
                      <div className="flex items-center gap-3 mt-1.5">
                        {distMi && (
                          <span className="text-[11px] font-mono text-text-secondary bg-white/80 px-1.5 py-0.5 rounded">
                            {distMi} mi
                          </span>
                        )}
                        {paceStr && (
                          <span className="text-[11px] font-mono text-text-secondary bg-white/80 px-1.5 py-0.5 rounded">
                            {paceStr}
                          </span>
                        )}
                        {durMin && (
                          <span className="text-[11px] font-mono text-text-secondary bg-white/80 px-1.5 py-0.5 rounded">
                            {durMin} min
                          </span>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-border flex gap-2.5 bg-bg-app/50">
              <button
                onClick={onAddWorkout}
                className="flex-1 px-3 py-2.5 rounded-xl bg-navy text-white text-sm font-semibold cursor-pointer border-none hover:bg-navy-light transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Workout
              </button>
              <button
                onClick={onLogActivity}
                className="flex-1 px-3 py-2.5 rounded-xl border border-border bg-white text-text-secondary text-sm font-medium cursor-pointer hover:bg-bg-elevated transition-colors flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                Log Activity
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const Calendar = () => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(null);
  const [modalMode, setModalMode] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [syncing, setSyncing] = useState(false);

  const [view, setView] = useState('month');
  const [filterType, setFilterType] = useState('all');

  const { gridStart, gridEnd } = useMemo(
    () => getGridRange(currentMonth),
    [currentMonth]
  );

  const gridDates = useMemo(
    () => getGridDates(gridStart, gridEnd),
    [gridStart, gridEnd]
  );

  const entriesByDate = useMemo(() => {
    const map = {};
    for (const entry of entries) {
      if (filterType !== 'all' && entry.workout_type !== filterType) {
        continue;
      }
      const key = formatDateKey(entry.date);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
  }, [entries, filterType]);

  const monthStats = useMemo(() => {
    const completed = entries.filter((e) => e.status === 'completed').length;
    const planned = entries.filter((e) => e.status === 'planned').length;
    const totalDist = entries.reduce(
      (sum, e) => sum + (e.planned_distance_meters || 0), 0
    );
    return { completed, planned, totalMiles: (totalDist * 0.000621371).toFixed(1) };
  }, [entries]);

  const fetchMonthEntries = useCallback(async () => {
    try {
      setLoading(true);
      const startStr = formatDateKey(gridStart);
      const endStr = formatDateKey(gridEnd);
      const data = await calendarAPI.getRange(startStr, endStr);
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch calendar entries:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [gridStart, gridEnd]);

  useEffect(() => {
    fetchMonthEntries();
  }, [fetchMonthEntries]);

  const navigateMonth = (dir) => {
    setCurrentMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + dir, 1)
    );
  };

  const goToToday = () => {
    const now = new Date();
    setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      await stravaAPI.syncActivities();
      await fetchMonthEntries();
    } catch (err) {
      console.error('Strava sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleDayClick = (dateKey) => {
    setSelectedDate(dateKey);
  };

  const handleAddWorkout = () => {
    setEditingEntry(null);
    setModalMode('session');
  };

  const handleLogActivity = () => {
    setModalMode('log');
  };

  const handleEditEntry = (entry) => {
    setSelectedDate(formatDateKey(entry.date));
    setEditingEntry(entry);
    setModalMode('session');
  };

  const handleSaveEntry = async (data) => {
    if (editingEntry?.id) {
      await calendarAPI.updateEntry(editingEntry.id, data);
    } else {
      await calendarAPI.createEntry(data);
    }
    await fetchMonthEntries();
    setModalMode(null);
    setEditingEntry(null);
  };

  const handleDeleteEntry = async (id) => {
    await calendarAPI.deleteEntry(id);
    await fetchMonthEntries();
    setModalMode(null);
    setEditingEntry(null);
  };

  const handleQuickAdd = () => {
    setSelectedDate(todayKey());
    setEditingEntry(null);
    setModalMode('session');
  };

  const monthLabel = currentMonth.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const today = todayKey();
  const currentMonthNum = currentMonth.getMonth();

  const weeks = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* 1. Page-Level Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-5">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
            Training › Calendar
          </div>
          <h1 className="text-3xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
            Training Calendar
          </h1>
          <div className="text-xs font-semibold text-text-secondary mt-1 flex items-center gap-1.5">
            Full Month View <span className="text-border">—</span> <span className="text-sage tracking-widest uppercase text-[10px]">Athletic Precision</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Tabs */}
          <div className="flex items-center p-1 bg-white rounded-lg border border-border shadow-sm">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-xs font-bold capitalize rounded-md transition-colors ${view === v
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-navy hover:bg-bg-app'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={handleAddWorkout}
            className="px-4 py-2 bg-navy hover:bg-navy-light text-white text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
          >
            <span className="text-lg leading-none mb-[2px]">+</span> Log Workout
          </button>
        </div>
      </div>

      {/* 2. Controls Bar */}
      <div className="bg-white rounded-xl border border-border shadow-sm p-3 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Nav */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <h2 className="text-lg font-bold text-navy w-32" style={{ fontFamily: 'var(--font-heading)' }}>
              {monthLabel}
            </h2>
            <button
              onClick={() => navigateMonth(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-app text-text-secondary transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-bg-app text-text-secondary transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>

          <div className="h-4 w-[1px] bg-border hidden md:block" />

          <button
            onClick={goToToday}
            className="text-xs font-bold text-text-secondary hover:text-navy transition-colors"
          >
            Today
          </button>

          <button
            onClick={handleSync}
            disabled={syncing}
            className={`w-8 h-8 flex items-center justify-center rounded-lg border border-border transition-colors ${syncing ? 'bg-bg-app text-text-muted cursor-not-allowed' : 'bg-white hover:bg-bg-app text-orange-500 hover:text-orange-600 hover:border-orange-200'
              }`}
            title="Sync Strava"
          >
            <svg className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" />
              <polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
          </button>
        </div>

        {/* Right Side: Filters */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-wider text-text-muted">
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-[#82A895]" />
              Completed
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-navy" />
              Upcoming
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
              Missed
            </div>
          </div>

          <div className="h-4 w-[1px] bg-border hidden md:block" />

          <div className="relative">
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 bg-transparent text-sm font-bold text-navy outline-none cursor-pointer hover:bg-bg-app rounded-md transition-colors"
            >
              <option value="all">All Activities</option>
              {WORKOUT_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-navy">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Views */}
      {
        view === 'week' ? (
          <WeekCalendar
            currentMonth={currentMonth}
            entriesByDate={entriesByDate}
            onDayClick={handleDayClick}
          />
        ) : view === 'day' ? (
          <div className="rounded-2xl border border-border shadow-sm p-16 text-center bg-white">
            <div className="w-12 h-12 bg-bg-app rounded-full flex items-center justify-center mx-auto mb-3">
              <svg className="w-6 h-6 text-text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <h3 className="text-lg font-bold text-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Day View</h3>
            <p className="text-text-secondary text-sm">Detailed day view is coming soon.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden shadow-sm relative bg-white">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 bg-navy">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className={`text-center text-[10px] font-bold uppercase tracking-widest py-3 ${i >= 5 ? 'text-white/70' : 'text-white'
                    }`}
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Week rows */}
            {weeks.map((week, wi) => (
              <div
                key={wi}
                className="grid grid-cols-7"
                style={{ gap: '1px', backgroundColor: 'var(--color-border-light)' }}
              >
                {week.map((date, di) => {
                  const dateKey = formatDateKey(date);
                  const isToday = dateKey === today;
                  const isOutside = date.getMonth() !== currentMonthNum;
                  const isWeekend = di >= 5;
                  const dayEntries = entriesByDate[dateKey] || [];
                  const isRestDay = dayEntries.length === 1 && (dayEntries[0].workout_type === 'rest' || dayEntries[0].title?.toLowerCase() === 'rest');
                  const visibleEntries = isRestDay ? [] : dayEntries;
                  const moreCount = 0;
                  const hasEntries = dayEntries.length > 0;

                  return (
                    <motion.div
                      key={dateKey}
                      whileHover={{ backgroundColor: isToday ? '#EEF2FF' : '#F8FAFF' }}
                      onClick={() => handleDayClick(dateKey)}
                      className={`p-1.5 min-h-[100px] cursor-pointer flex flex-col transition-all relative ${isOutside
                        ? 'bg-bg-app/50'
                        : isToday
                          ? 'bg-blue-50/50'
                          : 'bg-white'
                        }`}
                      style={{ opacity: isOutside ? 0.35 : 1 }}
                    >
                      {/* Today left accent */}
                      {isToday && (
                        <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-navy" />
                      )}

                      {/* Date number */}
                      <div className="flex items-center justify-between mb-1 px-0.5">
                        <span
                          className={`inline-flex items-center justify-center font-mono text-xs font-semibold ${isToday
                            ? 'w-7 h-7 rounded-full bg-navy text-white shadow-sm'
                            : 'text-text-secondary'
                            }`}
                        >
                          {date.getDate()}
                        </span>
                        {isRestDay && !isOutside ? (
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-gray-100 text-gray-500 uppercase tracking-widest">
                            Rest
                          </span>
                        ) : hasEntries && !isOutside && (
                          <span className="text-[9px] font-mono text-text-muted">
                            {dayEntries.length}
                          </span>
                        )}
                      </div>

                      {/* Entry mini cards */}
                      <div className="flex flex-col gap-1 flex-1">
                        {visibleEntries.map((entry) => (
                          <MiniCard key={entry.id} entry={entry} />
                        ))}
                        {moreCount > 0 && (
                          <span className="text-[10px] text-navy font-semibold pl-1.5 hover:underline">
                            +{moreCount} more
                          </span>
                        )}
                      </div>

                      {/* Empty day hover hint */}
                      {!hasEntries && !isOutside && (
                        <div className="flex-1 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <span className="w-6 h-6 rounded-full border-2 border-dashed border-border flex items-center justify-center text-text-muted text-xs">
                            +
                          </span>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}

            {/* Loading overlay */}
            {loading && (
              <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="flex items-center gap-2.5 bg-white rounded-xl px-4 py-3 shadow-md">
                  <svg className="w-4 h-4 animate-spin text-navy" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                  <span className="text-sm font-medium text-text-secondary">Loading...</span>
                </div>
              </div>
            )}
          </div>
        )}

      {/* Day detail modal */}
      <DayDetailModal
        isOpen={!!selectedDate && !modalMode}
        onClose={() => setSelectedDate(null)}
        date={selectedDate}
        entries={entriesByDate[selectedDate] || []}
        onAddWorkout={handleAddWorkout}
        onLogActivity={handleLogActivity}
        onEditEntry={handleEditEntry}
      />

      {/* Session details modal (create/edit) */}
      <SessionDetailsModal
        isOpen={modalMode === 'session'}
        onClose={() => {
          setModalMode(null);
          setEditingEntry(null);
        }}
        onSave={handleSaveEntry}
        onDelete={handleDeleteEntry}
        entry={editingEntry}
        selectedDate={selectedDate}
      />

      {/* Manual activity modal */}
      <ManualActivityModal
        isOpen={modalMode === 'log'}
        onClose={() => setModalMode(null)}
        onSuccess={() => {
          setModalMode(null);
          fetchMonthEntries();
        }}
        defaultDate={selectedDate}
      />
    </div >
  );
};

export default Calendar;
