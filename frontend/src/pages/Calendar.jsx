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


const MiniCard = ({ entry }) => {
  const isMissed = entry.status === 'missed';
  const typeInfo = WORKOUT_TYPES.find((w) => w.value === entry.workout_type);
  const accentColor = typeInfo?.color || '#6B7280';

  const distKm = entry.planned_distance_meters > 0
    ? (entry.planned_distance_meters / 1000).toFixed(1)
    : null;

  return (
    <div
      className={`flex items-center gap-1 rounded px-1 py-0.5 min-w-0 ${isMissed ? 'opacity-50' : ''}`}
      style={{ borderLeft: `2.5px solid ${accentColor}`, background: `${accentColor}12` }}
    >
      {entry.source === 'strava' && (
        <span className="text-[7px] font-bold text-orange-500 flex-shrink-0 leading-none">S</span>
      )}
      <span className={`text-[10px] font-semibold truncate flex-1 leading-tight ${isMissed ? 'text-gray-400 line-through' : 'text-text-primary'}`}>
        {entry.title}
      </span>
      {distKm && (
        <span className="text-[8px] font-mono text-text-muted flex-shrink-0 leading-none">
          {distKm}k
        </span>
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
  onMarkComplete,
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

                const isComplete = entry.status === 'completed';

                return (
                  <motion.div
                    key={entry.id}
                    className="rounded-xl transition-shadow hover:shadow-md"
                    style={{
                      backgroundColor: `${color}08`,
                      border: `1px solid ${color}25`,
                    }}
                  >
                    <div
                      className="p-3.5 cursor-pointer"
                      onClick={() => onEditEntry(entry)}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${getBadgeClasses(entry.workout_type)}`}
                        >
                          {getBadgeLabel(entry.workout_type)}
                        </span>
                        <span
                          className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold ${isComplete
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
                    </div>
                    {!isComplete && (
                      <div className="px-3.5 pb-3 flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); onMarkComplete(entry.id); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-green-50 text-green-700 text-[11px] font-bold border border-green-200 cursor-pointer hover:bg-green-100 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Mark Complete
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onLogActivity(); }}
                          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white text-text-secondary text-[11px] font-bold border border-border cursor-pointer hover:bg-bg-app transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                          </svg>
                          Log Activity
                        </button>
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

  const handleMarkComplete = useCallback(async (entryId) => {
    try {
      await calendarAPI.updateStatus(entryId, 'completed');
      await fetchMonthEntries();
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  }, [fetchMonthEntries]);

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
          <h1 className="text-3xl font-bold text-navy" style={{ fontFamily: 'var(--font-heading)' }}>
            Training Calendar
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* View Tabs */}
          <div className="flex items-center p-1 bg-white rounded-lg border border-border shadow-sm">
            {['month', 'week', 'day'].map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-md transition-colors ${view === v
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-navy hover:bg-bg-app'
                  }`}
              >
                {v}
              </button>
            ))}
          </div>

          <button
            onClick={handleQuickAdd}
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
          (() => {
            const displayDate = selectedDate || today;
            const entries = entriesByDate[displayDate] || [];
            const displayDateObj = new Date(displayDate + 'T12:00:00');
            const isToday = displayDate === today;
            const dateTitle = isToday ? "Today's Schedule" : displayDateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

            return (
              <div className="rounded-2xl border border-border overflow-hidden shadow-sm bg-white">
                <div className="p-6 border-b border-border flex justify-between items-center bg-[#F8FAFF]">
                  <div>
                    <h2 className="text-2xl font-bold text-navy flex items-center gap-3" style={{ fontFamily: 'var(--font-heading)' }}>
                      {dateTitle}
                      {isToday && <span className="px-2 py-0.5 rounded text-[10px] uppercase tracking-widest font-bold bg-navy text-white">Today</span>}
                    </h2>
                    <p className="text-text-secondary text-sm mt-1">Detailed breakdown of your planned activities.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-navy font-mono leading-none">{entries.length}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-text-muted mt-1">Activities</div>
                  </div>
                </div>

                <div className="p-0">
                  {entries.length > 0 ? (
                    <div className="divide-y divide-border">
                      {entries.map(entry => {
                        const typeInfo = WORKOUT_TYPES.find((w) => w.value === entry.workout_type);
                        const accentColor = typeInfo?.color || '#6B7280';
                        const distKm = entry.planned_distance_meters > 0
                          ? (entry.planned_distance_meters / 1000).toFixed(1)
                          : null;

                        return (
                          <div
                            key={entry.id}
                            className="p-6 flex items-start gap-5 hover:bg-bg-app transition-colors group cursor-pointer"
                            onClick={() => handleEditEntry(entry)}
                          >
                            <div className="mt-1 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15`, color: accentColor }}>
                              <span className="font-bold text-lg">{typeInfo?.badge?.charAt(0) || 'A'}</span>
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-bold text-text-primary truncate">{entry.title}</h3>
                                {entry.source === 'strava' && <span className="text-[10px] font-bold text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded leading-none">S</span>}
                              </div>

                              <p className="text-sm text-text-secondary mb-3 leading-relaxed max-w-2xl">
                                {entry.description || 'No description provided.'}
                              </p>

                              <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-text-muted">
                                {distKm && (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10M12 20V4M6 20v-6" /></svg>
                                    {distKm} km
                                  </span>
                                )}
                                {entry.planned_duration_minutes > 0 && (
                                  <span className="flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                                    {entry.planned_duration_minutes} min
                                  </span>
                                )}
                                {entry.status && (
                                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-widest text-[9px] ${entry.status === 'completed' ? 'bg-[#82A895]/20 text-[#82A895]' :
                                    entry.status === 'missed' ? 'bg-gray-100 text-gray-500' : 'bg-navy/10 text-navy'
                                    }`}>
                                    {entry.status}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="opacity-0 group-hover:opacity-100 transition-opacity text-text-muted flex-shrink-0 mt-2">
                              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-16 text-center">
                      <div className="w-16 h-16 bg-bg-app rounded-full flex items-center justify-center mx-auto mb-4 text-border">
                        <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
                      </div>
                      <h3 className="text-lg font-bold text-navy mb-1" style={{ fontFamily: 'var(--font-heading)' }}>No Activities Scheduled</h3>
                      <p className="text-text-secondary text-sm max-w-sm mx-auto mb-6">
                        You don't have any training activities scheduled for {isToday ? 'today' : 'this date'}. Take it easy and recover!
                      </p>
                      <button
                        onClick={() => {
                          setEditingEntry(null);
                          setModalMode('session');
                        }}
                        className="px-5 py-2.5 bg-white border border-border shadow-sm rounded-lg text-sm font-bold text-navy hover:bg-bg-app transition-colors cursor-pointer"
                      >
                        + Log an Activity
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })()
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
                  const dayEntries = entriesByDate[dateKey] || [];
                  const isRestDay = dayEntries.length === 1 && (dayEntries[0].workout_type === 'rest' || dayEntries[0].title?.toLowerCase() === 'rest');
                  const MAX_VISIBLE = 3;
                  const visibleEntries = isRestDay ? [] : dayEntries.slice(0, MAX_VISIBLE);
                  const moreCount = isRestDay ? 0 : Math.max(0, dayEntries.length - MAX_VISIBLE);
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
        onMarkComplete={handleMarkComplete}
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
