import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { calendarAPI } from '../api/calendar';
import { stravaAPI } from '../api/strava';
import SessionDetailsModal, { WORKOUT_TYPES } from '../components/SessionDetailsModal';
import ManualActivityModal from '../components/ManualActivityModal';

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const formatDateKey = (date) => {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
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
      <span className="px-1 py-0.5 rounded text-[7px] font-bold bg-sage/20 text-sage leading-none">
        AI
      </span>
    );
  }
  return null;
};

const MiniCard = ({ entry }) => {
  const color = getBadgeColor(entry.workout_type);
  const isCompleted = entry.status === 'completed';

  return (
    <div className="flex items-center gap-1 min-w-0">
      <div
        className="w-0.5 h-4 rounded-full flex-shrink-0"
        style={{ backgroundColor: color }}
      />
      <span className="text-[11px] truncate text-text-primary leading-tight flex-1">
        {entry.title}
      </span>
      <div className="flex items-center gap-0.5 flex-shrink-0">
        {isCompleted ? (
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
        ) : (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
        )}
        <SourceBadge source={entry.source} />
      </div>
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
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-md max-h-[80vh] flex flex-col shadow-xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3
                className="text-lg font-bold text-text-primary"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {formatted}
              </h3>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-bg-app text-text-muted cursor-pointer bg-transparent border-none"
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
            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {entries.length === 0 && (
                <p className="text-sm text-text-muted text-center py-6">
                  No activities on this day.
                </p>
              )}
              {entries.map((entry) => {
                const typeInfo = WORKOUT_TYPES.find(
                  (t) => t.value === entry.workout_type
                );
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
                  <div
                    key={entry.id}
                    onClick={() => onEditEntry(entry)}
                    className="p-3 rounded-lg border border-border hover:border-navy/30 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getBadgeClasses(entry.workout_type)}`}
                      >
                        {getBadgeLabel(entry.workout_type)}
                      </span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-semibold ${
                          entry.status === 'completed'
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
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            entry.source === 'strava'
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
                    <p className="text-sm font-medium text-text-primary">
                      {entry.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-text-muted font-mono">
                      {distMi && <span>{distMi} mi</span>}
                      {paceStr && <span>{paceStr}</span>}
                      {durMin && <span>{durMin} min</span>}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-border flex gap-3">
              <button
                onClick={onAddWorkout}
                className="flex-1 px-3 py-2 rounded-lg bg-navy text-white text-sm font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity"
              >
                Add Workout
              </button>
              <button
                onClick={onLogActivity}
                className="flex-1 px-3 py-2 rounded-lg border border-border bg-white text-text-secondary text-sm font-medium cursor-pointer hover:bg-bg-elevated transition-colors"
              >
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
      const key = formatDateKey(entry.date);
      if (!map[key]) map[key] = [];
      map[key].push(entry);
    }
    return map;
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
  }).toUpperCase();

  const today = todayKey();
  const currentMonthNum = currentMonth.getMonth();

  const weeks = [];
  for (let i = 0; i < gridDates.length; i += 7) {
    weeks.push(gridDates.slice(i, i + 7));
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigateMonth(-1)}
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
          <h1
            className="text-xl font-bold text-text-primary tracking-wide"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {monthLabel}
          </h1>
          <button
            onClick={() => navigateMonth(1)}
            className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text-secondary cursor-pointer hover:bg-bg-elevated transition-colors"
          >
            Today
          </button>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-3 py-1.5 rounded-lg border border-border bg-white text-xs font-semibold text-text-secondary cursor-pointer hover:bg-bg-elevated transition-colors disabled:opacity-50 flex items-center gap-1.5"
          >
            {syncing ? (
              <svg
                className="w-3.5 h-3.5 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 1 1-6.219-8.56" />
              </svg>
            ) : (
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            )}
            Sync
          </button>
          <button
            onClick={handleQuickAdd}
            className="px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity flex items-center gap-1"
          >
            <svg
              className="w-3.5 h-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Workout
          </button>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="rounded-xl border border-border overflow-hidden bg-bg-elevated relative">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 bg-white border-b border-border">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted py-2"
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
            style={{ gap: '1px', backgroundColor: 'var(--color-border)' }}
          >
            {week.map((date) => {
              const dateKey = formatDateKey(date);
              const isToday = dateKey === today;
              const isOutside = date.getMonth() !== currentMonthNum;
              const dayEntries = entriesByDate[dateKey] || [];
              const visibleEntries = dayEntries.slice(0, 3);
              const moreCount = dayEntries.length - 3;

              return (
                <div
                  key={dateKey}
                  onClick={() => handleDayClick(dateKey)}
                  className="bg-white p-1.5 min-h-[90px] cursor-pointer hover:bg-blue-50/30 transition-colors flex flex-col"
                  style={{ opacity: isOutside ? 0.4 : 1 }}
                >
                  {/* Date number */}
                  <div className="mb-1">
                    <span
                      className={`inline-flex items-center justify-center text-xs font-mono font-medium ${
                        isToday
                          ? 'w-6 h-6 rounded-full bg-navy text-white'
                          : 'text-text-primary'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                  </div>

                  {/* Entry mini cards */}
                  <div className="flex flex-col gap-0.5 flex-1">
                    {visibleEntries.map((entry) => (
                      <MiniCard key={entry.id} entry={entry} />
                    ))}
                    {moreCount > 0 && (
                      <span className="text-[10px] text-text-muted font-medium pl-2">
                        +{moreCount} more
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
            <span className="text-sm text-text-muted">Loading...</span>
          </div>
        )}
      </div>

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
    </div>
  );
};

export default Calendar;
