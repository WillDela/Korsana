import { useState } from 'react';
import { ACTIVITY_CONFIGS } from '../constants/activityTypes';
import { activitiesAPI } from '../api/activities';
import { calendarAPI } from '../api/calendar';
import { useUnits } from '../context/UnitsContext';
import { distanceLabel, toMeters } from '../utils/units';

const ACTIVITY_TO_WORKOUT_TYPE = {
  run: 'easy',
  cycling: 'cycling',
  swimming: 'swimming',
  rowing: 'cross_train',
  walking: 'walking',
  hiking: 'easy',
  weight_lifting: 'lifting',
  elliptical: 'cross_train',
  stair_master: 'cross_train',
  workout: 'cross_train',
  recovery: 'recovery',
};

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

      // Also create a calendar entry so it shows in This Week's Plan and Training Calendar
      try {
        await calendarAPI.createEntry({
          date,
          workout_type: ACTIVITY_TO_WORKOUT_TYPE[activityType] || 'cross_train',
          title: name || config.label,
          description: notes.trim() || null,
          planned_distance_meters: payload.distance_meters || null,
          planned_duration_minutes: durationMinutes ? parseInt(durationMinutes) : null,
          status: 'completed',
          source: 'manual',
          activity_id: result.activity?.id || null,
        });
      } catch {
        // Calendar entry creation is best-effort; don't block the activity log
      }

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 py-8 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl border-2 border-border w-full max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full pb-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border" style={{ padding: '28px 40px' }}>
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

        <form onSubmit={handleSubmit} className="space-y-6" style={{ padding: '28px 40px' }}>
          {/* Activity type picker */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(ACTIVITY_CONFIGS).map(([type, cfg]) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setActivityType(type)}
                  style={{ padding: '12px 16px', gap: '12px' }}
                  className={`flex items-center rounded-xl border text-sm font-medium cursor-pointer transition-all ${
                    activityType === type
                      ? 'border-navy bg-navy text-white shadow-sm'
                      : 'border-border bg-white text-text-secondary hover:bg-bg-app hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl flex-shrink-0">{cfg.icon}</span>
                  <span className="leading-none whitespace-nowrap">{cfg.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Name (optional)
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={config.label}
              className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
            />
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              required
            />
          </div>

          {/* Duration */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Duration (minutes)
            </label>
            <input
              type="number"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(e.target.value)}
              placeholder="45"
              min="1"
              className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              required
            />
          </div>

          {/* Distance (distance-based only) */}
          {isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Distance ({distanceLabel(unit)})
              </label>
              <input
                type="number"
                value={distanceMiles}
                onChange={(e) => setDistanceMiles(e.target.value)}
                placeholder="3.1"
                min="0"
                step="0.01"
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              />
            </div>
          )}

          {/* Muscle group (strength only) */}
          {activityType === 'weight_lifting' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Muscle Group
              </label>
              <select
                value={muscleGroup}
                onChange={(e) => setMuscleGroup(e.target.value)}
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy bg-white" style={{ padding: '12px 16px' }}
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
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Floors
              </label>
              <input
                type="number"
                value={floors}
                onChange={(e) => setFloors(e.target.value)}
                placeholder="30"
                min="1"
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              />
            </div>
          )}

          {/* Resistance level (elliptical only) */}
          {activityType === 'elliptical' && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Resistance Level (1-20)
              </label>
              <input
                type="number"
                value={resistanceLevel}
                onChange={(e) => setResistanceLevel(e.target.value)}
                placeholder="8"
                min="1"
                max="20"
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              />
            </div>
          )}

          {/* RPE (effort-based only) */}
          {!isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                RPE (1-10)
              </label>
              <input
                type="number"
                value={rpe}
                onChange={(e) => setRpe(e.target.value)}
                placeholder="7"
                min="1"
                max="10"
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              />
            </div>
          )}

          {/* Calories (effort-based only) */}
          {!isDistanceBased && (
            <div>
              <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                Calories (optional)
              </label>
              <input
                type="number"
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
                placeholder="300"
                min="0"
                className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
              />
            </div>
          )}

          {/* Heart rate */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Avg Heart Rate (optional)
            </label>
            <input
              type="number"
              value={heartRate}
              onChange={(e) => setHeartRate(e.target.value)}
              placeholder="145"
              min="40"
              max="220"
              className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy" style={{ padding: '12px 16px' }}
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="How did it go?"
              rows={2}
              className="w-full rounded-xl border border-border text-sm text-text-primary focus:outline-none focus:border-navy resize-none" style={{ padding: '12px 16px' }}
            />
          </div>

          {error && (
            <p className="text-xs text-error">{error}</p>
          )}

          <div className="flex gap-3 pt-6 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-border text-sm font-semibold text-text-secondary hover:bg-bg-app cursor-pointer bg-transparent" style={{ padding: '14px 16px' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-xl bg-navy text-white text-sm font-semibold hover:bg-navy-light cursor-pointer border-none disabled:opacity-60" style={{ padding: '14px 16px' }}
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
