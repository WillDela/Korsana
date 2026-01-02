import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Mock data for demo - replace with real data later
  const raceData = {
    name: 'Miami Marathon',
    date: 'February 2026',
    weeksOut: 16,
    daysOut: 2,
    progress: 35,
    targetPace: '8:35',
    currentPace: '8:47',
    weeklyMileage: { actual: 42, planned: 45 },
  };

  const recentRuns = [
    { date: 'Jan 02', day: 'Thu', distance: '8.2', pace: '8:42', type: 'Easy', status: 'on-pace' },
    { date: 'Jan 01', day: 'Wed', distance: '5.0', pace: '8:30', type: 'Recovery', status: 'on-pace' },
    { date: 'Dec 31', day: 'Tue', distance: '0', pace: '-', type: 'Rest', status: 'rest' },
    { date: 'Dec 30', day: 'Mon', distance: '13.1', pace: '9:15', type: 'Long Run', status: 'on-pace' },
  ];

  useEffect(() => {
    if (searchParams.get('strava_connected') === 'true') {
      setIsConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [searchParams]);

  const handleConnectStrava = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/strava/auth');
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Failed to start Strava auth:', error);
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* Navigation */}
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" className="nav-brand">AllInRun</Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
            {user?.email}
          </span>
          <button onClick={handleLogout} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            Log out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Race Header - Always Visible */}
        <div className="race-header" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="race-name">UPCOMING RACE</div>
              <div className="race-countdown">
                {raceData.name} — {raceData.weeksOut} weeks, {raceData.daysOut} days
              </div>
            </div>

            {/* Strava Status */}
            {isConnected ? (
              <span className="badge badge-success">
                ✓ Strava Connected
              </span>
            ) : (
              <button
                onClick={handleConnectStrava}
                disabled={isLoading}
                className="btn btn-strava"
              >
                {isLoading ? 'Connecting...' : 'Connect Strava'}
              </button>
            )}
          </div>

          <div style={{ marginTop: '1rem' }}>
            <div className="progress-bar" style={{ height: '6px' }}>
              <div className="progress-bar-fill" style={{ width: `${raceData.progress}%` }}></div>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginTop: '0.5rem',
              fontSize: '0.75rem',
              opacity: 0.7
            }}>
              <span>Training started</span>
              <span>{raceData.progress}% complete</span>
              <span>Race day</span>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
          {/* Left Column - Main Content */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Key Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div className="metric-card">
                <div className="label">This Week</div>
                <div className="data-value-lg" style={{ marginTop: '0.5rem' }}>
                  {raceData.weeklyMileage.actual}<span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>mi</span>
                </div>
                <div className="metric-context">
                  of {raceData.weeklyMileage.planned} mi planned ({Math.round(raceData.weeklyMileage.actual / raceData.weeklyMileage.planned * 100)}%)
                </div>
              </div>

              <div className="metric-card">
                <div className="label">Current Pace</div>
                <div className="data-value-lg" style={{ marginTop: '0.5rem' }}>
                  {raceData.currentPace}
                </div>
                <div className="metric-context">
                  <span className="metric-negative">+12s</span> from goal
                </div>
              </div>

              <div className="metric-card">
                <div className="label">Goal Pace</div>
                <div className="data-value-lg" style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>
                  {raceData.targetPace}
                </div>
                <div className="metric-context">
                  min/mile for 3:45:00
                </div>
              </div>
            </div>

            {/* Recent Runs Table */}
            <div className="card" style={{ padding: 0 }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '1rem' }}>Recent Runs</h3>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Distance</th>
                    <th>Pace</th>
                    <th>Type</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {recentRuns.map((run, i) => (
                    <tr key={i}>
                      <td>
                        <span style={{ fontWeight: 500 }}>{run.date}</span>
                        <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>{run.day}</span>
                      </td>
                      <td className="data-cell">
                        {run.distance !== '0' ? `${run.distance} mi` : '—'}
                      </td>
                      <td className="data-cell">{run.pace}</td>
                      <td>{run.type}</td>
                      <td style={{ textAlign: 'right' }}>
                        {run.status === 'on-pace' && (
                          <span style={{ color: 'var(--color-success)' }}>✓</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Today's Plan */}
            <div className="card">
              <div className="label" style={{ marginBottom: '0.75rem' }}>Today's Plan</div>
              <div style={{
                padding: '1rem',
                background: 'var(--color-bg-secondary)',
                borderRadius: '0.375rem',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                  Easy Run
                </div>
                <div className="data-value" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
                  6 mi
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                  @ easy pace (9:00-9:30)
                </div>
              </div>
            </div>

            {/* Coach Insight */}
            <div className="card" style={{ padding: '1rem' }}>
              <div className="coach-insight" style={{ margin: 0, padding: 0, border: 0, background: 'transparent' }}>
                <div className="coach-label">
                  <span>💬</span> Coach Insight
                </div>
                <p style={{ fontSize: '0.9375rem' }}>
                  "Your mileage is solid this week. Don't skip tomorrow's rest day—recovery is where the adaptation happens."
                </p>
              </div>
            </div>

            {/* Week Summary */}
            <div className="card">
              <div className="label" style={{ marginBottom: '1rem' }}>Weekly Progress</div>
              <div style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>Mileage</span>
                  <span className="text-mono">42 / 45 mi</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '93%' }}></div>
                </div>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                  <span>Workouts</span>
                  <span className="text-mono">4 / 5</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-bar-fill" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
