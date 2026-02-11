import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const WORKOUT_TYPES = [
  { value: 'easy', label: 'Easy', color: '#618B4A', icon: '🏃' },
  { value: 'tempo', label: 'Tempo', color: '#D97706', icon: '⚡' },
  { value: 'interval', label: 'Interval', color: '#DC2626', icon: '🔥' },
  { value: 'long', label: 'Long Run', color: '#242E7B', icon: '🏔️' },
  { value: 'recovery', label: 'Recovery', color: '#6B7280', icon: '🧘' },
  { value: 'rest', label: 'Rest', color: '#9CA3AF', icon: '😴' },
  { value: 'race', label: 'Race', color: '#7C3AED', icon: '🏁' },
];

const CalendarEntryModal = ({ isOpen, onClose, onSave, onDelete, entry, selectedDate }) => {
  const [workoutType, setWorkoutType] = useState(entry?.workout_type || 'easy');
  const [title, setTitle] = useState(entry?.title || '');
  const [description, setDescription] = useState(entry?.description || '');
  const [distance, setDistance] = useState(
    entry?.planned_distance_meters ? (entry.planned_distance_meters / 1000).toFixed(1) : ''
  );
  const [duration, setDuration] = useState(entry?.planned_duration_minutes || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!entry;

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const data = {
        date: selectedDate,
        workout_type: workoutType,
        title: title.trim(),
        description: description.trim() || null,
        planned_distance_meters: distance ? Math.round(parseFloat(distance) * 1000) : null,
        planned_duration_minutes: duration ? parseInt(duration) : null,
        status: entry?.status || 'planned',
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save entry');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry?.id) return;
    setSaving(true);
    try {
      await onDelete(entry.id);
      onClose();
    } catch (err) {
      setError('Failed to delete');
    } finally {
      setSaving(false);
    }
  };

  // Auto-fill title based on workout type
  const handleTypeChange = (type) => {
    setWorkoutType(type);
    const typeInfo = WORKOUT_TYPES.find((t) => t.value === type);
    if (!title || WORKOUT_TYPES.some((t) => t.label === title || `${t.label} Run` === title)) {
      setTitle(type === 'rest' ? 'Rest Day' : `${typeInfo?.label || type} Run`);
    }
  };

  if (!isOpen) return null;

  const dateObj = new Date(selectedDate + 'T12:00:00');
  const formattedDate = dateObj.toLocaleDateString('en-US', {
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
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              width: '100%',
              maxWidth: '480px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <h3 className="font-semibold" style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0 }}>
                  {isEditing ? 'Edit Workout' : 'Add Workout'}
                </h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: '0.25rem 0 0' }}>
                  {formattedDate}
                </p>
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '1.25rem',
                  cursor: 'pointer',
                  color: '#9CA3AF',
                  padding: '0.25rem',
                }}
              >
                ✕
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: '1.5rem' }}>
              {error && (
                <div
                  style={{
                    background: '#FEF2F2',
                    color: '#DC2626',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '6px',
                    fontSize: '0.8125rem',
                    marginBottom: '1rem',
                  }}
                >
                  {error}
                </div>
              )}

              {/* Workout Type Selector */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.5rem' }}>
                  Type
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {WORKOUT_TYPES.map((type) => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => handleTypeChange(type.value)}
                      style={{
                        padding: '0.375rem 0.75rem',
                        borderRadius: '20px',
                        border: workoutType === type.value ? `2px solid ${type.color}` : '1px solid #E5E7EB',
                        background: workoutType === type.value ? `${type.color}15` : '#fff',
                        color: workoutType === type.value ? type.color : '#6B7280',
                        fontSize: '0.75rem',
                        fontWeight: workoutType === type.value ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {type.icon} {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Workout title"
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Distance + Duration row */}
              {workoutType !== 'rest' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
                      Distance (km)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={distance}
                      onChange={(e) => setDistance(e.target.value)}
                      placeholder="0.0"
                      className="font-mono"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
                      Duration (min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      placeholder="0"
                      className="font-mono"
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.75rem',
                        borderRadius: '6px',
                        border: '1px solid #D1D5DB',
                        fontSize: '0.875rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '0.375rem' }}>
                  Notes (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Workout details, warm-up plan, etc."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    fontSize: '0.875rem',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {isEditing && (
                  <button
                    onClick={handleDelete}
                    disabled={saving}
                    style={{
                      padding: '0.625rem 1rem',
                      borderRadius: '6px',
                      border: '1px solid #FCA5A5',
                      background: '#FEF2F2',
                      color: '#DC2626',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    Delete
                  </button>
                )}
                <div style={{ flex: 1 }} />
                <button
                  onClick={onClose}
                  style={{
                    padding: '0.625rem 1.25rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    background: '#fff',
                    color: '#374151',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '0.625rem 1.5rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: '#242E7B',
                    color: '#fff',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : isEditing ? 'Update' : 'Add Workout'}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export { WORKOUT_TYPES };
export default CalendarEntryModal;
