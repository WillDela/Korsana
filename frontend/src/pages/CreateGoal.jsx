import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { goalsAPI } from '../api/goals';

const CreateGoal = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goalType = watch('goal_type', 'time');

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setServerError('');

    try {
      const goalData = {
        race_name: data.race_name,
        race_date: data.race_date,
        race_distance_km: parseFloat(data.race_distance_km),
        goal_type: data.goal_type,
        target_time_seconds: data.goal_type === 'time' && data.target_hours
          ? (parseInt(data.target_hours) * 3600) + (parseInt(data.target_minutes) * 60) + parseInt(data.target_seconds || 0)
          : null,
      };

      await goalsAPI.createGoal(goalData);
      navigate('/dashboard');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to create goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  const commonDistances = [
    { label: '5K', value: 5 },
    { label: '10K', value: 10 },
    { label: 'Half Marathon', value: 21.0975 },
    { label: 'Marathon', value: 42.195 },
  ];

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="card">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1" style={{ fontFamily: 'var(--font-heading)' }}>Set Your Race Goal</h1>
          <p className="text-sm text-text-secondary">
            Tell us about the race you're training for
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="alert alert-error mb-6">
              {serverError}
            </div>
          )}

          {/* Race Name */}
          <div className="mb-6">
            <label className="label" htmlFor="race_name">Race Name</label>
            <input
              id="race_name"
              type="text"
              className={`input ${errors.race_name ? 'input-error' : ''}`}
              placeholder="Miami Marathon 2026"
              {...register('race_name', { required: 'Race name is required' })}
            />
            {errors.race_name && (
              <p className="text-error text-sm mt-1">
                {errors.race_name.message}
              </p>
            )}
          </div>

          {/* Race Date */}
          <div className="mb-6">
            <label className="label" htmlFor="race_date">Race Date</label>
            <input
              id="race_date"
              type="date"
              className={`input ${errors.race_date ? 'input-error' : ''}`}
              {...register('race_date', { required: 'Race date is required' })}
            />
            {errors.race_date && (
              <p className="text-error text-sm mt-1">
                {errors.race_date.message}
              </p>
            )}
          </div>

          {/* Distance */}
          <div className="mb-6">
            <label className="label" htmlFor="race_distance_km">Distance</label>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {commonDistances.map((dist) => (
                <button
                  key={dist.label}
                  type="button"
                  className="btn btn-outline py-3"
                  onClick={() => setValue('race_distance_km', dist.value)}
                >
                  {dist.label}
                </button>
              ))}
            </div>
            <input
              id="race_distance_km"
              type="number"
              step="0.1"
              className={`input ${errors.race_distance_km ? 'input-error' : ''}`}
              placeholder="Custom distance (km)"
              {...register('race_distance_km', {
                required: 'Distance is required',
                min: { value: 1, message: 'Distance must be at least 1km' },
              })}
            />
            {errors.race_distance_km && (
              <p className="text-error text-sm mt-1">
                {errors.race_distance_km.message}
              </p>
            )}
          </div>

          {/* Goal Type */}
          <div className="mb-6">
            <label className="label">Goal Type</label>
            <div className="grid grid-cols-3 gap-2">
              <label className="cursor-pointer flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="time"
                  {...register('goal_type')}
                />
                Target Time
              </label>
              <label className="cursor-pointer flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="finish"
                  {...register('goal_type')}
                />
                Just Finish
              </label>
              <label className="cursor-pointer flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  value="pr"
                  {...register('goal_type')}
                />
                PR
              </label>
            </div>
          </div>

          {/* Target Time */}
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
                  {...register('target_hours', { required: 'Required' })}
                />
                <input
                  type="number"
                  min="0"
                  max="59"
                  className="input"
                  placeholder="Minutes"
                  {...register('target_minutes', { required: 'Required' })}
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
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating Goal...' : 'Create Goal'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGoal;
