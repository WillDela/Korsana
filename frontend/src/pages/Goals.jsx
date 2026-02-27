import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { goalsAPI } from '../api/goals';

const METERS_PER_MILE = 1609.34;

const formatDate = (dateString) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

const formatDistance = (meters) => {
  const km = meters / 1000;
  if (Math.abs(km - 42.195) < 0.5) return 'Marathon';
  if (Math.abs(km - 21.0975) < 0.3) return 'Half Marathon';
  if (Math.abs(km - 10) < 0.2) return '10K';
  if (Math.abs(km - 5) < 0.2) return '5K';
  return `${km.toFixed(1)} km`;
};

const formatTargetTime = (seconds) => {
  if (!seconds) return 'Just finish';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const derivePace = (targetSeconds, distanceMeters) => {
  if (!targetSeconds || !distanceMeters) return null;
  const miles = distanceMeters / METERS_PER_MILE;
  const paceSeconds = targetSeconds / miles;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.floor(paceSeconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}/mi`;
};

const getCountdown = (dateString) => {
  const diff = Math.ceil(
    (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24)
  );
  if (diff < 0) return 'Past';
  if (diff === 0) return 'Race day!';
  const weeks = Math.floor(diff / 7);
  const days = diff % 7;
  if (weeks > 0 && days > 0) return `${weeks}w ${days}d`;
  if (weeks > 0) return `${weeks}w`;
  return `${days}d`;
};

const getWeeksUntil = (dateString) => {
  const diff = Math.ceil(
    (new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24)
  );
  return Math.max(0, Math.ceil(diff / 7));
};

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [settingActiveId, setSettingActiveId] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [completedOpen, setCompletedOpen] = useState(false);

  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getGoals();
      setGoals(response.goals || []);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (goalId) => {
    if (!window.confirm('Delete this goal?')) return;
    try {
      setDeletingId(goalId);
      setOpenMenuId(null);
      await goalsAPI.deleteGoal(goalId);
      setGoals((prev) => prev.filter((g) => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetActive = async (goalId) => {
    try {
      setSettingActiveId(goalId);
      await goalsAPI.setActive(goalId);
      await fetchGoals();
    } catch (error) {
      console.error('Failed to set active:', error);
    } finally {
      setSettingActiveId(null);
    }
  };

  const handleDeactivate = async (goalId) => {
    try {
      await goalsAPI.updateGoal(goalId, { is_active: false });
      await fetchGoals();
    } catch (error) {
      console.error('Failed to deactivate:', error);
    }
  };

  const { active, upcoming, completed } = useMemo(() => {
    const now = new Date();
    const today = new Date(
      now.getFullYear(), now.getMonth(), now.getDate()
    );
    let activeGoal = null;
    const up = [];
    const done = [];

    goals.forEach((g) => {
      if (g.is_active) {
        activeGoal = g;
      } else if (new Date(g.race_date) > today) {
        up.push(g);
      } else {
        done.push(g);
      }
    });

    return { active: activeGoal, upcoming: up, completed: done };
  }, [goals]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-12">
          <p className="text-text-secondary">Loading goals...</p>
        </div>
      </div>
    );
  }

  if (goals.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="card text-center py-16 px-8">
          <div className="text-4xl mb-4">🏁</div>
          <h2
            className="text-xl font-bold text-text-primary mb-2"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Create your first race goal
          </h2>
          <p className="text-sm text-text-secondary mb-6 max-w-md mx-auto">
            Set a race goal to unlock your personalized training
            dashboard, AI coaching, and readiness tracking.
          </p>
          <Link to="/goals/new" className="btn btn-primary">
            Create Goal
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Page Header */}
      <div className="flex justify-between items-center mb-6">
        <h1
          className="text-2xl font-bold text-text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Goals
        </h1>
        <Link to="/goals/new" className="btn btn-primary btn-sm">
          + New Goal
        </Link>
      </div>

      {/* Active Goal Hero */}
      {active && (
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="card p-6 mb-6 border-l-4 border-navy"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-navy">
                Active Goal
              </span>
              <h2
                className="text-2xl font-bold text-text-primary mt-1"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                {active.race_name}
              </h2>
            </div>
            <span
              className="text-lg font-semibold text-text-primary shrink-0"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {getCountdown(active.race_date)}
            </span>
          </div>

          <div className="flex flex-wrap gap-6 mb-4">
            <div>
              <span className="text-xs text-text-muted">Date</span>
              <div className="text-sm font-medium text-text-primary">
                {formatDate(active.race_date)}
              </div>
            </div>
            <div>
              <span className="text-xs text-text-muted">Distance</span>
              <div className="text-sm font-medium text-text-primary">
                {formatDistance(
                  active.distance_meters || active.race_distance_meters
                )}
              </div>
            </div>
            <div>
              <span className="text-xs text-text-muted">Target</span>
              <div
                className="text-sm font-medium font-mono text-text-primary"
              >
                {formatTargetTime(active.target_time_seconds)}
              </div>
            </div>
            {derivePace(
              active.target_time_seconds,
              active.distance_meters || active.race_distance_meters
            ) && (
              <div>
                <span className="text-xs text-text-muted">Pace</span>
                <div
                  className="text-sm font-medium font-mono text-text-primary"
                >
                  {derivePace(
                    active.target_time_seconds,
                    active.distance_meters ||
                      active.race_distance_meters
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Link
              to={`/goals/${active.id}/edit`}
              className="btn btn-outline btn-sm"
            >
              Edit
            </Link>
            <button
              onClick={() => handleDeactivate(active.id)}
              className="btn btn-ghost btn-sm text-text-secondary"
            >
              Deactivate
            </button>
          </div>
        </motion.section>
      )}

      {/* Upcoming Goals */}
      {upcoming.length > 0 && (
        <section className="mb-6">
          <h3
            className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Upcoming
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcoming.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="card p-5 relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="text-base font-semibold text-text-primary">
                    {goal.race_name}
                  </h4>
                  {/* Overflow menu */}
                  <div className="relative">
                    <button
                      onClick={() =>
                        setOpenMenuId(
                          openMenuId === goal.id ? null : goal.id
                        )
                      }
                      className="p-1 rounded hover:bg-bg-app cursor-pointer bg-transparent border-none text-text-muted"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <circle cx="12" cy="5" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="19" r="2" />
                      </svg>
                    </button>
                    {openMenuId === goal.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-border z-20 py-1">
                          <Link
                            to={`/goals/${goal.id}/edit`}
                            className="block px-3 py-2 text-sm text-text-primary hover:bg-bg-app no-underline"
                          >
                            Edit
                          </Link>
                          <button
                            onClick={() => handleDelete(goal.id)}
                            disabled={deletingId === goal.id}
                            className="w-full text-left px-3 py-2 text-sm text-error hover:bg-bg-app cursor-pointer bg-transparent border-none"
                          >
                            {deletingId === goal.id
                              ? 'Deleting...'
                              : 'Delete'}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-text-secondary mb-3">
                  <span>{formatDate(goal.race_date)}</span>
                  <span>
                    {formatDistance(
                      goal.distance_meters || goal.race_distance_meters
                    )}
                  </span>
                  <span className="font-mono">
                    {formatTargetTime(goal.target_time_seconds)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-text-muted font-mono">
                    {getWeeksUntil(goal.race_date)} weeks out
                  </span>
                  <button
                    onClick={() => handleSetActive(goal.id)}
                    disabled={settingActiveId === goal.id}
                    className="btn btn-sm btn-secondary"
                  >
                    {settingActiveId === goal.id
                      ? 'Setting...'
                      : 'Set as Active'}
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Completed Goals */}
      {completed.length > 0 && (
        <section>
          <button
            onClick={() => setCompletedOpen((v) => !v)}
            className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted mb-3 cursor-pointer bg-transparent border-none hover:text-navy transition-colors"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            Completed ({completed.length})
            <svg
              className="w-3.5 h-3.5 transition-transform"
              style={{
                transform: completedOpen
                  ? 'rotate(180deg)'
                  : 'rotate(0deg)',
              }}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          <AnimatePresence>
            {completedOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden space-y-3"
              >
                {completed.map((goal) => (
                  <div
                    key={goal.id}
                    className="card p-4 opacity-70"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-text-secondary">
                          {goal.race_name}
                        </h4>
                        <div className="flex gap-3 text-xs text-text-muted mt-1">
                          <span>
                            {formatDistance(
                              goal.distance_meters ||
                                goal.race_distance_meters
                            )}
                          </span>
                          <span className="font-mono">
                            {formatTargetTime(
                              goal.target_time_seconds
                            )}
                          </span>
                          <span>
                            {formatDate(goal.race_date)}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Link
                          to={`/goals/${goal.id}/edit`}
                          className="text-xs text-text-muted hover:text-navy no-underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(goal.id)}
                          disabled={deletingId === goal.id}
                          className="text-xs text-text-muted hover:text-error cursor-pointer bg-transparent border-none"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </section>
      )}
    </div>
  );
};

export default Goals;
