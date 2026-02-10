import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { goalsAPI } from '../api/goals';

const CreateGoal = () => {
  const navigate = useNavigate();
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
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
    <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '600px', margin: '0 auto' }}>
        <div className="card">
          <div style={{ marginBottom: '2rem' }}>
            <Link to="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Back to Dashboard
            </Link>
            <h1 className="font-serif" style={{ marginTop: '1rem', marginBottom: '0.5rem' }}>Set Your Race Goal</h1>
            <p style={{ color: 'var(--color-text-secondary)' }}>
              Tell us about the race you're training for
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)}>
            {serverError && (
              <div className="alert alert-error" style={{ marginBottom: '1.5rem' }}>
                {serverError}
              </div>
            )}

            {/* Race Name */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="race_name">Race Name</label>
              <input
                id="race_name"
                type="text"
                className={`input ${errors.race_name ? 'input-error' : ''}`}
                placeholder="Miami Marathon 2026"
                {...register('race_name', { required: 'Race name is required' })}
              />
              {errors.race_name && (
                <p className="text-error" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.race_name.message}
                </p>
              )}
            </div>

            {/* Race Date */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="race_date">Race Date</label>
              <input
                id="race_date"
                type="date"
                className={`input ${errors.race_date ? 'input-error' : ''}`}
                {...register('race_date', { required: 'Race date is required' })}
              />
              {errors.race_date && (
                <p className="text-error" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.race_date.message}
                </p>
              )}
            </div>

            {/* Distance */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label" htmlFor="race_distance_km">Distance</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
                {commonDistances.map((dist) => (
                  <button
                    key={dist.label}
                    type="button"
                    className="btn btn-outline"
                    onClick={() => {
                      const event = { target: { value: dist.value } };
                      register('race_distance_km').onChange(event);
                    }}
                    style={{ padding: '0.75rem' }}
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
                <p className="text-error" style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
                  {errors.race_distance_km.message}
                </p>
              )}
            </div>

            {/* Goal Type */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label className="label">Goal Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="time"
                    {...register('goal_type')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Target Time
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="finish"
                    {...register('goal_type')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  Just Finish
                </label>
                <label style={{ cursor: 'pointer' }}>
                  <input
                    type="radio"
                    value="pr"
                    {...register('goal_type')}
                    style={{ marginRight: '0.5rem' }}
                  />
                  PR
                </label>
              </div>
            </div>

            {/* Target Time (only if goal_type is 'time' or 'pr') */}
            {(goalType === 'time' || goalType === 'pr') && (
              <div style={{ marginBottom: '1.5rem' }}>
                <label className="label">Target Time</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      className="input"
                      placeholder="Hours"
                      {...register('target_hours', { required: 'Required' })}
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      min="0"
                      max="59"
                      className="input"
                      placeholder="Minutes"
                      {...register('target_minutes', { required: 'Required' })}
                    />
                  </div>
                  <div>
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
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '1rem' }}
            >
              {isSubmitting ? 'Creating Goal...' : 'Create Goal'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateGoal;
