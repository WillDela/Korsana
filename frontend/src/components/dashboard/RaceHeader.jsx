import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const RaceHeader = ({ activeGoal, lastSynced, onSync, syncLoading }) => {
  if (!activeGoal) {
    return (
      <div className="w-full bg-white rounded-xl border border-border p-5 flex items-center justify-between">
        <p className="text-sm text-text-secondary">
          Set a race goal to get started
        </p>
        <Link
          to="/goals/new"
          className="btn btn-sm btn-primary no-underline"
        >
          Create Goal
        </Link>
      </div>
    );
  }

  const now = new Date();
  const raceDate = new Date(activeGoal.race_date);
  const createdDate = new Date(activeGoal.created_at || Date.now());
  const diffMs = Math.max(0, raceDate - now);
  const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;

  const totalDuration = raceDate - createdDate;
  const elapsed = now - createdDate;
  const progress = totalDuration > 0
    ? Math.min(100, Math.max(0, (elapsed / totalDuration) * 100))
    : 100;

  const formatSyncTime = (ts) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full bg-white rounded-xl border border-border p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2
            className="text-lg font-bold text-text-primary"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {activeGoal.race_name || 'Upcoming Race'}
          </h2>
          <span
            className="text-sm text-text-secondary"
            style={{ fontFamily: 'var(--font-mono)' }}
          >
            {weeks}w {days}d to go
          </span>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <button
              onClick={onSync}
              disabled={syncLoading}
              className="text-sm font-medium text-navy hover:text-navy-light transition-colors cursor-pointer bg-transparent border-none disabled:opacity-50"
            >
              {syncLoading ? 'Syncing...' : 'Sync'}
            </button>
            <p className="text-xs text-text-muted" style={{ fontFamily: 'var(--font-mono)' }}>
              {formatSyncTime(lastSynced)}
            </p>
          </div>
          <Link
            to="/goals"
            className="text-sm text-text-secondary underline hover:text-navy transition-colors"
          >
            Manage Goals
          </Link>
        </div>
      </div>

      <div className="w-full h-2 rounded-full bg-border-light overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, var(--color-navy), var(--color-coral))',
          }}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
        />
      </div>
    </motion.div>
  );
};

export default RaceHeader;
