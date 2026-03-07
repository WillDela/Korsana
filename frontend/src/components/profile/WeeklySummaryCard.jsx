import { motion } from 'framer-motion';
import { useUnits } from '../../context/UnitsContext';
import { formatDistance } from '../../utils/units';

const WeeklySummaryCard = ({ profileData }) => {
  const { unit } = useUnits();
  const goalMeters = profileData?.profile?.weekly_distance_goal_meters || 0;
  const weeklyMeters = profileData?.weekly_summary?.total_distance_meters || 0;
  const weeklySeconds = profileData?.weekly_summary?.total_duration_seconds || 0;
  const durationHours = Math.floor(weeklySeconds / 3600);
  const durationMins = Math.floor((weeklySeconds % 3600) / 60);

  const percentage = goalMeters > 0 ? Math.min((weeklyMeters / goalMeters) * 100, 100) : 0;
  const goalDisplay = formatDistance(goalMeters, unit);
  const currentDisplay = formatDistance(weeklyMeters, unit);

  return (
    <div className="card h-full flex flex-col justify-between">
      <div>
        <div className="flex flex-col mb-6">
          <div className="flex items-center gap-2 mb-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-navy)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
            </svg>
            <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-heading)' }}>Weekly Goal</h2>
          </div>
          <p className="text-sm text-text-secondary">Your target distance</p>
        </div>

        <div className="flex items-end gap-1 mb-2">
          <span className="text-4xl font-bold tracking-tight text-navy">{goalDisplay}</span>
          <span className="text-base font-semibold text-text-muted mb-1">goal</span>
        </div>
        {weeklySeconds > 0 && (
          <p className="text-sm text-text-secondary">
            {durationHours > 0 ? `${durationHours}h ` : ''}{durationMins}m this week
          </p>
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
        {goalMeters === 0 && (
          <p className="text-xs text-text-muted mt-3">
            Set a weekly distance goal in your profile edit menu.
          </p>
        )}
      </div>
    </div>
  );
};

export default WeeklySummaryCard;
