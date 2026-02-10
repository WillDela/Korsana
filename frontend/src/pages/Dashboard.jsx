import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useAuth } from '../context/AuthContext';
import { goalsAPI } from '../api/goals';
import { stravaAPI } from '../api/strava';
import { profileAPI } from '../api/profile';
import { getErrorMessage } from '../api/client';
import AnimatedNumber from '../components/AnimatedNumber';
import { StaggerContainer, StaggerItem } from '../components/StaggerContainer';
import { SkeletonCard, SkeletonRow, SkeletonRaceHeader, SkeletonSidebarCard } from '../components/Skeleton';
import TypewriterText from '../components/TypewriterText';
import Navbar from '../components/Navbar';
import WeekCalendar from '../components/WeekCalendar';


const Dashboard = () => {
  const { user, logout } = useAuth();
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

      // If no activities but user might have Strava connected, try syncing once
      if (!response.activities || response.activities.length === 0) {
        try {
          await stravaAPI.syncActivities();
          const syncedResponse = await stravaAPI.getActivities();
          setActivities(syncedResponse.activities || []);
        } catch (syncError) {
          // Sync failed, just show empty activities (user may not have Strava connected)
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
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar variant="dashboard" />

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-[1400px]">
        {/* Header Section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-serif font-bold text-deep-green tracking-tight">
              Training Hub
            </h1>
            <div className="flex items-center gap-3 mt-2 text-slate-500 font-medium">
              <span>{user?.email}'s Workspace</span>
              <span className="w-1 h-1 rounded-full bg-slate-300"></span>
              <span className="text-secondary flex items-center gap-1">
                {activeGoal ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                    {activeGoal.race_name} Prep
                  </>
                ) : 'Off-Season'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Action Buttons */}
            {!isConnected && (
              <button onClick={handleConnectStrava} className="btn btn-outline text-sm">
                Connect Strava
              </button>
            )}
            <Link to="/goals" className="btn btn-white border border-gray-200 text-slate-600 hover:text-primary hover:border-primary/30 shadow-sm text-sm">
              Manage Goal
            </Link>
            <button onClick={handleSyncActivities} className="btn btn-primary text-sm shadow-lg shadow-primary/20">
              Sync Data
            </button>
          </div>
        </header>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* 1. Main Insight / Readiness (Top Left) - Span 8 */}
          <div className="col-span-12 md:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none transition-opacity group-hover:opacity-10">
              <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>

            <div className="relative z-10 h-full flex flex-col justify-between">
              <div>
                <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4">Coach Insight</h3>
                <div className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-secondary to-deep-green flex items-center justify-center text-white font-bold shrink-0 shadow-md">
                    AI
                  </div>
                  <div>
                    <div className="text-xl md:text-2xl font-serif text-deep-green leading-relaxed max-w-2xl">
                      <TypewriterText text={getInsightMessage()} speed={15} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-50 flex items-center gap-6 text-sm">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase">Condition</span>
                  <span className="text-deep-green font-bold">Building Base</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase">Readiness</span>
                  <span className="text-deep-green font-bold">{trainingProgress}%</span>
                </div>
                <Link to="/coach" className="ml-auto text-primary font-medium hover:text-secondary transition-colors">
                  View Analysis →
                </Link>
              </div>
            </div>
          </div>

          {/* 2. Key Stats Column (Top Right) - Span 4 */}
          <div className="col-span-12 md:col-span-4 flex flex-col gap-6">
            {/* Countdown Card */}
            <div className="flex-1 bg-deep-green text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute inset-0 bg-secondary/10 opacity-50 texture-topography mix-blend-overlay"></div>
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="text-white/60 text-xs font-bold uppercase tracking-widest mb-1">Race Day</div>
                  <div className="text-white font-serif font-bold text-lg">{activeGoal ? activeGoal.race_name : 'No Goal Set'}</div>
                </div>

                <div className="mt-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-mono font-bold tracking-tighter">
                      <AnimatedNumber value={totalDays} />
                    </span>
                    <span className="text-secondary font-medium">days</span>
                  </div>
                  <div className="w-full bg-white/10 h-1.5 rounded-full mt-4 overflow-hidden">
                    <div className="bg-secondary h-full rounded-full" style={{ width: `${trainingProgress}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weekly Volume Mini-Card */}
            <div className="flex-1 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-2">
                <h4 className="text-slate-400 text-xs font-bold uppercase tracking-widest">Weekly Volume</h4>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${weeklyMileageActual >= weeklyTarget ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                  {Math.round((weeklyMileageActual / weeklyTarget) * 100)}%
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-mono font-bold text-deep-green">
                  <AnimatedNumber value={weeklyMileageActual} decimals={1} />
                </span>
                <span className="text-slate-400 text-sm font-medium">/ {weeklyTarget} mi</span>
              </div>
            </div>
          </div>

          {/* 3. Main Chart (Middle) - Span 8 */}
          <div className="col-span-12 md:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm min-h-[350px]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-deep-green font-serif">Volume & Intensity</h3>
              <div className="flex gap-2">
                <span className="w-3 h-3 rounded-full bg-primary"></span><span className="text-xs text-slate-500">Miles</span>
              </div>
            </div>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="miles" fill="#242E7B" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. Recent List (Middle Right) - Span 4 */}
          <div className="col-span-12 md:col-span-4 bg-white rounded-2xl border border-gray-100 p-0 shadow-sm overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-bold text-deep-green font-serif">Recent Runs</h3>
              <Link to="/activities" className="text-xs font-bold text-primary hover:text-secondary uppercase tracking-wider">
                View All
              </Link>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[300px]">
              {loadingActivities ? (
                <div className="p-6 space-y-4">
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </div>
              ) : activities.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">No runs yet.</div>
              ) : (
                <table className="w-full text-left text-sm">
                  <tbody>
                    {activities.slice(0, 5).map((activity, i) => (
                      <tr key={i} className="border-b border-gray-50 last:border-0 hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-deep-green">{formatDate(activity.start_time)}</div>
                          <div className="text-xs text-slate-400">{activity.name}</div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="font-mono font-medium text-deep-green">{metersToMiles(activity.distance_meters)} mi</div>
                          <div className="text-xs font-mono text-slate-400">{formatPace(activity.average_pace_seconds_per_km)}/mi</div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* 5. Training Calendar Preview - Full Width */}
          <div className="col-span-12 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-deep-green font-serif">This Week</h3>
              <Link to="/calendar" className="text-xs font-bold text-primary hover:text-secondary uppercase tracking-wider">
                Full Calendar →
              </Link>
            </div>
            <WeekCalendar compact={true} />
          </div>

        </div>
      </main>
    </div>
  );
};

export default Dashboard;
