import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { goalsAPI } from '../api/goals';

const DISTANCES = [
  { label: '5K', km: 5.0 },
  { label: '10K', km: 10.0 },
  { label: 'Half Marathon', km: 21.0975 },
  { label: 'Marathon', km: 42.195 },
  { label: 'Custom', km: null },
];

const EditGoal = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm();
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDist, setSelectedDist] = useState(null);
  const [distError, setDistError] = useState('');

  const goalType = watch('goal_type', 'time');

  useEffect(() => {
    const fetchGoal = async () => {
      try {
        const response = await goalsAPI.getGoal(id);
        const goal = response.goal;

        setValue('race_name', goal.race_name);
        setValue('race_date', goal.race_date?.slice(0, 10));
        setValue('goal_type', goal.goal_type || 'time');

        const distKm = (goal.distance_meters || goal.race_distance_meters || 0) / 1000;
        const preset = DISTANCES.find(
          (d) => d.km !== null && Math.abs(d.km - distKm) < 0.1,
        );
        if (preset) {
          setSelectedDist(preset.label);
          setValue('race_distance_km', preset.km);
        } else {
          setSelectedDist('Custom');
          setValue('race_distance_km', distKm);
        }

        if (goal.target_time_seconds) {
          setValue('target_hours', Math.floor(goal.target_time_seconds / 3600));
          setValue('target_minutes', Math.floor((goal.target_time_seconds % 3600) / 60));
          setValue('target_seconds', goal.target_time_seconds % 60);
        }
      } catch (error) {
        setServerError('Failed to load goal');
        console.error('Failed to fetch goal:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGoal();
  }, [id, setValue]);

  const handleDistSelect = (dist) => {
    setSelectedDist(dist.label);
    setDistError('');
    setValue('race_distance_km', dist.km ?? '');
  };

  const onSubmit = async (data) => {
    if (!selectedDist) {
      setDistError('Please select a distance');
      return;
    }
    if (selectedDist === 'Custom' && !parseFloat(data.race_distance_km)) {
      setDistError('Please enter a valid distance');
      return;
    }

    setIsSubmitting(true);
    setServerError('');

    try {
      const goalData = {
        race_name: data.race_name,
        race_date: data.race_date,
        race_distance_km: parseFloat(data.race_distance_km),
        goal_type: data.goal_type,
        target_time_seconds:
          (data.goal_type === 'time' || data.goal_type === 'pr') && data.target_hours
            ? (parseInt(data.target_hours) * 3600)
              + (parseInt(data.target_minutes) * 60)
              + parseInt(data.target_seconds || 0)
            : null,
      };

      await goalsAPI.updateGoal(id, goalData);
      navigate('/goals');
    } catch (err) {
      setServerError(err.response?.data?.error || 'Failed to update goal');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto">
        <div className="card text-center py-12">
          <p className="text-text-secondary">Loading goal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="card">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-text-primary mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
            Edit Goal
          </h1>
          <p className="text-sm text-text-secondary">Update your race details</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {serverError && (
            <div className="alert alert-error mb-6">{serverError}</div>
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
              <p className="text-error text-sm mt-1">{errors.race_name.message}</p>
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
              <p className="text-error text-sm mt-1">{errors.race_date.message}</p>
            )}
          </div>

          {/* Distance */}
          <div className="mb-6">
            <label className="label">Distance</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              {DISTANCES.map((dist) => (
                <button
                  key={dist.label}
                  type="button"
                  className={`rounded-lg border-2 p-3 text-left transition-all cursor-pointer
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
                placeholder="Distance in km"
                {...register('race_distance_km')}
              />
            )}
            {distError && (
              <p className="text-error text-sm mt-1">{distError}</p>
            )}
          </div>

          {/* Goal Type */}
          <div className="mb-6">
            <label className="label">Goal Type</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'time', label: 'Target Time' },
                { value: 'finish', label: 'Just Finish' },
                { value: 'pr', label: 'PR' },
              ].map((opt) => (
                <label key={opt.value} className="cursor-pointer flex items-center gap-2 text-sm">
                  <input type="radio" value={opt.value} {...register('goal_type')} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          {/* Target Time — shown for 'time' and 'pr' */}
          {(goalType === 'time' || goalType === 'pr') && (
            <div className="mb-6">
              <label className="label">
                {goalType === 'pr' ? 'PR to Beat' : 'Target Time'}
              </label>
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
              {goalType === 'pr' && (
                <p className="text-xs text-text-secondary mt-1">
                  Enter the time you're trying to beat
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 mt-4">
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
            <Link to="/goals" className="btn btn-outline flex-1 text-center">
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditGoal;
