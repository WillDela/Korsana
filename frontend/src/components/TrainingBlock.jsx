import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { calendarAPI } from '../api/calendar';
import SessionDetailsModal, { WORKOUT_TYPES } from './SessionDetailsModal';

const getMonday = (date = new Date()) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatDateKey = (date) => {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const DAY_LABELS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const getBadgeClasses = (type) => {
  const t = WORKOUT_TYPES.find(w => w.value === type);
  if (!t) return 'bg-gray-100 text-gray-600';
  return `${t.badgeBg} ${t.badgeText}`;
};

const getBadgeLabel = (type) => {
  const t = WORKOUT_TYPES.find(w => w.value === type);
  return t?.badge || type.toUpperCase();
};

const TrainingBlock = () => {
  const [blockStart, setBlockStart] = useState(getMonday());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchBlock = useCallback(async () => {
    try {
      setLoading(true);
      const week1Start = formatDateKey(blockStart);
      const week2Start = new Date(blockStart);
      week2Start.setDate(week2Start.getDate() + 7);
      const week2StartStr = formatDateKey(week2Start);

      const [data1, data2] = await Promise.all([
        calendarAPI.getWeek(week1Start),
        calendarAPI.getWeek(week2StartStr),
      ]);

      setEntries([...(data1.entries || []), ...(data2.entries || [])]);
    } catch (err) {
      console.error('Failed to fetch training block:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [blockStart]);

  useEffect(() => {
    fetchBlock();
  }, [fetchBlock]);

  const navigateBlock = (direction) => {
    const newStart = new Date(blockStart);
    newStart.setDate(newStart.getDate() + direction * 14);
    setBlockStart(newStart);
  };

  const handleDayClick = (dateKey) => {
    const existing = entries.find((e) => formatDateKey(e.date) === dateKey);
    setSelectedDate(dateKey);
    setSelectedEntry(existing || null);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    await calendarAPI.upsertEntry(data);
    await fetchBlock();
  };

  const handleDelete = async (id) => {
    await calendarAPI.deleteEntry(id);
    await fetchBlock();
  };

  // Build 14 days
  const days = Array.from({ length: 14 }, (_, i) => {
    const date = new Date(blockStart);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    const entry = entries.find((e) => formatDateKey(e.date) === dateKey);
    const isToday = formatDateKey(new Date()) === dateKey;
    return { date, dateKey, entry, isToday };
  });

  const week1 = days.slice(0, 7);
  const week2 = days.slice(7, 14);

  // Block volume
  const blockVolumeMiles = entries.reduce(
    (sum, e) => sum + (e.planned_distance_meters || 0) * 0.000621371,
    0
  ).toFixed(1);

  // Date range label
  const blockEnd = new Date(blockStart);
  blockEnd.setDate(blockEnd.getDate() + 13);
  const rangeLabel = `${blockStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${blockEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

  const renderDayCard = ({ date, dateKey, entry, isToday }) => {
    const typeInfo = entry ? WORKOUT_TYPES.find(t => t.value === entry.workout_type) : null;

    return (
      <motion.div
        key={dateKey}
        whileHover={{ scale: 1.02, y: -2 }}
        onClick={() => handleDayClick(dateKey)}
        className={`bg-white rounded-lg p-3 min-h-[110px] cursor-pointer flex flex-col transition-shadow hover:shadow-md ${
          isToday ? 'border-2 border-navy' : 'border border-border'
        }`}
      >
        {/* Date number */}
        <div className="flex items-center justify-between mb-2">
          <span className={`text-lg font-bold font-mono ${isToday ? 'text-navy' : 'text-text-primary'}`}>
            {date.getDate()}
          </span>
          {entry?.status === 'completed' && (
            <span className="w-5 h-5 rounded-full bg-green-500 text-white text-[10px] flex items-center justify-center font-bold">
              ✓
            </span>
          )}
        </div>

        {entry ? (
          <div className="flex-1 flex flex-col gap-1.5">
            {/* Type badge */}
            <span className={`inline-block self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide ${getBadgeClasses(entry.workout_type)}`}>
              {getBadgeLabel(entry.workout_type)}
            </span>

            {/* Title + source */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-medium text-text-primary truncate">
                {entry.title}
              </span>
              {entry.source === 'ai_coach' && (
                <span className="px-1 py-0.5 rounded text-[8px] font-bold bg-sage/20 text-sage leading-none">AI</span>
              )}
            </div>

            {/* Distance + pace */}
            <div className="mt-auto flex items-center gap-2 text-[11px] text-text-muted font-mono">
              {entry.planned_distance_meters && (
                <span>{(entry.planned_distance_meters * 0.000621371).toFixed(1)} mi</span>
              )}
              {entry.planned_pace_per_km && (
                <span>
                  {(() => {
                    const p = entry.planned_pace_per_km * 1.60934;
                    const m = Math.floor(p / 60);
                    const s = Math.round(p % 60);
                    return `${m}:${s.toString().padStart(2, '0')}/mi`;
                  })()}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <span className="text-xl text-gray-200">+</span>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">Training Block</span>
          <h2 className="text-xl font-bold text-text-primary mt-0.5" style={{ fontFamily: 'var(--font-heading)' }}>
            Micro-Cycle View
          </h2>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted block">Block Volume</span>
          <span className="text-xl font-bold text-navy font-mono">{blockVolumeMiles} mi</span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-center gap-4 mb-5">
        <button
          onClick={() => navigateBlock(-1)}
          className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <span className="text-sm font-semibold text-text-primary min-w-[160px] text-center">{rangeLabel}</span>
        <button
          onClick={() => navigateBlock(1)}
          className="w-8 h-8 rounded-lg border border-border bg-white flex items-center justify-center cursor-pointer hover:bg-bg-elevated transition-colors text-text-secondary"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-2 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[10px] font-semibold uppercase tracking-wider text-text-muted py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Week 1 */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {week1.map(renderDayCard)}
      </div>

      {/* Week 2 */}
      <div className="grid grid-cols-7 gap-2">
        {week2.map(renderDayCard)}
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center rounded-xl">
          <span className="text-sm text-text-muted">Loading...</span>
        </div>
      )}

      {/* Modal */}
      <SessionDetailsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        entry={selectedEntry}
        selectedDate={selectedDate}
      />
    </div>
  );
};

export default TrainingBlock;
