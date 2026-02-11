import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { getErrorMessage } from '../api/client';
import AnimatedNumber from '../components/AnimatedNumber';
import WeekCalendar from '../components/WeekCalendar';
import ActiveGoalBanner from '../components/ActiveGoalBanner';
import MetricCard from '../components/MetricCard';
import ReadinessGauge from '../components/ReadinessGauge';
import CoachInsightBar from '../components/CoachInsightBar';
import DashboardTabs from '../components/DashboardTabs';


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
      await stravaAPI.syncActivities();
      await fetchActivities();
    } catch (error) {
      console.error('Failed to sync activities:', error);
      setSyncError(getErrorMessage(error));
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

  const getInsightMessage = () => {
    const runs = countWeeklyRuns();
    const mileage = weeklyMileageActual;
    const target = getWeeklyMileageTarget();

    if (!activeGoal) return "Set a race goal to get personalized coaching insights.";
    if (totalDays <= 14) return "Taper time! Reduce volume by 40-50% this week. Focus on rest, nutrition, and mental prep for race day.";
    if (runs === 0 && mileage === 0) return "No runs logged this week yet. Lace up and get moving — consistency beats intensity.";
    if (mileage >= target) return `Great week — you've hit ${mileage} mi against a ${target} mi target. Don't skip your rest day; recovery is where adaptation happens.`;
    if (paceDiff !== null && paceDiff < -5) return `You're running ${Math.abs(paceDiff)}s per mile faster than goal pace. Dial back on easy days to save energy for key workouts.`;
    if (paceDiff !== null && paceDiff > 10) return `Pace is ${paceDiff}s off your target — don't stress. Focus on building aerobic base; speed will come.`;
    if (runs >= 3) return `Solid consistency with ${runs} runs this week. Keep the easy days truly easy and bring intensity only to key sessions.`;
    return `${mileage} miles so far this week. Aim for ${target} mi — small consistent efforts add up over ${Math.ceil(totalDays / 7)} weeks to race day.`;
  };

  const weeklyTarget = getWeeklyMileageTarget();

  // Readiness score: simple heuristic combining mileage %, consistency, and pace
  const readinessScore = useMemo(() => {
    const mileagePct = Math.min(100, (weeklyMileageActual / weeklyTarget) * 100);
    const consistencyBonus = countWeeklyRuns() >= 3 ? 20 : countWeeklyRuns() >= 1 ? 10 : 0;
    const paceBonus = paceDiff !== null ? (Math.abs(paceDiff) < 10 ? 15 : 5) : 0;
    return Math.min(100, Math.round(mileagePct * 0.5 + consistencyBonus + paceBonus + trainingProgress * 0.15));
  }, [weeklyMileageActual, weeklyTarget, trainingProgress, paceDiff, activities]);

  // Consistency: count of weeks with 3+ runs out of last 4
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

  // --- Chart data ---
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

  return (
    <>
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

      {/* Row 3: Metric Cards */}
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
        />
        <MetricCard
          label="Avg Pace"
          subtext={paceStatus().text}
          subtextColor={paceStatus().color}
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
        />
      </section>

      {/* Row 4: Coach Insight */}
      <CoachInsightBar message={getInsightMessage()} className="mt-6" />

      {/* Row 5: Sync bar */}
      <div className="flex items-center justify-end gap-3 mt-6">
        {syncError && <span className="text-xs text-error">{syncError}</span>}
        <button onClick={handleSyncActivities} className="btn btn-ghost btn-sm text-xs">
          Sync Activities
        </button>
      </div>

      {/* Row 6: Tabbed Content */}
      <DashboardTabs
        chartData={weeklyChartData}
        paceData={paceChartData}
        activities={activities}
        formatPace={formatPace}
        metersToMiles={metersToMiles}
        formatDate={formatDate}
        className="mt-2"
      />
    </>
  );
};

export default Dashboard;
