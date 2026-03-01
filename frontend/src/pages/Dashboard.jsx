import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { activitiesAPI } from '../api/activities';
import { calendarAPI } from '../api/calendar';
import { getErrorMessage } from '../api/client';
import WeekCalendar from '../components/WeekCalendar';
import MetricCard from '../components/MetricCard';
import BrandIcon from '../components/BrandIcon';
import ReadinessGauge from '../components/ReadinessGauge';
import RaceHeader from '../components/dashboard/RaceHeader';
import ReadinessBreakdown from '../components/dashboard/ReadinessBreakdown';
import PaceTrendChart from '../components/dashboard/PaceTrendChart';
import RecentRunsTable from '../components/dashboard/RecentRunsTable';
import TodaysPlanCard from '../components/dashboard/TodaysPlanCard';
import CrossTrainingCard from '../components/dashboard/CrossTrainingCard';
import CoachInsightBar from '../components/CoachInsightBar';
import ManualActivityModal from '../components/ManualActivityModal';
import { DISTANCE_BASED_TYPES } from '../constants/activityTypes';

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

const LoadIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
  </svg>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeGoal, setActiveGoal] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loadingGoal, setLoadingGoal] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [syncError, setSyncError] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');
  const [isSyncMenuOpen, setIsSyncMenuOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState(null);
  const [todayEntry, setTodayEntry] = useState(null);
  const [readinessExpanded, setReadinessExpanded] = useState(false);
  const [coachInsight, setCoachInsight] = useState(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    if (searchParams.get('strava_connected') === 'true') {
      window.history.replaceState(
        {}, document.title, window.location.pathname
      );
      handleSyncActivities();
    }
  }, [searchParams]);

  useEffect(() => {
    fetchActiveGoal();
    fetchActivitiesAndAutoSync();
    fetchTodayEntry();
  }, []);

  const fetchTodayEntry = async () => {
    try {
      const today = new Date();
      const key = formatDateISO(today);
      const response = await calendarAPI.getWeek(key);
      const entries = response.entries || [];
      const match = entries.find((e) => e.date === key);
      setTodayEntry(match || null);
    } catch {
      setTodayEntry(null);
    }
  };

  const handleMarkComplete = async (entryId) => {
    try {
      await calendarAPI.updateStatus(entryId, 'completed');
      setTodayEntry((prev) =>
        prev ? { ...prev, status: 'completed' } : prev
      );
    } catch (err) {
      console.error('Failed to mark complete:', err);
    }
  };

  const fetchActivitiesAndAutoSync = async () => {
    try {
      setLoadingActivities(true);
      const response = await activitiesAPI.getActivities();
      if (!response.activities || response.activities.length === 0) {
        try {
          await stravaAPI.syncActivities();
          const syncedResponse = await activitiesAPI.getActivities();
          setActivities(syncedResponse.activities || []);
          setLastSynced(new Date().toISOString());
        } catch {
          setActivities([]);
        }
      } else {
        setActivities(response.activities || []);
      }
    } catch {
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
    } catch {
      // No active goal
    } finally {
      setLoadingGoal(false);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoadingActivities(true);
      const response = await activitiesAPI.getActivities();
      setActivities(response.activities || []);
    } catch {
      // Failed to fetch
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleSyncActivities = async (provider = 'strava') => {
    setIsSyncMenuOpen(false);
    if (provider !== 'strava') {
      const name = provider.charAt(0).toUpperCase() + provider.slice(1);
      setSyncError(`${name} integration coming soon!`);
      setTimeout(() => setSyncError(''), 3000);
      return;
    }
    try {
      setSyncError('');
      setSyncSuccess('');
      setIsSyncing(true);
      const result = await stravaAPI.syncActivities();
      await fetchActivities();
      setLastSynced(new Date().toISOString());
      const count = result?.count || 0;
      setSyncSuccess(
        count > 0
          ? `Synced ${count} activit${count === 1 ? 'y' : 'ies'}`
          : 'Already up to date'
      );
      setTimeout(() => setSyncSuccess(''), 4000);
    } catch (error) {
      setSyncError(getErrorMessage(error));
      setTimeout(() => setSyncError(''), 5000);
    } finally {
      setIsSyncing(false);
    }
  };

  // --- Helpers ---
  const formatDateISO = (date) => {
    const d = new Date(date);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const formatPace = (secondsPerKm) => {
    if (!secondsPerKm) return '-';
    const secondsPerMile = secondsPerKm * 1.60934;
    const minutes = Math.floor(secondsPerMile / 60);
    const seconds = Math.floor(secondsPerMile % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // --- Computed metrics ---
  const computeWeeklyMileage = () => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const weekActs = activities.filter(
      (a) => a.activity_type === 'run' && new Date(a.start_time) >= startOfWeek
    );
    const totalMeters = weekActs.reduce(
      (sum, a) => sum + (a.distance_meters || 0), 0
    );
    return parseFloat((totalMeters * 0.000621371).toFixed(1));
  };

  const computeCurrentPace = () => {
    const recentRuns = activities.filter(
      (a) => a.activity_type === 'run' && a.average_pace_seconds_per_km
    );
    if (recentRuns.length === 0) return null;
    return (
      recentRuns.reduce(
        (sum, a) => sum + a.average_pace_seconds_per_km, 0
      ) / recentRuns.length
    );
  };

  const computeTargetPace = () => {
    if (
      !activeGoal ||
      !activeGoal.target_time_seconds ||
      !activeGoal.race_distance_meters
    ) {
      return null;
    }
    return activeGoal.target_time_seconds /
      (activeGoal.race_distance_meters / 1000);
  };

  const computeTrainingProgress = () => {
    if (!activeGoal) return 0;
    const raceDate = new Date(activeGoal.race_date);
    const createdDate = new Date(activeGoal.created_at || Date.now());
    const now = new Date();
    const totalDuration = raceDate - createdDate;
    const elapsed = now - createdDate;
    if (totalDuration <= 0) return 100;
    return Math.min(
      100, Math.max(0, Math.round((elapsed / totalDuration) * 100))
    );
  };

  const computePaceDiff = () => {
    const current = computeCurrentPace();
    const target = computeTargetPace();
    if (!current || !target) return null;
    return Math.round((current - target) * 1.60934);
  };

  const weeklyMileageActual = computeWeeklyMileage();
  const currentPaceRaw = computeCurrentPace();
  const trainingProgress = computeTrainingProgress();
  const paceDiff = computePaceDiff();

  const getWeeklyMileageTarget = () => {
    if (!activeGoal) return 30;
    const raceDistMiles =
      (activeGoal.race_distance_meters || 42195) * 0.000621371;
    const peakMileage = Math.min(raceDistMiles * 3, 60);
    const rampFactor = Math.min(1, trainingProgress / 80);
    return Math.round(
      Math.max(10, peakMileage * (0.5 + 0.5 * rampFactor))
    );
  };

  const weeklyTarget = getWeeklyMileageTarget();

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
      const weekRuns = activities.filter((a) => {
        const d = new Date(a.start_time);
        return a.activity_type === 'run' && d >= start && d < end;
      }).length;
      if (weekRuns >= 3) consistentWeeks++;
    }
    return consistentWeeks * 25;
  }, [activities]);

  // 5-component Race Readiness Score
  const readinessFactors = useMemo(() => {
    const volumeScore = Math.min(
      100, (weeklyMileageActual / weeklyTarget) * 100
    );

    let paceScore = 50;
    if (paceDiff !== null) {
      if (Math.abs(paceDiff) <= 5) paceScore = 100;
      else if (Math.abs(paceDiff) <= 15) paceScore = 75;
      else if (Math.abs(paceDiff) <= 30) paceScore = 50;
      else paceScore = 25;
    }

    const consistencyScore = consistency;

    let longRunScore = 50;
    if (activeGoal && activities.length > 0) {
      const threeWeeksAgo = new Date();
      threeWeeksAgo.setDate(threeWeeksAgo.getDate() - 21);
      const recentRuns = activities.filter(
        (a) => a.activity_type === 'run' && new Date(a.start_time) >= threeWeeksAgo
      );
      const longestRun = Math.max(
        0, ...recentRuns.map((a) => a.distance_meters || 0)
      );
      const raceDistance = activeGoal.race_distance_meters || 42195;
      const targetLong = raceDistance * 0.6;
      longRunScore = targetLong > 0
        ? Math.min(100, (longestRun / targetLong) * 100)
        : 50;
    }

    let trendScore = 50;
    if (activities.length > 0) {
      const now = new Date();
      const prevWeeksMileage = [];
      for (let w = 1; w <= 3; w++) {
        const start = new Date(now);
        start.setDate(start.getDate() - start.getDay() - w * 7);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(end.getDate() + 7);
        const weekMiles = activities
          .filter((a) => {
            const d = new Date(a.start_time);
            return a.activity_type === 'run' && d >= start && d < end;
          })
          .reduce(
            (sum, a) => sum + (a.distance_meters || 0) * 0.000621371, 0
          );
        prevWeeksMileage.push(weekMiles);
      }
      const avgPrev =
        prevWeeksMileage.reduce((a, b) => a + b, 0) / 3;
      if (avgPrev > 0) {
        const ratio = weeklyMileageActual / avgPrev;
        if (ratio >= 1.1) trendScore = 100;
        else if (ratio >= 0.9) trendScore = 75;
        else if (ratio >= 0.7) trendScore = 50;
        else trendScore = 25;
      }
    }

    // Cross-training score: count distinct days with non-run activities in last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const crossTrainDays = new Set(
      activities
        .filter((a) => a.activity_type !== 'run' && new Date(a.start_time) >= sevenDaysAgo)
        .map((a) => new Date(a.start_time).toISOString().slice(0, 10))
    ).size;
    const crossTrainingScore = Math.min(100, crossTrainDays * 34);

    const composite = Math.round(
      volumeScore * 0.22 +
      paceScore * 0.22 +
      consistencyScore * 0.18 +
      longRunScore * 0.15 +
      trendScore * 0.13 +
      crossTrainingScore * 0.10
    );

    return {
      volume: Math.round(volumeScore),
      pace: Math.round(paceScore),
      consistency: Math.round(consistencyScore),
      longRun: Math.round(longRunScore),
      trend: Math.round(trendScore),
      crossTraining: Math.round(crossTrainingScore),
      composite: Math.min(100, Math.max(0, composite)),
    };
  }, [
    weeklyMileageActual, weeklyTarget, paceDiff,
    consistency, activities, activeGoal,
  ]);

  const readinessScore = readinessFactors.composite;

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
      weeks[key] = {
        week: weekStart.toLocaleDateString(
          'en-US', { month: 'short', day: 'numeric' }
        ),
        miles: 0,
      };
    }
    activities
      .filter((a) => a.activity_type === 'run')
      .forEach((a) => {
        const d = new Date(a.start_time);
        const weekStart = new Date(d);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().slice(0, 10);
        if (weeks[key]) {
          weeks[key].miles += (a.distance_meters || 0) * 0.000621371;
        }
      });
    return Object.values(weeks).map((w) => ({
      ...w,
      miles: parseFloat(w.miles.toFixed(1)),
    }));
  }, [activities]);

  // Pace status text
  const paceStatus = () => {
    if (!currentPaceRaw) {
      return { text: 'No data', color: 'var(--color-text-muted)' };
    }
    if (paceDiff !== null && Math.abs(paceDiff) <= 5) {
      return { text: 'On target', color: 'var(--color-sage)' };
    }
    if (paceDiff !== null && paceDiff > 0) {
      return { text: `+${paceDiff}s off`, color: 'var(--color-amber)' };
    }
    if (paceDiff !== null && paceDiff < 0) {
      return { text: `${paceDiff}s faster`, color: 'var(--color-sage)' };
    }
    return { text: 'Tracking', color: 'var(--color-text-secondary)' };
  };

  const mileageStatus = () => {
    const pct = Math.round(
      (weeklyMileageActual / weeklyTarget) * 100
    );
    if (pct >= 100) {
      return { text: 'Target hit!', color: 'var(--color-sage)' };
    }
    if (pct >= 50) {
      return {
        text: `${pct}% of ${weeklyTarget} mi`,
        color: 'var(--color-text-secondary)',
      };
    }
    return {
      text: `${weeklyMileageActual} / ${weeklyTarget} mi`,
      color: 'var(--color-text-secondary)',
    };
  };

  // Goal pace in sec/mile for PaceTrendChart
  const goalPacePerMile = useMemo(() => {
    const target = computeTargetPace();
    if (!target) return null;
    return target * 1.60934;
  }, [activeGoal]);

  const tooltipStyle = {
    borderRadius: '8px',
    border: 'none',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    fontSize: '0.8125rem',
  };

  const weeklyRunCount = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return activities.filter(
      (a) => a.activity_type === 'run' && new Date(a.start_time) >= startOfWeek
    ).length;
  }, [activities]);

  return (
    <>
      {/* Sync bar */}
      <div className="flex items-center justify-between mb-2">
        <h2
          className="text-lg font-semibold text-text-primary"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Dashboard
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowLogModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-navy text-navy text-sm font-medium hover:bg-navy/5 transition-colors cursor-pointer bg-white"
          >
            + Log Activity
          </button>
          {syncSuccess && (
            <span className="text-xs font-medium text-sage flex items-center gap-1">
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              {syncSuccess}
            </span>
          )}
          {syncError && (
            <span className="text-xs font-medium text-error">
              {syncError}
            </span>
          )}
          <div className="relative">
            <button
              onClick={() => setIsSyncMenuOpen(!isSyncMenuOpen)}
              disabled={isSyncing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-navy text-white text-sm font-medium hover:bg-navy-light transition-colors cursor-pointer border-none disabled:opacity-60"
            >
              <svg className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="23 4 23 10 17 10" />
                <polyline points="1 20 1 14 7 14" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isSyncing ? 'Syncing...' : 'Sync Activities'}
              <svg className="w-4 h-4 ml-1 opacity-70" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
            </button>

            {isSyncMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSyncMenuOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-border z-20 py-1 overflow-hidden">
                  <button
                    onClick={() => handleSyncActivities('strava')}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-app flex items-center gap-2 cursor-pointer border-none bg-transparent"
                  >
                    <BrandIcon brand="strava" size={18} />
                    Sync Strava
                  </button>
                  <button
                    onClick={() => handleSyncActivities('garmin')}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-app flex items-center gap-2 cursor-pointer border-none bg-transparent opacity-50"
                  >
                    <BrandIcon brand="garmin" size={18} />
                    Sync Garmin
                  </button>
                  <button
                    onClick={() => handleSyncActivities('coros')}
                    className="w-full text-left px-4 py-2.5 text-sm text-text-primary hover:bg-bg-app flex items-center gap-2 cursor-pointer border-none bg-transparent opacity-50"
                  >
                    <BrandIcon brand="coros" size={22} />
                    Sync Coros
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Race Header */}
      <RaceHeader
        activeGoal={activeGoal}
        lastSynced={lastSynced}
        onSync={() => handleSyncActivities('strava')}
        syncLoading={isSyncing}
      />

      {/* Main content: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        {/* Main column (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* 3 Metric Cards */}
          <section className="grid grid-cols-3 gap-4">
            <MetricCard
              label="Weekly Miles"
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
              <div
                className="text-3xl font-bold text-text-primary"
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                {currentPaceRaw ? formatPace(currentPaceRaw) : '--:--'}
              </div>
              <span className="text-xs text-text-muted">/mi</span>
            </MetricCard>
            <MetricCard
              label="Training Load"
              value={weeklyRunCount}
              suffix=" runs"
              subtext={
                weeklyRunCount >= 5
                  ? 'High volume'
                  : weeklyRunCount >= 3
                    ? 'On track'
                    : 'Light week'
              }
              subtextColor={
                weeklyRunCount >= 5
                  ? 'var(--color-sage)'
                  : weeklyRunCount >= 3
                    ? 'var(--color-text-secondary)'
                    : 'var(--color-amber)'
              }
              icon={<LoadIcon />}
            />
          </section>

          {/* 7-Day Calendar Strip */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3
                className="text-sm font-semibold text-text-primary"
                style={{ fontFamily: 'var(--font-heading)' }}
              >
                This Week
              </h3>
              <Link
                to="/calendar"
                className="text-xs font-medium text-navy hover:text-navy-light transition-colors no-underline"
              >
                Full Calendar
              </Link>
            </div>
            <WeekCalendar compact={true} />
          </section>

          {/* Weekly Mileage Chart */}
          <section className="card p-5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-4"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Weekly Volume
            </h3>
            <div className="h-[240px]">
              {weeklyChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border-light)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="week"
                      tick={{
                        fontSize: 11,
                        fill: 'var(--color-text-muted)',
                      }}
                      tickLine={false}
                      axisLine={false}
                      dy={8}
                    />
                    <YAxis
                      tick={{
                        fontSize: 11,
                        fill: 'var(--color-text-muted)',
                      }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'var(--color-bg-elevated)' }}
                      contentStyle={tooltipStyle}
                    />
                    <Bar
                      dataKey="miles"
                      fill="var(--color-navy)"
                      radius={[4, 4, 0, 0]}
                      barSize={28}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-text-muted">
                  No data yet — sync your activities
                </div>
              )}
            </div>
          </section>

          {/* Pace Trend Chart */}
          <PaceTrendChart
            activities={activities}
            goalPace={goalPacePerMile}
          />

          {/* Recent Runs Table */}
          <section>
            <h3
              className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Recent Runs
            </h3>
            <RecentRunsTable activities={activities} onActivityDeleted={fetchActivities} />
          </section>
        </div>

        {/* Sidebar (1/3) */}
        <div className="space-y-6">
          {/* Readiness Gauge */}
          <div className="card p-5 flex flex-col items-center">
            <ReadinessGauge value={readinessScore} size={120} />
            <div className="w-full mt-4">
              <ReadinessBreakdown
                scores={readinessFactors}
                expanded={readinessExpanded}
                onToggle={() => setReadinessExpanded((v) => !v)}
              />
            </div>
          </div>

          {/* AI Insight */}
          <div className="card p-5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider text-text-muted mb-3"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              Coach Insight
            </h3>
            <CoachInsightBar
              message={
                coachInsight ||
                'Connect your training data to get personalized insights.'
              }
              className="!rounded-lg !border-0 !px-0 !py-0 !bg-transparent"
            />
          </div>

          {/* Today's Plan */}
          <TodaysPlanCard
            entry={todayEntry}
            onMarkComplete={handleMarkComplete}
          />

          {/* Cross Training Weekly Rollup */}
          <CrossTrainingCard activities={activities} onActivityDeleted={fetchActivities} />
        </div>
      </div>

      <ManualActivityModal
        isOpen={showLogModal}
        onClose={() => setShowLogModal(false)}
        onSuccess={() => fetchActivities()}
      />
    </>
  );
};

export default Dashboard;
