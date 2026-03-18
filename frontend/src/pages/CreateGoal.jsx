import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { goalsAPI } from '../api/goals';
import { useUnits } from '../context/UnitsContext';
import { distanceLabel, toMeters } from '../utils/units';

const DISTANCES = [
  { label: '5K', km: 5.0 },
  { label: '10K', km: 10.0 },
  { label: 'Half Marathon', km: 21.1 },
  { label: 'Marathon', km: 42.2 },
  { label: 'Custom', km: null },
];

function formatPaceLocal(totalSeconds, distanceKm, unit) {
  if (unit === 'imperial') {
    const miles = distanceKm / 1.60934;
    const secsPerMile = totalSeconds / miles;
    const mins = Math.floor(secsPerMile / 60);
    const secs = Math.round(secsPerMile % 60);
    return `${mins}:${String(secs).padStart(2, '0')}/mi`;
  }
  const secsPerKm = totalSeconds / distanceKm;
  const mins = Math.floor(secsPerKm / 60);
  const secs = Math.round(secsPerKm % 60);
  return `${mins}:${String(secs).padStart(2, '0')}/km`;
}

function weeksUntil(dateStr) {
  const diff = new Date(dateStr) - new Date();
  return Math.max(0, Math.round(diff / (7 * 24 * 60 * 60 * 1000)));
}

function formatTime(h, m, s) {
  const parts = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0) parts.push(`${s}s`);
  return parts.join(' ') || '0m';
}

