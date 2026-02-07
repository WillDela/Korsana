import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { goalsAPI } from '../api/goals';
import { useAuth } from '../context/AuthContext';

const Goals = () => {
  const { user, logout } = useAuth();
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);

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
    if (!window.confirm('Are you sure you want to delete this goal?')) return;
    try {
      setDeletingId(goalId);
      await goalsAPI.deleteGoal(goalId);
      setGoals(goals.filter(g => g.id !== goalId));
    } catch (error) {
      console.error('Failed to delete goal:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

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

  const getDaysUntil = (dateString) => {
    const diff = Math.ceil((new Date(dateString) - new Date()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Past';
    if (diff === 0) return 'Today';
    return `${diff} days`;
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" className="nav-brand">Korsana</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="nav-email" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {user?.email}
          </span>
          <button onClick={() => logout()} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            Log out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div>
            <Link to="/dashboard" style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem', textDecoration: 'none' }}>
              ← Back to Dashboard
            </Link>
            <h1 style={{ marginTop: '0.5rem' }}>Your Goals</h1>
          </div>
          <Link to="/goals/new" className="btn btn-primary">
            New Goal
          </Link>
        </div>

        {loading ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading goals...</p>
          </div>
        ) : goals.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
            <h3 style={{ marginBottom: '0.5rem' }}>No goals yet</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Create your first race goal to start training with purpose.
            </p>
            <Link to="/goals/new" className="btn btn-primary">Create Goal</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {goals.map((goal, i) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="card"
                style={{
                  padding: '1.25rem 1.5rem',
                  borderLeft: goal.is_active ? '4px solid var(--color-primary)' : '4px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1.125rem' }}>{goal.race_name}</h3>
                      {goal.is_active && (
                        <span className="badge badge-success" style={{ fontSize: '0.625rem' }}>Active</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                      <div>
                        <span className="label" style={{ fontSize: '0.6875rem' }}>Date</span>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{formatDate(goal.race_date)}</div>
                      </div>
                      <div>
                        <span className="label" style={{ fontSize: '0.6875rem' }}>Distance</span>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{formatDistance(goal.distance_meters || goal.race_distance_meters)}</div>
                      </div>
                      <div>
                        <span className="label" style={{ fontSize: '0.6875rem' }}>Target</span>
                        <div className="data-value" style={{ fontSize: '0.9375rem' }}>{formatTargetTime(goal.target_time_seconds)}</div>
                      </div>
                      <div>
                        <span className="label" style={{ fontSize: '0.6875rem' }}>Countdown</span>
                        <div style={{ fontSize: '0.9375rem', fontWeight: 500 }}>{getDaysUntil(goal.race_date)}</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Link
                      to={`/goals/${goal.id}/edit`}
                      className="btn btn-outline"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      disabled={deletingId === goal.id}
                      className="btn btn-ghost"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem', color: 'var(--color-error)' }}
                    >
                      {deletingId === goal.id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Goals;
