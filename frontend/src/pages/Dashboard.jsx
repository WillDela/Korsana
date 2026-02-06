import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import AnimatedNumber from '../components/AnimatedNumber';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';
import { SkeletonCard, SkeletonRow, SkeletonRaceHeader, SkeletonSidebarCard } from '../components/Skeleton';

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

  // --- Helpers ---
  const calculateDaysUntilRace = () => {
    if (!activeGoal) return { weeks: 0, days: 0, totalDays: 0 };
    const raceDate = new Date(activeGoal.race_date);
    const today = new Date();
    const diffDays = Math.max(0, Math.ceil((raceDate - today) / (1000 * 60 * 60 * 24)));
    return { weeks: Math.floor(diffDays / 7), days: diffDays % 7, totalDays: diffDays };
  };

  const formatPace = (secondsPerKm) => {
    if (!secondsPerKm) return '-';
    const secondsPerMile = secondsPerKm * 1.60934;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const metersToMiles = (meters) => (meters * 0.000621371).toFixed(1);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const formatDay = (dateString) => new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' });

  const { weeks: weeksOut, days: daysOut, totalDays } = calculateDaysUntilRace();

  // --- Computed metrics ---
  const computeWeeklyMileage = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekActivities = activities.filter(a => new Date(a.start_time) >= startOfWeek);
    const totalMeters = weekActivities.reduce((sum, a) => sum + (a.distance_meters || 0), 0);
    return parseFloat((totalMeters * 0.000621371).toFixed(1));
  };

  const computeCurrentPace = () => {
    const recentRuns = activities.filter(a => a.average_pace_seconds_per_km);
    if (recentRuns.length === 0) return null;
    return recentRuns.reduce((sum, a) => sum + a.average_pace_seconds_per_km, 0) / recentRuns.length;
  };

  const computeTargetPace = () => {
    if (!activeGoal || !activeGoal.target_time_seconds || !activeGoal.distance_meters) return null;
    return activeGoal.target_time_seconds / (activeGoal.distance_meters / 1000);
  };

  const computeTrainingProgress = () => {
    if (!activeGoal) return 0;
    const raceDate = new Date(activeGoal.race_date);
    const createdDate = new Date(activeGoal.created_at || Date.now());
    const now = new Date();
    const totalDuration = raceDate - createdDate;
    const elapsed = now - createdDate;
    if (totalDuration <= 0) return 100;
    return Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
  };

  const computePaceDiff = () => {
    const current = computeCurrentPace();
    const target = computeTargetPace();
    if (!current || !target) return null;
    return Math.round((current - target) * 1.60934);
  };

  const formatTargetTime = () => {
    if (!activeGoal?.target_time_seconds) return '--:--:--';
    const h = Math.floor(activeGoal.target_time_seconds / 3600);
    const m = Math.floor((activeGoal.target_time_seconds % 3600) / 60);
    const s = activeGoal.target_time_seconds % 60;
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const countWeeklyRuns = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return activities.filter(a => new Date(a.start_time) >= startOfWeek).length;
  };

  const weeklyMileageActual = computeWeeklyMileage();
  const currentPaceRaw = computeCurrentPace();
  const targetPaceRaw = computeTargetPace();
  const trainingProgress = computeTrainingProgress();
  const paceDiff = computePaceDiff();

  // --- Chart data ---
  const weeklyChartData = useMemo(() => {
    if (activities.length === 0) return [];
    const weeks = {};
    const now = new Date();
    // Initialize last 8 weeks
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      weeks[key] = { week: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), miles: 0 };
    }
    activities.forEach(a => {
      const d = new Date(a.start_time);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (weeks[key]) {
        weeks[key].miles += (a.distance_meters || 0) * 0.000621371;
      }
    });
    return Object.values(weeks).map(w => ({ ...w, miles: parseFloat(w.miles.toFixed(1)) }));
  }, [activities]);

  const paceChartData = useMemo(() => {
    if (activities.length === 0) return [];
    return [...activities]
      .filter(a => a.average_pace_seconds_per_km)
      .sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
      .slice(-15)
      .map(a => {
        const pacePerMile = a.average_pace_seconds_per_km * 1.60934;
        const min = Math.floor(pacePerMile / 60);
        const sec = Math.floor(pacePerMile % 60);
        return {
          date: formatDate(a.start_time),
          pace: parseFloat((pacePerMile / 60).toFixed(2)),
          label: `${min}:${sec.toString().padStart(2, '0')}`,
        };
      });
  }, [activities]);

  const chartTooltipStyle = {
    backgroundColor: 'var(--color-bg-primary)',
    border: '1px solid var(--color-border)',
    borderRadius: '0.375rem',
    fontSize: '0.8125rem',
    padding: '0.5rem 0.75rem',
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
          <button onClick={() => logout()} className="btn btn-ghost" style={{ fontSize: '0.875rem' }}>
            Log out
          </button>
        </div>
      </nav>

      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {/* Race Header - Sticky below nav */}
        {loadingGoal ? (
          <SkeletonRaceHeader />
        ) : !activeGoal ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
            style={{ marginBottom: '2rem', padding: '2rem', textAlign: 'center' }}
          >
            <h3 style={{ marginBottom: '1rem' }}>No Active Goal Set</h3>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '1.5rem' }}>
              Set a race goal to start tracking your progress
            </p>
            <Link to="/goals/new" className="btn btn-primary">
              Set Your First Goal
            </Link>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="race-header"
            style={{ marginBottom: '2rem', position: 'sticky', top: '60px', zIndex: 40 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <div className="race-name">UPCOMING RACE</div>
                <div className="race-countdown" style={{ display: 'flex', alignItems: 'baseline', gap: '0.25rem' }}>
                  {activeGoal.race_name} —{' '}
                  <span className="data-value">
                    <AnimatedNumber value={weeksOut} />
                  </span>{' '}weeks,{' '}
                  <span className="data-value">
                    <AnimatedNumber value={daysOut} />
                  </span>{' '}days
                </div>
              </div>
              {isConnected ? (
                <span className="badge badge-success">✓ Strava Connected</span>
              ) : (
                <button onClick={handleConnectStrava} disabled={isLoading} className="btn btn-strava">
                  {isLoading ? 'Connecting...' : 'Connect Strava'}
                </button>
              )}
            </div>
            <div style={{ marginTop: '1rem' }}>
              <div className="progress-bar" style={{ height: '6px' }}>
                <motion.div
                  className="progress-bar-fill"
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.75rem', opacity: 0.7 }}>
                <span>Training started</span>
                <span>{trainingProgress}% complete</span>
                <span>Race day</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Key Metrics - Staggered */}
            {loadingActivities || loadingGoal ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <StaggerContainer style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <StaggerItem>
                  <motion.div className="metric-card" whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }}>
                    <div className="label">This Week</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem' }}>
                      <AnimatedNumber value={weeklyMileageActual} decimals={1} />
                      <span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>mi</span>
                    </div>
                    <div className="metric-context">
                      {countWeeklyRuns()} run{countWeeklyRuns() !== 1 ? 's' : ''} this week
                    </div>
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div className="metric-card" whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }}>
                    <div className="label">Current Pace</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem' }}>
                      {currentPaceRaw ? formatPace(currentPaceRaw) : '--:--'}
                    </div>
                    <div className="metric-context">
                      {paceDiff !== null ? (
                        paceDiff > 0 ? (
                          <span className="metric-negative">+{paceDiff}s from goal</span>
                        ) : paceDiff < 0 ? (
                          <span className="metric-positive">{paceDiff}s ahead of goal</span>
                        ) : (
                          <span className="metric-positive">On target</span>
                        )
                      ) : (
                        <span>avg from recent runs</span>
                      )}
                    </div>
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div className="metric-card" whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} transition={{ duration: 0.2 }}>
                    <div className="label">Days to Race</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>
                      <AnimatedNumber value={totalDays} />
                    </div>
                    <div className="metric-context">
                      target {formatTargetTime()}
                    </div>
                  </motion.div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Charts Section */}
            {!loadingActivities && activities.length > 0 && (
              <StaggerContainer style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Weekly Mileage Bar Chart */}
                <StaggerItem>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div className="label" style={{ marginBottom: '0.75rem' }}>Weekly Mileage</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                        <YAxis tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} width={30} />
                        <Tooltip contentStyle={chartTooltipStyle} formatter={(v) => [`${v} mi`, 'Mileage']} />
                        <Bar dataKey="miles" fill="var(--color-primary)" radius={[3, 3, 0, 0]} animationDuration={800} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </StaggerItem>

                {/* Pace Trend Line Chart */}
                <StaggerItem>
                  <div className="card" style={{ padding: '1rem' }}>
                    <div className="label" style={{ marginBottom: '0.75rem' }}>Pace Trend</div>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={paceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }} />
                        <YAxis
                          tick={{ fontSize: 10, fill: 'var(--color-text-muted)' }}
                          width={30}
                          reversed
                          domain={['dataMin - 0.3', 'dataMax + 0.3']}
                        />
                        <Tooltip
                          contentStyle={chartTooltipStyle}
                          formatter={(v, name, props) => [props.payload.label + ' /mi', 'Pace']}
                        />
                        {targetPaceRaw && (
                          <Line
                            type="monotone"
                            dataKey={() => (targetPaceRaw * 1.60934) / 60}
                            stroke="var(--color-secondary)"
                            strokeDasharray="5 5"
                            dot={false}
                            strokeWidth={1}
                            name="Goal"
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="var(--color-accent)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: 'var(--color-accent)' }}
                          animationDuration={1200}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Recent Runs Table - Staggered rows */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="card"
              style={{ padding: 0 }}
            >
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '1rem', margin: 0 }}>Recent Runs</h3>
                {activities.length > 0 && (
                  <button
                    onClick={handleSyncActivities}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem' }}
                  >
                    Sync
                  </button>
                )}
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
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
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
                      <motion.tr
                        key={activity.id || i}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25, delay: i * 0.04 }}
                      >
                        <td>
                          <span style={{ fontWeight: 500 }}>{formatDate(activity.start_time)}</span>
                          <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem' }}>
                            {formatDay(activity.start_time)}
                          </span>
                        </td>
                        <td className="data-cell">{metersToMiles(activity.distance_meters)} mi</td>
                        <td className="data-cell">{formatPace(activity.average_pace_seconds_per_km)}</td>
                        <td>{activity.name || 'Run'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <span style={{ color: 'var(--color-success)' }}>✓</span>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <StaggerContainer style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* AI Insight Card */}
            <StaggerItem>
              <motion.div
                className="card"
                style={{
                  padding: '1.25rem',
                  borderLeft: '3px solid var(--color-secondary)',
                }}
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <span style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    background: 'var(--color-secondary)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                  }}>K</span>
                  <span className="label" style={{ margin: 0 }}>Coach Insight</span>
                </div>
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  style={{ fontSize: '0.9375rem', lineHeight: 1.5, margin: 0 }}
                >
                  "Your mileage is solid this week. Don't skip tomorrow's rest day — recovery is where the adaptation happens."
                </motion.p>
                <Link
                  to="/coach"
                  style={{
                    display: 'inline-block',
                    marginTop: '0.75rem',
                    fontSize: '0.8125rem',
                    color: 'var(--color-secondary)',
                    fontWeight: 500,
                  }}
                >
                  Ask a follow-up →
                </Link>
              </motion.div>
            </StaggerItem>

            {/* Today's Plan */}
            <StaggerItem>
              <div className="card">
                <div className="label" style={{ marginBottom: '0.75rem' }}>Today's Plan</div>
                <div style={{
                  padding: '1rem',
                  background: 'var(--color-bg-secondary)',
                  borderRadius: '0.375rem',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                    Easy Run
                  </div>
                  <div className="data-value" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
                    6 mi
                  </div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    @ easy pace
                  </div>
                </div>
              </div>
            </StaggerItem>

            {/* Week Summary */}
            <StaggerItem>
              <div className="card">
                <div className="label" style={{ marginBottom: '1rem' }}>Weekly Progress</div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>Mileage</span>
                    <span className="text-mono">
                      <AnimatedNumber value={weeklyMileageActual} decimals={1} suffix=" mi" />
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, weeklyMileageActual > 0 ? (weeklyMileageActual / 30) * 100 : 0)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.4 }}
                    />
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                    <span>Runs</span>
                    <span className="text-mono">
                      <AnimatedNumber value={countWeeklyRuns()} />
                    </span>
                  </div>
                  <div className="progress-bar">
                    <motion.div
                      className="progress-bar-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (countWeeklyRuns() / 5) * 100)}%` }}
                      transition={{ duration: 0.6, ease: 'easeOut', delay: 0.5 }}
                    />
                  </div>
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
