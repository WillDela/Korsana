import { Link } from 'react-router-dom';
import AnimatedNumber from './AnimatedNumber';

const ActiveGoalBanner = ({ goal, loading, trainingProgress = 0 }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 animate-shimmer" style={{ borderLeft: '4px solid var(--color-navy)', minHeight: '100px' }}>
        <div className="flex items-center gap-3">
          <div className="h-4 w-24 bg-border-light rounded" />
          <div className="h-6 w-48 bg-border-light rounded" />
        </div>
        <div className="flex gap-4 mt-4">
          <div className="h-3 w-20 bg-border-light rounded" />
          <div className="h-3 w-20 bg-border-light rounded" />
          <div className="h-3 w-20 bg-border-light rounded" />
        </div>
      </div>
    );
  }

  if (!goal) {
    return (
      <div className="bg-white rounded-xl border border-border p-6" style={{ borderLeft: '4px solid var(--color-text-muted)' }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">No Active Goal</span>
            <p className="text-sm text-text-secondary mt-1">Set a race goal to unlock personalized training plans and insights.</p>
          </div>
          <Link to="/goals/new" className="btn btn-primary btn-sm shrink-0">
            Set a Goal
          </Link>
        </div>
      </div>
    );
  }

  const raceDate = new Date(goal.race_date);
  const today = new Date();
  const totalDays = Math.max(0, Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24)));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const distanceMiles = goal.distance_meters ? (goal.distance_meters * 0.000621371).toFixed(1) : null;
  const formatTargetTime = () => {
    if (!goal.target_time_seconds) return null;
    const h = Math.floor(goal.target_time_seconds / 3600);
    const m = Math.floor((goal.target_time_seconds % 3600) / 60);
    const s = goal.target_time_seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const raceDateFormatted = raceDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="bg-white rounded-xl border border-border p-5 sm:p-6" style={{ borderLeft: '4px solid var(--color-navy)' }}>
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Left side: Goal info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-sage-light text-sage">Active Goal</span>
            <Link to="/goals" className="text-text-primary font-semibold text-lg hover:text-navy transition-colors no-underline truncate" style={{ fontFamily: 'var(--font-heading)' }}>
              {goal.race_name}
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-text-secondary">
            <span>{raceDateFormatted}</span>
            {distanceMiles && <span>{distanceMiles} mi</span>}
            {formatTargetTime() && <span className="font-mono">{formatTargetTime()}</span>}
          </div>
        </div>

        {/* Right side: Countdown + progress */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-1">Time Remaining</span>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
              <AnimatedNumber value={weeks} />
            </span>
            <span className="text-sm text-text-secondary">wk</span>
            {days > 0 && (
              <>
                <span className="text-2xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
                  <AnimatedNumber value={days} />
                </span>
                <span className="text-sm text-text-secondary">d</span>
              </>
            )}
          </div>
          <div className="w-40 mt-2">
            <div className="w-full h-1.5 bg-border-light rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${trainingProgress}%`,
                  background: 'linear-gradient(90deg, var(--color-navy), var(--color-sage))',
                }}
              />
            </div>
            <span className="text-xs text-text-muted mt-0.5 block text-right">{trainingProgress}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActiveGoalBanner;
