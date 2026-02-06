import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);

  useEffect(() => {
    if (searchParams.get('strava_connected') === 'true') {
      setIsConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      // Auto-sync activities when Strava is connected
      handleSyncActivities();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchActiveGoal();
    fetchActivities();
  }, []);

  const fetchActiveGoal = async () => {
    try {
      setLoadingGoal(true);
      const response = await goalsAPI.getActiveGoal();
      setActiveGoal(response.goal);
    } catch (error) {
      console.error('No active goal:', error);
    } finally {
      setLoadingGoal(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await stravaAPI.getActivities();
      setActivities(response.activities || []);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleConnectStrava = async () => {
    try {
      setIsLoading(true);
      const response = await stravaAPI.getAuthURL();
      window.location.href = response.url;
    } catch (error) {
      console.error('Failed to start Strava auth:', error);
      setIsLoading(false);
    }
  };

  const handleSyncActivities = async () => {
    try {
      await stravaAPI.syncActivities();
      await fetchActivities();
    } catch (error) {
      console.error('Failed to sync activities:', error);
    }
  };

  // Helper functions for displaying goal data
  const calculateDaysUntilRace = () => {
    if (!activeGoal) return { weeks: 0, days: 0 };
    const raceDate = new Date(activeGoal.race_date);
    const today = new Date();
    const diffTime = raceDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const days = diffDays % 7;
    return { weeks, days };
  };

  const formatPace = (secondsPerKm) => {
    if (!secondsPerKm) return '-';
    const secondsPerMile = secondsPerKm * 1.60934;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const metersToMiles = (meters) => {
    return (meters * 0.000621371).toFixed(1);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatDay = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  const { weeks: weeksOut, days: daysOut } = calculateDaysUntilRace();

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--color-bg-secondary)' }}>
      {/* Navigation */}
      <nav className="nav" style={{ position: 'sticky', top: 0, zIndex: 50 }}>
        <Link to="/" className="nav-brand">Korsana</Link>
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
        {loadingGoal ? (
          <div className="card" style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
            <p>Loading goal...</p>
          </div>
        ) : !activeGoal ? (
          <div className="card" style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem' }}>No Active Goal Set</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Set a race goal to start tracking your progress
            </p>
            <Link to="/goals/new" className="btn btn-primary">
              Set Your First Goal
            </Link>
          </div>
        ) : (
          <div className="race-header" style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="race-name">UPCOMING RACE</div>
                <div className="race-countdown">
                  {activeGoal.race_name} — {weeksOut} weeks, {daysOut} days
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
                <div className="progress-bar-fill" style={{ width: '35%' }}></div>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                opacity: 0.7
              }}>
                <span>Training started</span>
                <span>35% complete</span>
                <span>Race day</span>
              </div>
            </div>
          </div>
        )}


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
                  {loadingActivities ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        Loading activities...
                      </td>
                    </tr>
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                        <p style={{ color: 'var(--color-text-secondary)' }}>
                          No activities yet. Connect Strava to sync your runs.
                        </p>
                      </td>
                    </tr>
                  ) : (
                    activities.slice(0, 10).map((activity, i) => (
                      <tr key={activity.id || i}>
                        <td>
                          <span style={{ fontWeight: 500 }}>{formatDate(activity.start_time)}</span>
                          <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                            {formatDay(activity.start_time)}
                          </span>
                        </td>
                        <td className="data-cell">
                          {metersToMiles(activity.distance_meters)} mi
                        </td>
                        <td className="data-cell">
                          {formatPace(activity.average_pace_seconds_per_km)}
                        </td>
                        <td>{activity.name || 'Run'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--color-success)' }}>✓</span>
                        </td>
                      </tr>
                    ))
                  )}
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
