import { useState } from 'react';
import { ACTIVITY_CONFIGS } from '../constants/activityTypes';
import { activitiesAPI } from '../api/activities';
import { useUnits } from '../context/UnitsContext';
import { distanceLabel, toMeters } from '../utils/units';

const MUSCLE_GROUPS = [
  'chest', 'back', 'legs', 'shoulders', 'arms', 'core', 'full body',
];

const ManualActivityModal = ({ isOpen, onClose, onSuccess, defaultDate }) => {
  const { unit } = useUnits();
  const [activityType, setActivityType] = useState('run');
  const [name, setName] = useState('');
  const [date, setDate] = useState(
    defaultDate || new Date().toISOString().slice(0, 10)
  );
  const [durationMinutes, setDurationMinutes] = useState('');
  const [distanceMiles, setDistanceMiles] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [notes, setNotes] = useState('');
  const [muscleGroup, setMuscleGroup] = useState('');
  const [floors, setFloors] = useState('');
  const [resistanceLevel, setResistanceLevel] = useState('');
  const [calories, setCalories] = useState('');
  const [rpe, setRpe] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const config = ACTIVITY_CONFIGS[activityType] || ACTIVITY_CONFIGS.workout;
  const isDistanceBased = config.isDistanceBased;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const startTime = new Date(date + 'T09:00:00').toISOString();
      const durationSeconds = Math.round(
        parseFloat(durationMinutes || '0') * 60
      );

      const payload = {
        activity_type: activityType,
        name: name || config.label,
        start_time: startTime,
        duration_seconds: durationSeconds,
        distance_meters: isDistanceBased
          ? toMeters(parseFloat(distanceMiles || '0'), unit)
          : 0,
        average_heart_rate: heartRate ? parseInt(heartRate) : undefined,
        notes,
        rpe: rpe ? parseInt(rpe) : undefined,
        muscle_group: muscleGroup || undefined,
        floors: floors ? parseInt(floors) : undefined,
        resistance_level: resistanceLevel
          ? parseInt(resistanceLevel)
          : undefined,
        calories: calories ? parseInt(calories) : undefined,
      };

      const result = await activitiesAPI.createActivity(payload);
      onSuccess?.(result.activity);
      onClose();
      resetForm();
    } catch (err) {
      setError(
        err?.response?.data?.error || 'Failed to log activity'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setActivityType('run');
    setName('');
    setDurationMinutes('');
    setDistanceMiles('');
    setHeartRate('');
    setNotes('');
    setMuscleGroup('');
    setFloors('');
    setResistanceLevel('');
    setCalories('');
    setRpe('');
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2
            className="text-lg font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Log Activity
          </h2>
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

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Activity type picker */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(ACTIVITY_CONFIGS).map(([type, cfg]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium cursor-pointer transition-colors ${
                    activityType === type
                      ? 'border-navy bg-navy text-white'
                      : 'border-border bg-white text-text-secondary hover:bg-bg-app'
                  }`}
                >
                  <span className="text-base">{cfg.icon}</span>
                  <span className="leading-none">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.label}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="45"
              min="1"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              required
            />
          </div>

          {/* Distance (distance-based only) */}
          {isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Distance ({distanceLabel(unit)})
              </label>
              <input
                type="number"
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(e.target.value)}
                placeholder="3.1"
                min="0"
                step="0.01"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              />
            </div>
          )}

          {/* Muscle group (strength only) */}
          {activityType === 'weight_lifting' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Muscle Group
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy bg-white"
              >
                <option value="">Select muscle group</option>
                {MUSCLE_GROUPS.map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Floors (stair master only) */}
          {activityType === 'stair_master' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Floors
              </label>
              <input
                type="number"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                placeholder="30"
                min="1"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              />
            </div>
          )}

          {/* Resistance level (elliptical only) */}
          {activityType === 'elliptical' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Resistance Level (1-20)
              </label>
              <input
                type="number"
                value={resistanceLevel}
                onChange={(e) => setResistanceLevel(e.target.value)}
                placeholder="8"
                min="1"
                max="20"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              />
            </div>
          )}

          {/* RPE (effort-based only) */}
          {!isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                RPE (1-10)
              </label>
              <input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="7"
                min="1"
                max="10"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              />
            </div>
          )}

          {/* Calories (effort-based only) */}
          {!isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
                Calories (optional)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="300"
                min="0"
                className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
              />
            </div>
          )}

          {/* Heart rate */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Avg Heart Rate (optional)
            </label>
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="145"
              min="40"
              max="220"
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:border-navy resize-none"
            />
          </div>

          {error && (
            <p className="text-xs text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-border text-sm font-medium text-text-secondary hover:bg-bg-app cursor-pointer bg-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light cursor-pointer border-none disabled:opacity-60"
            >
              {submitting ? 'Logging...' : 'Log Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ManualActivityModal;
