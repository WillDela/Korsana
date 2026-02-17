import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export const WORKOUT_TYPES = [
  { value: 'easy', label: 'Easy Run', color: '#5B8C3E', badge: 'RUN', badgeBg: 'bg-sage', badgeText: 'text-white' },
  { value: 'tempo', label: 'Tempo', color: '#3B82F6', badge: 'TEMPO', badgeBg: 'bg-blue-500', badgeText: 'text-white' },
  { value: 'long', label: 'Long Run', color: '#1B2559', badge: 'LONG RUN', badgeBg: 'bg-navy', badgeText: 'text-white' },
  { value: 'interval', label: 'Interval', color: '#E8725A', badge: 'INTERVAL', badgeBg: 'bg-coral', badgeText: 'text-white' },
  { value: 'rest', label: 'Rest', color: '#9CA3AF', badge: 'REST', badgeBg: 'bg-transparent border border-gray-300', badgeText: 'text-gray-500' },
  { value: 'recovery', label: 'Recovery', color: '#6B7280', badge: 'RECOVERY', badgeBg: 'bg-gray-100', badgeText: 'text-gray-600' },
  { value: 'cross_train', label: 'Cross Train', color: '#E5A830', badge: 'CROSS TRAIN', badgeBg: 'bg-transparent border border-amber', badgeText: 'text-amber' },
  { value: 'race', label: 'Race', color: '#7C3AED', badge: 'RACE', badgeBg: 'bg-purple-600', badgeText: 'text-white' },
];

const SessionDetailsModal = ({ isOpen, onClose, onSave, onDelete, entry, selectedDate }) => {
  const [title, setTitle] = useState('');
  const [workoutType, setWorkoutType] = useState('easy');
  const [distanceMiles, setDistanceMiles] = useState('');
  const [targetPace, setTargetPace] = useState('');
  const [notes, setNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isEditing = !!entry;

  useEffect(() => {
    if (entry) {
      setTitle(entry.title || '');
      setWorkoutType(entry.workout_type || 'easy');
      setDistanceMiles(entry.planned_distance_meters ? (entry.planned_distance_meters * 0.000621371).toFixed(1) : '');
      // Convert pace from seconds/km to mm:ss/mi
      if (entry.planned_pace_per_km) {
        const pacePerMile = entry.planned_pace_per_km * 1.60934;
        const m = Math.floor(pacePerMile / 60);
        const s = Math.round(pacePerMile % 60);
        setTargetPace(`${m}:${s.toString().padStart(2, '0')}`);
      } else {
        setTargetPace('');
      }
      setNotes(entry.description || '');
      setIsCompleted(entry.status === 'completed');
    } else {
      setTitle('');
      setWorkoutType('easy');
      setDistanceMiles('');
      setTargetPace('');
      setNotes('');
      setIsCompleted(false);
    }
    setError('');
  }, [entry, isOpen]);

  const handleTypeChange = (type) => {
    setWorkoutType(type);
    const typeInfo = WORKOUT_TYPES.find((t) => t.value === type);
    if (!title || WORKOUT_TYPES.some((t) => t.label === title)) {
      setTitle(type === 'rest' ? 'Rest Day' : typeInfo?.label || type);
    }
  };

  const parsePaceToSecondsPerKm = (paceStr) => {
    if (!paceStr) return null;
    const parts = paceStr.split(':');
    if (parts.length !== 2) return null;
    const mins = parseInt(parts[0]);
    const secs = parseInt(parts[1]);
    if (isNaN(mins) || isNaN(secs)) return null;
    const totalSecsPerMile = mins * 60 + secs;
    return Math.round(totalSecsPerMile / 1.60934);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const distanceMeters = distanceMiles ? Math.round(parseFloat(distanceMiles) / 0.000621371) : null;
      const pacePerKm = parsePaceToSecondsPerKm(targetPace);

      const data = {
        date: selectedDate,
        workout_type: workoutType,
        title: title.trim(),
        description: notes.trim() || null,
        planned_distance_meters: distanceMeters,
        planned_pace_per_km: pacePerKm,
        status: isCompleted ? 'completed' : (entry?.status || 'planned'),
      };

      await onSave(data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to save session');
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
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(0,0,0,0.4)' }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto shadow-xl"
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-lg font-bold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
                Session Details
              </h3>
              <p className="text-sm text-text-muted mt-0.5">{formattedDate}</p>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {error && (
                <div className="bg-red-50 text-red-600 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Session title"
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-navy"
                />
              </div>

              {/* Type + Distance row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Type</label>
                  <select
                    value={workoutType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-navy bg-white cursor-pointer"
                  >
                    {WORKOUT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Distance (mi)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={distanceMiles}
                    onChange={(e) => setDistanceMiles(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-mono focus:outline-none focus:border-navy"
                  />
                </div>
              </div>

              {/* Target Pace + Mark Completed row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Target Pace (mm:ss/mi)</label>
                  <input
                    type="text"
                    value={targetPace}
                    onChange={(e) => setTargetPace(e.target.value)}
                    placeholder="8:30"
                    className="w-full px-3 py-2.5 rounded-lg border border-border text-sm font-mono focus:outline-none focus:border-navy"
                  />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      onChange={(e) => setIsCompleted(e.target.checked)}
                      className="w-4 h-4 rounded border-border accent-sage"
                    />
                    <span className="text-sm text-text-secondary font-medium">Mark Completed</span>
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[10px] font-semibold uppercase tracking-wider text-text-muted mb-1.5">Technical Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Warm-up plan, pacing strategy, focus areas..."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg border border-border text-sm focus:outline-none focus:border-navy resize-y"
                  style={{ fontFamily: 'inherit' }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-border flex items-center gap-3">
              {isEditing && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg border border-red-200 bg-red-50 text-red-600 text-sm font-medium cursor-pointer hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              )}
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-lg border border-border bg-white text-text-secondary text-sm font-medium cursor-pointer hover:bg-bg-elevated transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 rounded-lg border-none bg-navy text-white text-sm font-semibold cursor-pointer hover:opacity-90 transition-opacity"
                style={{ opacity: saving ? 0.7 : 1 }}
              >
                {saving ? 'Saving...' : 'Save Session'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SessionDetailsModal;