const CreateGoal = () => {
  const navigate = useNavigate();
  const { unit } = useUnits();
  const {
    register, handleSubmit, watch, setValue,
    formState: { errors },
  } = useForm();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('form');
  const [selectedDist, setSelectedDist] = useState(null);
  const [distError, setDistError] = useState('');
  const [formSnapshot, setFormSnapshot] = useState(null);

  const goalType = watch('goal_type', 'time');

  const buildGoalData = (data) => {
    const preset = DISTANCES.find(d => d.label === selectedDist);
    const distKm = preset?.km !== null && preset?.km !== undefined
      ? preset.km
      : parseFloat(data.race_distance_km);
    return {
      race_name: data.race_name,
      race_date: data.race_date,
      race_distance_km: distKm,
      goal_type: data.goal_type,
      target_time_seconds:
        (data.goal_type === 'time' || data.goal_type === 'pr') && data.target_hours
          ? (parseInt(data.target_hours) * 3600)
            + (parseInt(data.target_minutes) * 60)
            + parseInt(data.target_seconds || 0)
          : null,
    };
  };

  const onReview = (data) => {
    if (!selectedDist) {
      setDistError('Please select a distance');
      return;
    }
    if (selectedDist === 'Custom' && !parseFloat(data.race_distance_km)) {
      setDistError('Please enter a valid distance');
      return;
    }
    setDistError('');
    setFormSnapshot(buildGoalData(data));
    setStep('confirm');
  };

  const onConfirm = async () => {
    setIsSubmitting(true);
    setServerError('');
    try {
      await goalsAPI.createGoal(formSnapshot);
      navigate('/dashboard');
    } catch (err) {
      setServerError(
        err.response?.data?.error || 'Failed to create goal'
      );
      setStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDistSelect = (dist) => {
    setSelectedDist(dist.label);
    setDistError('');
    setValue('race_distance_km', dist.km ?? '');
  };

  if (step === 'confirm' && formSnapshot) {
    const distLabel = DISTANCES.find(
      (d) => d.km === formSnapshot.race_distance_km
    )?.label || `${formSnapshot.race_distance_km} km`;
    const weeks = weeksUntil(formSnapshot.race_date);
    const hasTime = formSnapshot.target_time_seconds > 0;

    return (
      <div className="max-w-[600px] mx-auto">
        <div className="card">
          <h1
            className="text-2xl font-semibold text-text-primary mb-1
              font-heading"
          >
            Confirm Your Goal
          </h1>
          <p className="text-sm text-text-secondary mb-6">
            Review the details before creating
          </p>

          {serverError && (
            <div className="alert alert-error mb-6">{serverError}</div>
          )}

          <div className="space-y-4 mb-8">
            <ConfirmRow
              label="Race"
              value={formSnapshot.race_name}
            />
            <ConfirmRow
              label="Date"
              value={new Date(
                formSnapshot.race_date
              ).toLocaleDateString('en-US', {
                month: 'long', day: 'numeric', year: 'numeric',
              })}
            />
            <ConfirmRow label="Distance" value={distLabel} />
            <ConfirmRow
              label="Goal Type"
              value={formSnapshot.goal_type === 'time'
                ? 'Target Time'
                : formSnapshot.goal_type === 'pr'
                  ? 'PR'
                  : 'Just Finish'}
            />
            {hasTime && (
              <>
                <ConfirmRow
                  label="Target Time"
                  value={formatTime(
                    Math.floor(formSnapshot.target_time_seconds / 3600),
                    Math.floor(
                      (formSnapshot.target_time_seconds % 3600) / 60
                    ),
                    formSnapshot.target_time_seconds % 60,
                  )}
                />
                <ConfirmRow
                  label="Implied Pace"
                  value={formatPaceLocal(
                    formSnapshot.target_time_seconds,
                    formSnapshot.race_distance_km,
                    unit,
                  )}
                />
              </>
            )}
            <ConfirmRow
              label="Weeks of Training"
              value={`${weeks} week${weeks !== 1 ? 's' : ''}`}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
              onClick={onConfirm}
            >
              {isSubmitting ? 'Creating...' : 'Confirm & Create'}
            </button>
            <button
              type="button"
              className="btn btn-outline flex-1"
              onClick={() => setStep('form')}
            >
              Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="card">
        <div className="mb-8">
          <h1
            className="text-2xl font-semibold text-text-primary mb-1
              font-heading"
          >
            Set Your Race Goal
          </h1>
          <p className="text-sm text-text-secondary">
            Tell us about the race you're training for
          </p>
        </div>

        <form onSubmit={handleSubmit(onReview)}>
          {serverError && (
            <div className="alert alert-error mb-6">
              {serverError}
            </div>
          )}

          <div className="mb-6">
            <label className="label" htmlFor="race_name">
              Race Name
            </label>
            <input
              id="race_name"
              type="text"
              className={`input ${errors.race_name ? 'input-error' : ''}`}
              placeholder="Miami Marathon 2026"
              {...register('race_name', {
                required: 'Race name is required',
              })}
            />
            {errors.race_name && (
              <p className="text-error text-sm mt-1">
                {errors.race_name.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="label" htmlFor="race_date">
              Race Date
            </label>
            <input
              id="race_date"
              type="date"
              className={`input ${errors.race_date ? 'input-error' : ''}`}
              {...register('race_date', {
                required: 'Race date is required',
              })}
            />
            {errors.race_date && (
              <p className="text-error text-sm mt-1">
                {errors.race_date.message}
              </p>
            )}
          </div>

          <div className="mb-6">
            <label className="label">Distance</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {DISTANCES.map((dist) => (
                <button
                  key={dist.label}
                  type="button"
                  className={`rounded-lg border-2 p-3 text-left
                    transition-all cursor-pointer
                    ${selectedDist === dist.label
                      ? 'ring-2 ring-navy bg-navy/5 border-navy'
                      : 'border-border hover:border-navy/30'
                    }`}
                  onClick={() => handleDistSelect(dist)}
                >
                  <span className="block font-semibold text-text-primary font-heading">
                    {dist.label}
                  </span>
                  {dist.km !== null && (
                    <span className="block text-xs text-text-secondary mt-0.5">
                      {dist.km} km
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedDist === 'Custom' && (
              <input
                id="race_distance_km"
                type="number"
                step="0.1"
                className="input"
                placeholder={`Distance in ${distanceLabel(unit)}`}
                {...register('race_distance_km')}
              />
            )}
            {distError && (
              <p className="text-error text-sm mt-1">{distError}</p>
            )}
          </div>

          <div className="mb-6">
            <label className="label">Goal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'time', label: 'Target Time' },
                { value: 'finish', label: 'Just Finish' },
                { value: 'pr', label: 'PR' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className="cursor-pointer flex items-center gap-2
                    text-sm"
                >
                  <input
                    type="radio"
                    value={opt.value}
                    {...register('goal_type')}
                  />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {(goalType === 'time' || goalType === 'pr') && (
            <div className="mb-6">
              <label className="label">Target Time</label>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  min="0"
                  max="23"
                  className="input"
                  placeholder="Hours"
                  {...register('target_hours', {
                    required: 'Required',
                  })}
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  className="input"
                  placeholder="Minutes"
                  {...register('target_minutes', {
                    required: 'Required',
                  })}
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  className="input"
                  placeholder="Seconds"
                  {...register('target_seconds')}
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary w-full mt-4"
          >
            Review Goal
          </button>
        </form>
      </div>
    </div>
  );
};

const ConfirmRow = ({ label, value }) => (
  <div className="flex justify-between items-baseline py-2
    border-b border-border-light last:border-0"
  >
    <span className="text-sm text-text-secondary">{label}</span>
    <span className="text-sm font-semibold text-text-primary font-heading">
      {value}
    </span>
  </div>
);

export default CreateGoal;
