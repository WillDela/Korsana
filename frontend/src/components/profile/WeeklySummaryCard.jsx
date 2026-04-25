import { useState } from 'react';
import { motion } from 'framer-motion';
import { useUnits } from '../../context/UnitsContext';
import { formatDistance, toMeters, distanceLabel } from '../../utils/units';
import { userProfileAPI } from '../../api/userProfile';

const METERS_PER_MILE = 1609.34;

const WeeklySummaryCard = ({ profileData, onUpdate }) => {
  const { unit } = useUnits();
  const [editing, setEditing]   = useState(false);
  const [inputVal, setInputVal] = useState('');
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState('');

  const goalMeters   = profileData?.profile?.weekly_distance_goal_meters || 0;
  const weeklyMeters = profileData?.weekly_summary?.total_distance_meters || 0;
  const weeklySeconds = profileData?.weekly_summary?.total_duration_seconds || 0;
  const durationHours = Math.floor(weeklySeconds / 3600);
  const durationMins  = Math.floor((weeklySeconds % 3600) / 60);

  const percentage     = goalMeters > 0 ? Math.min((weeklyMeters / goalMeters) * 100, 100) : 0;
  const goalDisplay    = formatDistance(goalMeters, unit);
  const currentDisplay = formatDistance(weeklyMeters, unit);
  const unitLabel      = distanceLabel(unit);

  const openEdit = () => {
    const current = unit === 'imperial'
      ? (goalMeters / METERS_PER_MILE).toFixed(1)
      : (goalMeters / 1000).toFixed(1);
    setInputVal(goalMeters > 0 ? current : '');
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    const parsed = parseFloat(inputVal);
    if (isNaN(parsed) || parsed <= 0) {
      setEditing(false);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await userProfileAPI.updateProfile({
        weekly_distance_goal_meters: Math.round(toMeters(parsed, unit)),
      });
      await onUpdate?.();
      setEditing(false);
    } catch {
      setError('Failed to save. Try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') setEditing(false);
  };

  return (
    <div className="card h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Weekly Goal</h2>
            {!editing && (
              <button
                onClick={openEdit}
                title="Edit weekly goal"
                className="ml-auto text-text-muted hover:text-navy transition-colors"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </button>
            )}
          </div>
          <p className="text-sm text-text-secondary">Your target distance</p>
        </div>

        {editing ? (
          <div className="mb-2">
            <div className="flex items-center gap-2">
              <input
                type="number"
                step="0.1"
                min="0"
                autoFocus
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                onKeyDown={handleKeyDown}
                className="input w-28 text-lg font-bold"
                placeholder={`e.g. ${unit === 'imperial' ? '30' : '50'}`}
              />
              <span className="text-sm font-semibold text-text-muted">{unitLabel} / week</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary text-sm px-4 py-1.5"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
              <button
                onClick={() => setEditing(false)}
                className="btn text-sm px-4 py-1.5 bg-transparent border border-border text-text-secondary hover:bg-surface-alt"
              >
                Cancel
              </button>
            </div>
            {error && <p className="text-xs text-error mt-2">{error}</p>}
          </div>
        ) : (
          <>
            <div className="flex items-end gap-1 mb-2">
              <span className="text-4xl font-bold tracking-tight text-navy">{goalDisplay}</span>
              <span className="text-base font-semibold text-text-muted mb-1">goal</span>
            </div>
            {weeklySeconds > 0 && (
              <p className="text-sm text-text-secondary">
                {durationHours > 0 ? `${durationHours}h ` : ''}{durationMins}m this week
              </p>
            )}
          </>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between text-xs font-semibold text-text-muted mb-2 uppercase tracking-wide">
          <span>{currentDisplay}</span>
          <span>{percentage.toFixed(0)}%</span>
        </div>
        <div className="h-3 w-full bg-border-light rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full bg-navy rounded-full"
          />
        </div>
        {goalMeters === 0 && !editing && (
          <button
            onClick={openEdit}
            className="text-xs text-navy font-medium mt-3 hover:underline"
          >
            + Set a weekly distance goal
          </button>
        )}
      </div>
    </div>
  );
};

export default WeeklySummaryCard;
