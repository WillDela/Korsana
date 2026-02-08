import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { profileAPI } from '../api/profile';
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
  const [aiInsight, setAiInsight] = useState(null);
  const [loadingInsight, setLoadingInsight] = useState(false);

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
    fetchAiInsight();
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

  const fetchAiInsight = async () => {
    try {
      setLoadingInsight(true);
      const data = await profileAPI.getInsight();
      if (data.insight) {
        setAiInsight(data.insight);
      }
    } catch (error) {
      // Silently fall back to heuristic insight
      console.error('AI insight unavailable, using fallback:', error);
    } finally {
      setLoadingInsight(false);
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
    <div className="min-h-screen bg-slate-50">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-primary backdrop-blur-md border-b border-primary/80 h-16 flex items-center justify-between px-6">
        <Link to="/" className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center text-deep-green font-bold text-sm">K</div>
          Korsana
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/coach" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block">Coach</Link>
          <Link to="/settings" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:inline-block">Settings</Link>
          <span className="text-sm text-white/60 hidden md:inline-block">
            {user?.email}
          </span>
          <button
            onClick={() => logout()}
            className="text-sm font-medium text-white/70 hover:text-white transition-colors"
          >
            Log out
          </button>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-10 max-w-7xl">
        {/* Race Header - Sticky below nav */}
        {loadingGoal ? (
          <SkeletonRaceHeader />
        ) : !activeGoal ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl border border-gray-200 p-8 text-center mb-8 shadow-sm"
          >
            <h3 className="text-xl font-bold mb-2">No Active Goal Set</h3>
            <p className="text-slate-500 mb-6">
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
            className="sticky top-[70px] z-40 bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 shadow-sm p-6 mb-8"
          >
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-1">UPCOMING RACE</div>
                <div className="flex items-baseline gap-2 text-2xl font-bold text-deep-green">
                  {activeGoal.race_name}
                  <span className="text-slate-300 font-light mx-2">|</span>
                  <span className="text-primary tabular-nums">
                    <AnimatedNumber value={weeksOut} />
                  </span>
                  <span className="text-sm font-medium text-slate-500">weeks</span>
                  <span className="text-primary tabular-nums ml-2">
                    <AnimatedNumber value={daysOut} />
                  </span>
                  <span className="text-sm font-medium text-slate-500">days out</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link to="/goals" className="text-sm font-medium text-slate-500 hover:text-primary transition-colors">
                  Manage Goals
                </Link>
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                    Strava Connected
                  </span>
                ) : (
                  <button
                    onClick={handleConnectStrava}
                    disabled={isLoading}
                    className="btn btn-outline text-sm py-1.5 px-4"
                  >
                    {isLoading ? 'Connecting...' : 'Connect Strava'}
                  </button>
                )}
              </div>
            </div>

            <div className="mt-6">
              {/* Progress Bar */}
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-secondary"
                  initial={{ width: 0 }}
                  animate={{ width: `${trainingProgress}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium text-slate-400">
                <span>Training started</span>
                <span className="text-secondary">{trainingProgress}% complete</span>
                <span>Race day</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 items-start">
          {/* Left Column */}
          <div className="flex flex-col gap-8 w-full min-w-0">
            {/* Key Metrics - Staggered */}
            {loadingActivities || loadingGoal ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </div>
            ) : (
              <StaggerContainer className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <StaggerItem>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(36, 46, 123, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-2">This Week</div>
                    <div className="text-3xl font-mono font-bold text-deep-green tabular-nums">
                      <AnimatedNumber value={weeklyMileageActual} decimals={1} />
                      <span className="text-lg text-slate-400 ml-1">mi</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-500 font-medium">
                      {countWeeklyRuns()} run{countWeeklyRuns() !== 1 ? 's' : ''} this week
                    </div>
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(97, 139, 74, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-secondary"></div>
                    <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2">Current Pace</div>
                    <div className="text-3xl font-mono font-bold text-deep-green tabular-nums">
                      {currentPaceRaw ? formatPace(currentPaceRaw) : '--:--'}
                    </div>
                    <div className="mt-2 text-xs font-medium">
                      {paceDiff !== null ? (
                        paceDiff > 0 ? (
                          <span className="text-red-500">+{paceDiff}s from goal</span>
                        ) : paceDiff < 0 ? (
                          <span className="text-green-600">{paceDiff}s ahead of goal</span>
                        ) : (
                          <span className="text-green-600">On target</span>
                        )
                      ) : (
                        <span className="text-slate-400">avg from recent runs</span>
                      )}
                    </div>
                  </motion.div>
                </StaggerItem>

                <StaggerItem>
                  <motion.div
                    whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(6, 255, 165, 0.1)' }}
                    transition={{ duration: 0.2 }}
                    className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden group"
                  >
                    <div className="absolute top-0 left-0 w-1 h-full bg-accent"></div>
                    <div className="text-xs font-bold text-accent uppercase tracking-wider mb-2">Days to Race</div>
                    <div className="text-3xl font-mono font-bold text-deep-green tabular-nums">
                      <AnimatedNumber value={totalDays} />
                    </div>
                    <div className="mt-2 text-xs text-slate-500 font-medium">
                      Target: <span className="font-mono">{formatTargetTime()}</span>
                    </div>
                  </motion.div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Charts Section */}
            {!loadingActivities && activities.length > 0 && (
              <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Weekly Mileage Bar Chart */}
                <StaggerItem>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
                    <h4 className="text-sm font-bold text-primary uppercase tracking-wider mb-6">Weekly Mileage</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <BarChart data={weeklyChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="week"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          cursor={{ fill: '#f8fafc' }}
                          formatter={(v) => [`${v} mi`, 'Mileage']}
                        />
                        <Bar
                          dataKey="miles"
                          fill="#242E7B"
                          radius={[4, 4, 0, 0]}
                          maxBarSize={40}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </StaggerItem>

                {/* Pace Trend Line Chart */}
                <StaggerItem>
                  <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm h-80">
                    <h4 className="text-sm font-bold text-secondary uppercase tracking-wider mb-6">Pace Trend</h4>
                    <ResponsiveContainer width="100%" height="85%">
                      <LineChart data={paceChartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={false}
                          width={30}
                          reversed
                          domain={['dataMin - 0.5', 'dataMax + 0.5']}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#fff',
                            border: '1px solid #e2e8f0',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            fontSize: '12px'
                          }}
                          formatter={(v, name, props) => [props.payload.label + ' /mi', 'Pace']}
                        />
                        {targetPaceRaw && (
                          <Line
                            type="monotone"
                            dataKey={() => (targetPaceRaw * 1.60934) / 60}
                            stroke="#618B4A"
                            strokeDasharray="4 4"
                            dot={false}
                            strokeWidth={2}
                            name="Goal"
                            opacity={0.5}
                          />
                        )}
                        <Line
                          type="monotone"
                          dataKey="pace"
                          stroke="#06ffa5"
                          strokeWidth={3}
                          dot={{ r: 4, fill: '#06ffa5', strokeWidth: 2, stroke: '#fff' }}
                          activeDot={{ r: 6, stroke: '#06ffa5', strokeWidth: 4, fill: '#fff' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            )}

            {/* Recent Runs Table */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            >
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500">
                  Recent Runs
                </h3>
                {activities.length > 0 && (
                  <button
                    onClick={handleSyncActivities}
                    className="text-xs font-bold text-primary hover:text-secondary uppercase tracking-wider transition-colors"
                  >
                    Sync Now
                  </button>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-white text-slate-400 font-medium border-b border-gray-50">
                    <tr>
                      <th className="px-6 py-3 font-medium">Date</th>
                      <th className="px-6 py-3 font-medium">Distance</th>
                      <th className="px-6 py-3 font-medium">Pace</th>
                      <th className="px-6 py-3 font-medium">Type</th>
                      <th className="px-6 py-3 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingActivities ? (
                      Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
                    ) : activities.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                          No activities yet. Connect Strava to sync your runs.
                        </td>
                      </tr>
                    ) : (
                      activities.slice(0, 10).map((activity, i) => (
                        <motion.tr
                          key={activity.id || i}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: i * 0.05 }}
                          className="hover:bg-slate-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <td className="px-6 py-4">
                            <span className="font-semibold text-deep-green block">
                              {formatDate(activity.start_time)}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatDay(activity.start_time)}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-slate-700">
                            {metersToMiles(activity.distance_meters)} mi
                          </td>
                          <td className="px-6 py-4 font-mono font-medium text-primary">
                            {formatPace(activity.average_pace_seconds_per_km)} /mi
                          </td>
                          <td className="px-6 py-4 text-slate-500">
                            {activity.name || 'Run'}
                          </td>
                          <td className="px-6 py-4 text-right text-green-500 font-bold">
                            ✓
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="flex flex-col gap-6 sticky top-24">
            {/* AI Insight Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-xl shadow-lg border-l-4 border-secondary p-6 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-4 opacity-5">
                <svg className="w-24 h-24" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary to-deep-green text-white flex items-center justify-center font-bold text-xs shadow-md">
                  AI
                </div>
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">Coach Insight</span>
              </div>

              <div className="text-deep-green leading-relaxed text-sm font-medium pr-2">
                {loadingInsight ? (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-100 rounded w-full animate-pulse" />
                    <div className="h-3 bg-gray-100 rounded w-4/5 animate-pulse" />
                  </div>
                ) : (
                  <TypewriterText text={aiInsight || getInsightMessage()} speed={20} />
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                <Link to="/coach" className="text-xs font-bold text-secondary flex items-center gap-1 hover:gap-2 transition-all">
                  FULL ANALYSIS <span className="text-lg">→</span>
                </Link>
              </div>
            </motion.div>

            {/* Today's Plan */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Today's Plan</h4>
              <div className="text-center bg-slate-50 rounded-lg p-6 border border-slate-100">
                <div className={`text-2xl font-bold mb-2 ${todaysPlan.type === 'Done' ? 'text-green-600' :
                  todaysPlan.type === 'Rest' ? 'text-slate-400' : 'text-primary'
                  }`}>
                  {todaysPlan.type}
                </div>
                {todaysPlan.distance && (
                  <div className="text-4xl font-mono font-bold text-deep-green mb-2">
                    {todaysPlan.distance}
                  </div>
                )}
                <div className="text-sm text-slate-500 font-medium">
                  {todaysPlan.note}
                </div>
              </div>
            </div>

            {/* Weekly Target Progress */}
            <div className="bg-white p-6 rounded-xl border border-gray-200">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Weekly Volume</h4>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium text-deep-green">Mileage</span>
                    <span className="font-mono text-slate-600">
                      {weeklyMileageActual} / {weeklyTarget} mi
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary"
                      style={{ width: `${Math.min(100, (weeklyMileageActual / weeklyTarget) * 100)}%` }}
                    ></div>
                  </div>
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
