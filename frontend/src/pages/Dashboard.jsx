import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { getErrorMessage } from '../api/client';
import WeekCalendar from '../components/WeekCalendar';
import ActiveGoalBanner from '../components/ActiveGoalBanner';
import MetricCard from '../components/MetricCard';
import ReadinessGauge from '../components/ReadinessGauge';
import PaceEngineer from '../components/PaceEngineer';
import PhysiologyZones from '../components/PhysiologyZones';
import RecentActivitiesCard from '../components/RecentActivitiesCard';
import RunTypeBreakdown from '../components/RunTypeBreakdown';
import ConsistencyTracker from '../components/ConsistencyTracker';

const MileageIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 20V10M12 20V4M6 20v-6" />
  </svg>
);

const PaceIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
  </svg>
);

const ConsistencyIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeGoal, setActiveGoal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');

  useEffect(() => {
    if (searchParams.get('strava_connected') === 'true') {
      setIsConnected(true);
      window.history.replaceState({}, document.title, window.location.pathname);
      handleSyncActivities();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchActiveGoal();
    fetchActivitiesAndAutoSync();
  }, []);

  const fetchActivitiesAndAutoSync = async () => {
    try {
      setLoadingActivities(true);
      const response = await stravaAPI.getActivities();
      if (!response.activities || response.activities.length === 0) {
        try {
          await stravaAPI.syncActivities();
          const syncedResponse = await stravaAPI.getActivities();
          setActivities(syncedResponse.activities || []);
        } catch (syncError) {
          setActivities([]);
        }
      } else {
        setActivities(response.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setLoadingActivities(false);
    }
  };

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
      setSyncError('');
      setSyncSuccess('');
      setIsSyncing(true);
      const result = await stravaAPI.syncActivities();
      await fetchActivities();
      const count = result?.count || 0;
      setSyncSuccess(count > 0 ? `Synced ${count} activit${count === 1 ? 'y' : 'ies'}` : 'Already up to date');
      setTimeout(() => setSyncSuccess(''), 4000);
    } catch (error) {
      console.error('Failed to sync activities:', error);
      setSyncError(getErrorMessage(error));
      setTimeout(() => setSyncError(''), 5000);
    } finally {
      setIsSyncing(false);
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

  const { totalDays } = calculateDaysUntilRace();

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

  const countWeeklyRuns = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return activities.filter(a => new Date(a.start_time) >= startOfWeek).length;
  };

  const weeklyMileageActual = computeWeeklyMileage();
  const currentPaceRaw = computeCurrentPace();
  const trainingProgress = computeTrainingProgress();
  const paceDiff = computePaceDiff();

  const getWeeklyMileageTarget = () => {
    if (!activeGoal) return 30;
    const raceDistanceMiles = (activeGoal.distance_meters || 42195) * 0.000621371;
    const peakMileage = Math.min(raceDistanceMiles * 3, 60);
    const rampFactor = Math.min(1, trainingProgress / 80);
    return Math.round(Math.max(10, peakMileage * (0.5 + 0.5 * rampFactor)));
  };

  const weeklyTarget = getWeeklyMileageTarget();

  // Consistency (must be before readinessScore which depends on it)
  const consistency = useMemo(() => {
    if (activities.length === 0) return 0;
    const now = new Date();
    let consistentWeeks = 0;
    for (let w = 0; w < 4; w++) {
      const start = new Date(now);
      start.setDate(start.getDate() - start.getDay() - w * 7);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const weekRuns = activities.filter(a => {
        const d = new Date(a.start_time);
        return d >= start && d < end;
      }).length;
      if (weekRuns >= 3) consistentWeeks++;
    }
    return consistentWeeks * 25;
  }, [activities]);

  // 5-component Race Readiness Score
  const readinessScore = useMemo(() => {
    // 1. Volume Adequacy (25%): weekly mileage vs target
    const volumeScore = Math.min(100, (weeklyMileageActual / weeklyTarget) * 100);

    // 2. Pace Fitness (25%): current avg pace vs target race pace
    let paceScore = 50; // default neutral
    if (paceDiff !== null) {
      if (Math.abs(paceDiff) <= 5) paceScore = 100;
      else if (Math.abs(paceDiff) <= 15) paceScore = 75;
      else if (Math.abs(paceDiff) <= 30) paceScore = 50;
      else paceScore = 25;
    }

    // 3. Consistency (20%): weeks with 3+ runs out of last 4
    const consistencyScore = consistency; // already 0-100

    // 4. Long Run Readiness (15%): longest run in last 3 weeks vs 60% of race distance
    let longRunScore = 50;
    if (activeGoal && activities.length > 0) {
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      const recentRuns = activities.filter(a => new Date(a.start_time) >= threeWeeksAgo);
      const longestRun = Math.max(0, ...recentRuns.map(a => a.distance_meters || 0));
      const raceDistance = activeGoal.distance_meters || 42195;
      const targetLong = raceDistance * 0.6;
      longRunScore = targetLong > 0 ? Math.min(100, (longestRun / targetLong) * 100) : 50;
    }

    // 5. Trend Direction (15%): this week vs avg of previous 3 weeks
    let trendScore = 50;
    if (activities.length > 0) {
      const now = new Date();
      let prevWeeksMileage = [];
      for (let w = 1; w <= 3; w++) {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay() - w * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const weekMiles = activities
          .filter(a => { const d = new Date(a.start_time); return d >= start && d < end; })
          .reduce((sum, a) => sum + (a.distance_meters || 0) * 0.000621371, 0);
        prevWeeksMileage.push(weekMiles);
      }
      const avgPrev = prevWeeksMileage.reduce((a, b) => a + b, 0) / 3;
      if (avgPrev > 0) {
        const ratio = weeklyMileageActual / avgPrev;
        if (ratio >= 1.1) trendScore = 100;
        else if (ratio >= 0.9) trendScore = 75;
        else if (ratio >= 0.7) trendScore = 50;
        else trendScore = 25;
      }
    }

    const composite = Math.round(
      volumeScore * 0.25 +
      paceScore * 0.25 +
      consistencyScore * 0.20 +
      longRunScore * 0.15 +
      trendScore * 0.15
    );

    return Math.min(100, Math.max(0, composite));
  }, [weeklyMileageActual, weeklyTarget, paceDiff, consistency, activities, activeGoal]);

  // Chart data
  const weeklyChartData = useMemo(() => {
    if (activities.length === 0) return [];
    const weeks = {};
    const now = new Date();
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

  // Pace status text
  const paceStatus = () => {
    if (!currentPaceRaw) return { text: 'No data', color: 'var(--color-text-muted)' };
    if (paceDiff !== null && Math.abs(paceDiff) <= 5) return { text: 'On target', color: 'var(--color-sage)' };
    if (paceDiff !== null && paceDiff > 0) return { text: `+${paceDiff}s off`, color: 'var(--color-amber)' };
    if (paceDiff !== null && paceDiff < 0) return { text: `${paceDiff}s faster`, color: 'var(--color-sage)' };
    return { text: 'Tracking', color: 'var(--color-text-secondary)' };
  };

  const mileageStatus = () => {
    const pct = Math.round((weeklyMileageActual / weeklyTarget) * 100);
    if (pct >= 100) return { text: 'Target hit!', color: 'var(--color-sage)' };
    if (pct >= 50) return { text: `${pct}% of ${weeklyTarget} mi`, color: 'var(--color-text-secondary)' };
    return { text: `${weeklyMileageActual} / ${weeklyTarget} mi`, color: 'var(--color-text-secondary)' };
  };

  const tooltipStyle = {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '0.8125rem',
  };

  return (
    <>
      {/* Sync bar */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>
          Dashboard
        </h2>
        <div className="flex items-center gap-3">
          {syncSuccess && (
            <span className="text-xs font-medium text-sage flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {syncSuccess}
            </span>
          )}
          {syncError && <span className="text-xs font-medium text-error">{syncError}</span>}
          <button
            onClick={handleSyncActivities}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light transition-colors cursor-pointer border-none disabled:opacity-60"
          >
            <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isSyncing ? 'Syncing...' : 'Sync Activities'}
          </button>
        </div>
      </div>

      {/* Row 1: Active Goal Banner */}
      <ActiveGoalBanner goal={activeGoal} loading={loadingGoal} trainingProgress={trainingProgress} />

      {/* Row 2: Calendar Strip */}
      <section className="mt-6 bg-white rounded-xl border border-border p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-text-primary" style={{ fontFamily: 'var(--font-heading)' }}>This Week</h3>
          <Link to="/calendar" className="text-xs font-medium text-navy hover:text-navy-light transition-colors no-underline">
            Full Calendar
          </Link>
        </div>
        <WeekCalendar compact={true} />
      </section>

      {/* Row 3: 4 Metric Cards */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard label="Readiness">
          <ReadinessGauge value={readinessScore} size={76} />
        </MetricCard>
        <MetricCard
          label="Weekly Mileage"
          value={weeklyMileageActual}
          decimals={1}
          suffix=" mi"
          subtext={mileageStatus().text}
          subtextColor={mileageStatus().color}
          icon={<MileageIcon />}
        />
        <MetricCard
          label="Avg Pace"
          subtext={paceStatus().text}
          subtextColor={paceStatus().color}
          icon={<PaceIcon />}
        >
          <div className="text-3xl font-bold text-text-primary" style={{ fontFamily: 'var(--font-mono)' }}>
            {currentPaceRaw ? formatPace(currentPaceRaw) : '--:--'}
          </div>
          <span className="text-xs text-text-muted">/mi</span>
        </MetricCard>
        <MetricCard
          label="Consistency"
          value={consistency}
          suffix="%"
          subtext={consistency >= 75 ? 'Strong habit' : consistency >= 50 ? 'Building' : 'Needs work'}
          subtextColor={consistency >= 75 ? 'var(--color-sage)' : consistency >= 50 ? 'var(--color-amber)' : 'var(--color-coral)'}
          icon={<ConsistencyIcon />}
        />
      </section>

      {/* Row 4: Run Type Breakdown + Consistency Tracker */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <RunTypeBreakdown activities={activities} targetPaceSecondsPerKm={computeTargetPace()} />
        <ConsistencyTracker activities={activities} />
      </section>

      {/* Row 5: Pace Engineer + Physiology Zones */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-2">
          <PaceEngineer activeGoal={activeGoal} />
        </div>
        <div className="lg:col-span-3">
          <PhysiologyZones currentPace={currentPaceRaw} activeGoal={activeGoal} />
        </div>
      </section>

      {/* Row 6: Volume Trend + Recent Activities */}
      <section className="grid grid-cols-1 lg:grid-cols-5 gap-6 mt-6">
        <div className="lg:col-span-3 bg-white rounded-xl border border-border p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
            Weekly Volume
          </h3>
          <div className="h-[240px]">
            {weeklyChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} dy={8} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{ fill: 'var(--color-bg-elevated)' }} contentStyle={tooltipStyle} />
                  <Bar dataKey="miles" fill="var(--color-navy)" radius={[4, 4, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-text-muted">
                No data yet — sync your activities
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2">
          <RecentActivitiesCard
            activities={activities}
            formatPace={formatPace}
            metersToMiles={metersToMiles}
            formatDate={formatDate}
          />
        </div>
      </section>

    </>
  );
};

export default Dashboard;
