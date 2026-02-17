import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { calendarAPI } from '../api/calendar';
import CalendarEntryModal, { WORKOUT_TYPES } from './CalendarEntryModal';

// Get Monday of the current week
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

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const WeekCalendar = ({ compact = false }) => {
  const [weekStart, setWeekStart] = useState(getMonday());
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);

  const fetchWeek = useCallback(async () => {
    try {
      setLoading(true);
      const data = await calendarAPI.getWeek(formatDateKey(weekStart));
      setEntries(data.entries || []);
    } catch (err) {
      console.error('Failed to fetch calendar:', err);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [weekStart]);

  useEffect(() => {
    fetchWeek();
  }, [fetchWeek]);

  const navigateWeek = (direction) => {
    const newStart = new Date(weekStart);
    newStart.setDate(newStart.getDate() + direction * 7);
    setWeekStart(newStart);
  };

  const handleDayClick = (dateKey) => {
    if (compact) return; // no editing in compact mode
    const existing = entries.find(
      (e) => formatDateKey(e.date) === dateKey
    );
    setSelectedDate(dateKey);
    setSelectedEntry(existing || null);
    setModalOpen(true);
  };

  const handleSave = async (data) => {
    await calendarAPI.upsertEntry(data);
    await fetchWeek();
  };

  const handleDelete = async (id) => {
    await calendarAPI.deleteEntry(id);
    await fetchWeek();
  };

  const handleStatusToggle = async (e, entry) => {
    e.stopPropagation();
    const nextStatus = entry.status === 'completed' ? 'planned' : 'completed';
    try {
      await calendarAPI.updateStatus(entry.id, nextStatus);
      await fetchWeek();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Build 7 days starting from weekStart
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + i);
    const dateKey = formatDateKey(date);
    const entry = entries.find((e) => formatDateKey(e.date) === dateKey);
    const isToday = formatDateKey(new Date()) === dateKey;
    return { date, dateKey, entry, isToday, dayLabel: DAY_LABELS[i] };
  });

  // Week label
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  const weekLabel = `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} — ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

  // Weekly stats
  const planned = entries.length;
  const completed = entries.filter((e) => e.status === 'completed').length;
  const totalDistance = entries.reduce((sum, e) => sum + (e.planned_distance_meters || 0), 0);

  return (
    <div>
      {/* Header with navigation */}
      {!compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <button
            onClick={() => navigateWeek(-1)}
            style={{
              background: 'none',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              color: '#374151',
            }}
          >
            ← Prev
          </button>
          <h3 className="font-semibold" style={{ fontSize: '1rem', fontWeight: 600, margin: 0, color: '#1F2937' }}>
            {weekLabel}
          </h3>
          <button
            onClick={() => navigateWeek(1)}
            style={{
              background: 'none',
              border: '1px solid #E5E7EB',
              borderRadius: '6px',
              padding: '0.375rem 0.75rem',
              cursor: 'pointer',
              fontSize: '0.8125rem',
              color: '#374151',
            }}
          >
            Next →
          </button>
        </div>
      )}

      {compact && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 500 }}>{weekLabel}</span>
          <span className="font-mono" style={{ fontSize: '0.75rem', color: '#242E7B' }}>
            {completed}/{planned} done
          </span>
        </div>
      )}

      {/* 7-day grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: compact ? '0.25rem' : '0.5rem',
        }}
      >
        {days.map(({ date, dateKey, entry, isToday, dayLabel }) => {
          const typeInfo = entry ? WORKOUT_TYPES.find((t) => t.value === entry.workout_type) : null;

          return (
            <motion.div
              key={dateKey}
              whileHover={!compact ? { scale: 1.02, y: -2 } : {}}
              onClick={() => handleDayClick(dateKey)}
              style={{
                background: isToday ? '#F0F4FF' : '#fff',
                border: isToday ? '2px solid #242E7B' : '1px solid #E5E7EB',
                borderRadius: compact ? '6px' : '8px',
                padding: compact ? '0.375rem' : '0.625rem',
                minHeight: compact ? '60px' : '90px',
                cursor: compact ? 'default' : 'pointer',
                display: 'flex',
                flexDirection: 'column',
                transition: 'box-shadow 0.15s',
                position: 'relative',
              }}
            >
              {/* Day header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: compact ? '0.25rem' : '0.375rem',
              }}>
                <span style={{
                  fontSize: compact ? '0.625rem' : '0.6875rem',
                  fontWeight: 600,
                  color: isToday ? '#242E7B' : '#6B7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}>
                  {dayLabel}
                </span>
                <span className="font-mono" style={{
                  fontSize: compact ? '0.625rem' : '0.75rem',
                  color: isToday ? '#242E7B' : '#9CA3AF',
                  fontWeight: isToday ? 600 : 400,
                }}>
                  {date.getDate()}
                </span>
              </div>

              {/* Entry content */}
              {entry ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.125rem' }}>
                  {/* Status + type indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    {!compact && (
                      <button
                        onClick={(e) => handleStatusToggle(e, entry)}
                        style={{
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          border: entry.status === 'completed' ? 'none' : `2px solid ${typeInfo?.color || '#D1D5DB'}`,
                          background: entry.status === 'completed' ? '#10B981' : 'transparent',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.5rem',
                          color: '#fff',
                          flexShrink: 0,
                          padding: 0,
                        }}
                        title={entry.status === 'completed' ? 'Mark as planned' : 'Mark as done'}
                      >
                        {entry.status === 'completed' && '✓'}
                      </button>
                    )}
                    {compact && entry.status === 'completed' && (
                      <span style={{ fontSize: '0.5rem', color: '#10B981' }}>✓</span>
                    )}
                    <span style={{
                      fontSize: compact ? '0.5625rem' : '0.6875rem',
                      fontWeight: 600,
                      color: typeInfo?.color || '#374151',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                      {entry.title}
                    </span>
                  </div>

                  {/* Distance */}
                  {entry.planned_distance_meters && (
                    <span className="font-mono" style={{
                      fontSize: compact ? '0.5625rem' : '0.6875rem',
                      color: '#6B7280',
                    }}>
                      {(entry.planned_distance_meters * 0.000621371).toFixed(1)} mi
                    </span>
                  )}

                  {/* Missed indicator */}
                  {entry.status === 'missed' && (
                    <span style={{ fontSize: '0.5625rem', color: '#DC2626', fontWeight: 500 }}>
                      Missed
                    </span>
                  )}
                </div>
              ) : (
                /* Empty day */
                <div style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {!compact && (
                    <span style={{ fontSize: '1rem', color: '#D1D5DB' }}>+</span>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Weekly summary bar (full mode only) */}
      {!compact && entries.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '1.5rem',
            marginTop: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid #F3F4F6',
            justifyContent: 'center',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#242E7B' }}>
              {planned}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>planned</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#10B981' }}>
              {completed}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>done</span>
          </div>
          <div style={{ textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#374151' }}>
              {(totalDistance / 1000).toFixed(1)}
            </span>
            <span style={{ fontSize: '0.6875rem', color: '#6B7280', display: 'block' }}>km total</span>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '8px',
        }}>
          <span style={{ fontSize: '0.8125rem', color: '#6B7280' }}>Loading...</span>
        </div>
      )}

      {/* Modal */}
      <CalendarEntryModal
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

export default WeekCalendar;
