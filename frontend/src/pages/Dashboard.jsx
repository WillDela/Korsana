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
import TypewriterText from '../components/TypewriterText';

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

  // --- Dynamic sidebar helpers ---
  const getWeeklyMileageTarget = () => {
    if (!activeGoal) return 30;
    const raceDistanceMiles = (activeGoal.distance_meters || 42195) * 0.000621371;
    const weeksRemaining = Math.max(1, totalDays / 7);
    // Rough heuristic: peak weekly mileage ~3x race distance for marathon, scale down for shorter races
    const peakMileage = Math.min(raceDistanceMiles * 3, 60);
    // If far out, target is lower; ramp up as race approaches
    const rampFactor = Math.min(1, trainingProgress / 80);
    return Math.round(Math.max(10, peakMileage * (0.5 + 0.5 * rampFactor)));
  };

  const getInsightMessage = () => {
    const runs = countWeeklyRuns();
    const mileage = weeklyMileageActual;
    const target = getWeeklyMileageTarget();

    if (!activeGoal) return "Set a race goal to get personalized coaching insights.";

    if (totalDays <= 14) {
      return "Taper time! Reduce volume by 40-50% this week. Focus on rest, nutrition, and mental prep for race day.";
    }
    if (runs === 0 && mileage === 0) {
      return "No runs logged this week yet. Lace up and get moving — consistency beats intensity.";
    }
    if (mileage >= target) {
      return `Great week — you've hit ${mileage} mi against a ${target} mi target. Don't skip your rest day; recovery is where adaptation happens.`;
    }
    if (paceDiff !== null && paceDiff < -5) {
      return `You're running ${Math.abs(paceDiff)}s per mile faster than goal pace. Dial back on easy days to save energy for key workouts.`;
    }
    if (paceDiff !== null && paceDiff > 10) {
      return `Pace is ${paceDiff}s off your target — don't stress. Focus on building aerobic base; speed will come.`;
    }
    if (runs >= 3) {
      return `Solid consistency with ${runs} runs this week. Keep the easy days truly easy and bring intensity only to key sessions.`;
    }
    return `${mileage} miles so far this week. Aim for ${target} mi — small consistent efforts add up over ${Math.ceil(totalDays / 7)} weeks to race day.`;
  };

  const getTodaysPlan = () => {
    if (!activeGoal) return { type: 'Rest', distance: null, note: 'Set a goal first' };

    const dayOfWeek = new Date().getDay(); // 0=Sun, 6=Sat
    const todayActivities = activities.filter(a => {
      const d = new Date(a.start_time);
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });

    if (todayActivities.length > 0) {
      const totalMiles = todayActivities.reduce((sum, a) => sum + (a.distance_meters || 0) * 0.000621371, 0);
      return { type: 'Done', distance: `${totalMiles.toFixed(1)} mi`, note: 'completed today' };
    }

    const target = getWeeklyMileageTarget();
    const easyDist = Math.round(target / 5);
    const longDist = Math.round(target * 0.35);
    const tempoDist = Math.round(target * 0.2);

    // Day-of-week heuristics
    switch (dayOfWeek) {
      case 0: return { type: 'Rest', distance: null, note: 'recovery day' };
      case 1: return { type: 'Easy Run', distance: `${easyDist} mi`, note: '@ easy pace' };
      case 2: return { type: 'Tempo', distance: `${tempoDist} mi`, note: '@ tempo pace' };
      case 3: return { type: 'Easy Run', distance: `${easyDist} mi`, note: '@ easy pace' };
      case 4: return { type: 'Intervals', distance: `${tempoDist} mi`, note: 'speed work' };
      case 5: return { type: 'Rest', distance: null, note: 'recovery day' };
      case 6: return { type: 'Long Run', distance: `${longDist} mi`, note: '@ easy pace' };
      default: return { type: 'Easy Run', distance: `${easyDist} mi`, note: '@ easy pace' };
    }
  };

  const todaysPlan = getTodaysPlan();
  const weeklyTarget = getWeeklyMileageTarget();

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
          <span className="nav-email" style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Link to="/goals" style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.8)', textDecoration: 'none', fontWeight: 500 }}>
                  Manage Goals
                </Link>
                {isConnected ? (
                  <span className="badge badge-success">✓ Strava Connected</span>
                ) : (
                  <button onClick={handleConnectStrava} disabled={isLoading} className="btn btn-strava">
                    {isLoading ? 'Connecting...' : 'Connect Strava'}
                  </button>
                )}
              </div>
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
        <div className="dashboard-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '1.5rem' }}>
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Key Metrics - Staggered */}
            {loadingActivities || loadingGoal ? (
              <div className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <StaggerContainer className="metrics-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                <StaggerItem>
                  <motion.div
                    className="metric-card"
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(36, 46, 123, 0.15)' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8faf5 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                      borderLeft: '3px solid var(--color-primary)',
                    }}
                  >
                    <div className="label" style={{ color: 'var(--color-primary)' }}>This Week</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem', color: 'var(--color-primary)' }}>
                      <AnimatedNumber value={weeklyMileageActual} decimals={1} />
                      <span style={{ fontSize: '1rem', marginLeft: '0.25rem' }}>mi</span>
                    </div>
                    <div className="metric-context">
                      {countWeeklyRuns()} run{countWeeklyRuns() !== 1 ? 's' : ''} this week
                    </div>
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div
                    className="metric-card"
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(97, 139, 74, 0.15)' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8faf5 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                      borderLeft: '3px solid var(--color-secondary)',
                    }}
                  >
                    <div className="label" style={{ color: 'var(--color-secondary)' }}>Current Pace</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem', color: 'var(--color-secondary)' }}>
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
                  <motion.div
                    className="metric-card"
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(6, 255, 165, 0.15)' }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    style={{
                      background: 'linear-gradient(135deg, #ffffff 0%, #f0fdf9 100%)',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                      borderLeft: '3px solid var(--color-accent)',
                    }}
                  >
                    <div className="label" style={{ color: 'var(--color-accent)' }}>Days to Race</div>
                    <div className="data-value-lg" style={{ marginTop: '0.5rem', color: 'var(--color-accent)' }}>
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
              <StaggerContainer className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Weekly Mileage Bar Chart */}
                <StaggerItem>
                  <motion.div
                    className="card"
                    style={{
                      padding: '1.25rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                      background: 'linear-gradient(to bottom, #ffffff 0%, #fafbf8 100%)',
                    }}
                    whileHover={{ boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="label" style={{ marginBottom: '1rem', color: 'var(--color-primary)', fontSize: '0.8125rem' }}>
                      Weekly Mileage
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                        <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} width={35} />
                        <Tooltip
                          contentStyle={{
                            ...chartTooltipStyle,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          }}
                          formatter={(v) => [`${v} mi`, 'Mileage']}
                        />
                        <Bar
                          dataKey="miles"
                          fill="url(#colorMileage)"
                          radius={[4, 4, 0, 0]}
                          animationDuration={1000}
                          animationBegin={200}
                        />
                        <defs>
                          <linearGradient id="colorMileage" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#242E7B" stopOpacity={0.9} />
                            <stop offset="100%" stopColor="#242E7B" stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                </StaggerItem>

                {/* Pace Trend Line Chart */}
                <StaggerItem>
                  <motion.div
                    className="card"
                    style={{
                      padding: '1.25rem',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                      background: 'linear-gradient(to bottom, #ffffff 0%, #fafbf8 100%)',
                    }}
                    whileHover={{ boxShadow: '0 8px 16px rgba(0,0,0,0.08)' }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="label" style={{ marginBottom: '1rem', color: 'var(--color-secondary)', fontSize: '0.8125rem' }}>
                      Pace Trend
                    </div>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={paceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                        <YAxis
                          tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
                          width={35}
                          reversed
                          domain={['dataMin - 0.3', 'dataMax + 0.3']}
                        />
                        <Tooltip
                          contentStyle={{
                            ...chartTooltipStyle,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          }}
                          formatter={(v, name, props) => [props.payload.label + ' /mi', 'Pace']}
                        />
                        {targetPaceRaw && (
                          <Line
                            type="monotone"
                            dataKey={() => (targetPaceRaw * 1.60934) / 60}
                            stroke="var(--color-secondary)"
                            strokeDasharray="5 5"
                            dot={false}
                            strokeWidth={2}
                            name="Goal"
                            opacity={0.6}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="var(--color-accent)"
                          strokeWidth={3}
                          dot={{ r: 4, fill: 'var(--color-accent)', strokeWidth: 2, stroke: '#fff' }}
                          animationDuration={1400}
                          animationBegin={300}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </motion.div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Recent Runs Table - Staggered rows */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="card"
              style={{
                padding: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
                overflow: 'hidden',
              }}
            >
              <div style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(to right, #fafbf8 0%, #ffffff 100%)',
              }}>
                <h3 style={{ fontSize: '1.0625rem', margin: 0, fontWeight: 700, color: 'var(--color-text-primary)' }}>
                  Recent Runs
                </h3>
                {activities.length > 0 && (
                  <motion.button
                    onClick={handleSyncActivities}
                    className="btn btn-ghost"
                    style={{ fontSize: '0.75rem', padding: '0.375rem 0.875rem' }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    Sync
                  </motion.button>
                )}
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ paddingLeft: '1.5rem' }}>Date</th>
                    <th>Distance</th>
                    <th>Pace</th>
                    <th>Type</th>
                    <th style={{ paddingRight: '1.5rem' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {loadingActivities ? (
                    Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                  ) : activities.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                        <p style={{ color: 'var(--color-text-secondary)', fontSize: '0.9375rem' }}>
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
                        whileHover={{
                          backgroundColor: 'rgba(97, 139, 74, 0.04)',
                          transition: { duration: 0.15 },
                        }}
                        style={{ cursor: 'default' }}
                      >
                        <td style={{ paddingLeft: '1.5rem' }}>
                          <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>
                            {formatDate(activity.start_time)}
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', marginLeft: '0.5rem', fontSize: '0.8125rem' }}>
                            {formatDay(activity.start_time)}
                          </span>
                        </td>
                        <td className="data-cell" style={{ fontWeight: 500 }}>
                          {metersToMiles(activity.distance_meters)} mi
                        </td>
                        <td className="data-cell" style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                          {formatPace(activity.average_pace_seconds_per_km)}
                        </td>
                        <td style={{ color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                          {activity.name || 'Run'}
                        </td>
                        <td style={{ textAlign: 'right', paddingRight: '1.5rem' }}>
                          <span style={{ color: 'var(--color-success)', fontSize: '1.125rem' }}>✓</span>
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
                  padding: '1.5rem',
                  borderLeft: '4px solid var(--color-secondary)',
                  background: 'linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%)',
                  boxShadow: '0 4px 12px rgba(97, 139, 74, 0.08), 0 1px 3px rgba(0,0,0,0.06)',
                }}
                whileHover={{
                  y: -4,
                  boxShadow: '0 12px 24px rgba(97, 139, 74, 0.12), 0 4px 8px rgba(0,0,0,0.08)',
                }}
                transition={{ duration: 0.2 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1rem' }}>
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--color-secondary) 0%, #4f7136 100%)',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      boxShadow: '0 2px 8px rgba(97, 139, 74, 0.3)',
                    }}
                  >
                    K
                  </motion.span>
                  <span className="label" style={{ margin: 0, fontSize: '0.8125rem', color: 'var(--color-secondary)' }}>
                    Coach Insight
                  </span>
                </div>
                <p style={{
                  fontSize: '0.9375rem',
                  lineHeight: 1.6,
                  margin: 0,
                  color: 'var(--color-text-primary)',
                  fontWeight: 400,
                }}>
                  <TypewriterText
                    text={getInsightMessage()}
                    speed={25}
                    delay={600}
                  />
                </p>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 3.5, duration: 0.3 }}
                >
                  <Link
                    to="/coach"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '1rem',
                      fontSize: '0.8125rem',
                      color: 'var(--color-secondary)',
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Ask a follow-up →
                  </Link>
                </motion.div>
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
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: todaysPlan.type === 'Done' ? 'var(--color-success)' : todaysPlan.type === 'Rest' ? 'var(--color-slate)' : 'var(--color-primary)' }}>
                    {todaysPlan.type}
                  </div>
                  {todaysPlan.distance && (
                    <div className="data-value" style={{ fontSize: '2rem', marginTop: '0.5rem' }}>
                      {todaysPlan.distance}
                    </div>
                  )}
                  <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)', marginTop: '0.5rem' }}>
                    {todaysPlan.note}
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
                      animate={{ width: `${Math.min(100, weeklyMileageActual > 0 ? (weeklyMileageActual / weeklyTarget) * 100 : 0)}%` }}
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
