import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { goalsAPI } from '../api/goals';
import { crossTrainingGoalsAPI } from '../api/crossTrainingGoals';
import { ACTIVITY_CONFIGS } from '../constants/activityTypes';

// ── Helpers ──────────────────────────────────────────────────────────────────

const METERS_PER_MILE = 1609.34;

const DIST_LABELS = [
  { label: 'Marathon',      meters: 42195, tolerance: 500 },
  { label: 'Half Marathon', meters: 21097, tolerance: 300 },
  { label: '10K',           meters: 10000, tolerance: 200 },
  { label: '5K',            meters: 5000,  tolerance: 200 },
];

const distanceLabel = (meters) => {
  if (!meters) return '—';
  for (const { label, meters: m, tolerance } of DIST_LABELS) {
    if (Math.abs(meters - m) < tolerance) return label;
  }
  return `${(meters / 1000).toFixed(1)} km`;
};

const secondsToHMS = (seconds) => {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const derivePace = (targetSeconds, distanceMeters) => {
  if (!targetSeconds || !distanceMeters) return null;
  const miles = distanceMeters / METERS_PER_MILE;
  const paceSeconds = targetSeconds / miles;
  const min = Math.floor(paceSeconds / 60);
  const sec = Math.floor(paceSeconds % 60);
  return `${min}:${String(sec).padStart(2, '0')}/mi`;
};

const weeksUntil = (dateStr) =>
  Math.max(0, Math.ceil((new Date(dateStr) - new Date()) / (7 * 24 * 3600 * 1000)));

const fmtDate = (d) =>
  new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const timeDiffSec = (targetSec, resultSec) => {
  const diff = targetSec - resultSec;
  const abs = Math.abs(diff);
  const m = Math.floor(abs / 60);
  const s = abs % 60;
  return { faster: diff > 0, str: `${m}:${String(s).padStart(2, '0')}` };
};

// ── Section Label ─────────────────────────────────────────────────────────────

const SLabel = ({ children, action }) => (
  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
    <span style={{
      fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700,
      color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.1em',
    }}>
      {children}
    </span>
    {action}
  </div>
);

// ── Cross-Training Modal ──────────────────────────────────────────────────────

const CT_TYPES = Object.entries(ACTIVITY_CONFIGS)
  .filter(([type]) => type !== 'run')
  .map(([id, cfg]) => ({ id, label: cfg.label, icon: cfg.icon }));

const CrossTargetModal = ({ onClose, onSave }) => {
  const [type, setType] = useState('cycling');
  const [sessions, setSessions] = useState(2);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,37,89,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: 460, maxHeight: '90vh', overflowY: 'auto', padding: 28, boxShadow: '0 20px 60px rgba(27,37,89,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--color-navy)' }}>
            Add Cross-Training Target
          </h2>
          <button
            onClick={onClose}
            style={{ background: '#ECEEF4', border: 'none', borderRadius: '50%', width: 30, height: 30, fontSize: 18, color: '#4A5173', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10, fontFamily: 'var(--font-sans)' }}>
          Activity Type
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 20 }}>
          {CT_TYPES.map((ct) => (
            <button
              key={ct.id}
              onClick={() => setType(ct.id)}
              style={{
                padding: '10px 8px', borderRadius: 10,
                border: `2px solid ${type === ct.id ? 'var(--color-navy)' : '#D4D8E8'}`,
                background: type === ct.id ? 'var(--color-navy)' : '#fff',
                color: type === ct.id ? '#fff' : 'var(--color-navy)',
                fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <span>{ct.icon}</span>{ct.label}
            </button>
          ))}
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7, fontFamily: 'var(--font-sans)' }}>
            Sessions / Week
          </div>
          <input
            type="number" min={1} max={7} value={sessions}
            onChange={(e) => setSessions(Number(e.target.value))}
            style={{ width: '100%', border: '1.5px solid #D4D8E8', borderRadius: 10, padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 18, color: 'var(--color-navy)', outline: 'none', textAlign: 'center' }}
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, background: '#ECEEF4', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#4A5173', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave(type, sessions)}
            style={{ flex: 2, background: 'var(--color-navy)', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
          >
            Add Target
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Log Result Modal ──────────────────────────────────────────────────────────

const LogResultModal = ({ goal, onClose, onSave }) => {
  const [time, setTime] = useState(() => {
    if (!goal.result_time_seconds) return '';
    const h = Math.floor(goal.result_time_seconds / 3600);
    const m = Math.floor((goal.result_time_seconds % 3600) / 60);
    const s = goal.result_time_seconds % 60;
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  });
  const [pr, setPr] = useState(goal.is_pr || false);
  const isEditing = !!goal.result_time_seconds;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(27,37,89,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 20, width: 420, padding: 28, boxShadow: '0 20px 60px rgba(27,37,89,0.25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 700, color: 'var(--color-navy)' }}>
              {isEditing ? 'Edit Race Result' : 'Log Race Result'}
            </h2>
            <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B93B0', marginTop: 3 }}>{goal.race_name}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: '#ECEEF4', border: 'none', borderRadius: '50%', width: 30, height: 30, fontSize: 18, color: '#4A5173', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            ×
          </button>
        </div>

        <div style={{ fontSize: 11, fontWeight: 700, color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 7, fontFamily: 'var(--font-sans)' }}>
          Finish Time
        </div>
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          placeholder="HH:MM:SS"
          style={{ width: '100%', border: '1.5px solid #D4D8E8', borderRadius: 10, padding: '12px 14px', fontFamily: 'var(--font-mono)', fontSize: 22, color: 'var(--color-navy)', outline: 'none', textAlign: 'center', letterSpacing: '0.1em', marginBottom: 16 }}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22, cursor: 'pointer' }}>
          <div
            style={{ width: 36, height: 20, borderRadius: 99, background: pr ? '#FFF3CD' : '#ECEEF4', border: `1px solid ${pr ? '#F5A623' : '#D4D8E8'}`, position: 'relative', transition: 'all 0.2s', flexShrink: 0 }}
            onClick={() => setPr(!pr)}
          >
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: pr ? '#856404' : '#fff', position: 'absolute', top: 2, left: pr ? 18 : 2, transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
          </div>
          <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#4A5173' }}>New personal best</span>
        </label>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{ flex: 1, background: '#ECEEF4', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#4A5173', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            onClick={() => onSave({ time, pr })}
            disabled={!time}
            style={{ flex: 2, background: time ? 'var(--color-navy)' : '#D4D8E8', border: 'none', borderRadius: 10, padding: 11, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: time ? '#fff' : '#8B93B0', cursor: time ? 'pointer' : 'default' }}
          >
            Save Result
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main Page ─────────────────────────────────────────────────────────────────

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [settingActiveId, setSettingActiveId] = useState(null);
  const [logGoal, setLogGoal] = useState(null);
  const [showCrossModal, setShowCrossModal] = useState(false);
  const [completedOpen, setCompletedOpen] = useState(true);
  const [completedPage, setCompletedPage] = useState(0);
  const [ctGoals, setCtGoals] = useState([]);
  const [ctProgress, setCtProgress] = useState({});
  const [toast, setToast] = useState({ visible: false, msg: '' });

  const showToast = (msg) => {
    setToast({ visible: true, msg });
    setTimeout(() => setToast({ visible: false, msg: '' }), 2800);
  };

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsAPI.getGoals();
      setGoals(response.goals || []);
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCTGoals = async () => {
    try {
      const data = await crossTrainingGoalsAPI.getGoals();
      setCtGoals(data.goals || []);
      setCtProgress(data.weekly_progress || {});
    } catch (err) {
      console.error('Failed to fetch CT goals:', err);
    }
  };

  useEffect(() => {
    fetchGoals();
    fetchCTGoals();
  }, []);

  const handleSetActive = async (goalId) => {
    try {
      setSettingActiveId(goalId);
      await goalsAPI.setActive(goalId);
      await fetchGoals();
    } catch (err) {
      console.error('Failed to set active:', err);
    } finally {
      setSettingActiveId(null);
    }
  };

  const handleDeactivate = async (goalId) => {
    try {
      await goalsAPI.updateGoal(goalId, { is_active: false });
      await fetchGoals();
    } catch (err) {
      console.error('Failed to deactivate:', err);
    }
  };

  const handleLogResult = async ({ time, pr }) => {
    if (!logGoal) return;
    try {
      const parts = time.split(':').map(Number);
      const secs = parts.length === 3
        ? parts[0] * 3600 + parts[1] * 60 + parts[2]
        : parts[0] * 60 + (parts[1] || 0);
      await goalsAPI.logResult(logGoal.id, { result_time_seconds: secs, is_pr: pr });
      setLogGoal(null);
      showToast('Result logged!');
      await fetchGoals();
    } catch (err) {
      console.error('Failed to log result:', err);
    }
  };

  const handleAddCT = async (type, sessions) => {
    try {
      await crossTrainingGoalsAPI.upsertGoal(type, sessions);
      setShowCrossModal(false);
      showToast('Target added!');
      await fetchCTGoals();
    } catch (err) {
      console.error('Failed to add CT goal:', err);
    }
  };

  const handleDeleteCT = async (id) => {
    try {
      await crossTrainingGoalsAPI.deleteGoal(id);
      await fetchCTGoals();
    } catch (err) {
      console.error('Failed to delete CT goal:', err);
    }
  };

  const { active, upcoming, completed } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let activeGoal = null;
    const up = [];
    const done = [];
    goals.forEach((g) => {
      if (g.is_active) {
        activeGoal = g;
      } else if (new Date(g.race_date) > today) {
        up.push(g);
      } else {
        done.push(g);
      }
    });
    return { active: activeGoal, upcoming: up, completed: done };
  }, [goals]);

  if (loading) {
    return (
      <div className="card text-center py-12">
        <p className="text-text-secondary">Loading goals...</p>
      </div>
    );
  }

  const totalUpcoming = (active ? 1 : 0) + upcoming.length;

  return (
    <div>
      <style>{`
        .goal-card:hover { transform: translateY(-2px) !important; box-shadow: 0 6px 28px rgba(27,37,89,0.12) !important; }
        .completed-row:hover { background: #F8F9FC !important; }
      `}</style>

      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: 'var(--color-navy)' }}>
            Race Goals
          </h1>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B93B0', marginTop: 2 }}>
            {totalUpcoming} upcoming · {completed.length} completed
          </p>
        </div>
        <Link to="/goals/new" className="btn btn-primary btn-sm">+ New Goal</Link>
      </div>

      {goals.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '48px 32px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🏁</div>
          <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 18, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 8 }}>
            Create your first race goal
          </h2>
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: 14, color: '#8B93B0', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            Set a race goal to unlock personalized training, AI coaching, and readiness tracking.
          </p>
          <Link to="/goals/new" className="btn btn-primary" style={{ padding: '12px 36px' }}>Create Goal</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

          {/* ① Active Goal Hero */}
          {active && (
            <div>
              <SLabel>Active Goal</SLabel>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                style={{ background: 'var(--color-navy)', borderRadius: 20, padding: '28px 32px', boxShadow: '0 8px 40px rgba(27,37,89,0.22)', position: 'relative', overflow: 'hidden' }}
              >
                {/* Coral accent bar */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: 5, height: '100%', background: 'var(--color-coral)' }} />

                {/* Top row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, gap: 24 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <span style={{ background: 'var(--color-coral)', color: '#fff', borderRadius: 5, padding: '3px 10px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                        {distanceLabel(active.distance_meters || active.race_distance_meters)}
                      </span>
                      <span style={{ background: 'rgba(46,204,139,0.18)', color: '#2ECC8B', borderRadius: 5, padding: '3px 9px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                        Active
                      </span>
                    </div>
                    <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1, marginBottom: 7 }}>
                      {active.race_name}
                    </h2>
                    <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
                      {fmtDate(active.race_date)}
                    </p>
                  </div>

                  {/* Stats row */}
                  <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0 }}>
                    {[
                      {
                        value: secondsToHMS(active.target_time_seconds) || 'Just finish',
                        label: 'Target Time',
                        size: 26,
                        color: '#fff',
                      },
                      {
                        value: derivePace(active.target_time_seconds, active.distance_meters || active.race_distance_meters) || '—',
                        label: 'Required Pace',
                        size: 20,
                        color: 'rgba(255,255,255,0.8)',
                      },
                      {
                        value: `${weeksUntil(active.race_date)}w`,
                        label: 'To Race Day',
                        size: 30,
                        color: 'var(--color-coral)',
                      },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
                        {i > 0 && <div style={{ width: 1, height: 50, background: 'rgba(255,255,255,0.1)', margin: '0 20px' }} />}
                        <div style={{ textAlign: 'center' }}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: s.size, fontWeight: 700, color: s.color, lineHeight: 1 }}>
                            {s.value}
                          </div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 5 }}>
                            {s.label}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', gap: 16 }}>
                  {new Date(active.race_date) < new Date() ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ background: 'rgba(232,114,90,0.2)', color: 'var(--color-coral)', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                        Race day has passed
                      </span>
                      <button
                        onClick={() => setLogGoal(active)}
                        style={{ background: 'var(--color-coral)', border: 'none', borderRadius: 9, padding: '6px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                      >
                        Log your result
                      </button>
                    </div>
                  ) : (
                    active.notes ? (
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: 'rgba(255,255,255,0.32)', fontStyle: 'italic', maxWidth: 260, margin: 0 }}>
                        "{active.notes}"
                      </p>
                    ) : <div />
                  )}
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Link
                      to={`/goals/${active.id}/edit`}
                      style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 9, padding: '8px 16px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeactivate(active.id)}
                      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 9, padding: '8px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}
                    >
                      Deactivate
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}

          {/* ② Upcoming Goals */}
          <div>
            <SLabel action={<span style={{ fontFamily: 'var(--font-sans)', fontSize: 11, color: '#8B93B0' }}>{upcoming.length} planned</span>}>
              Upcoming Goals
            </SLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
              {upcoming.map((g, i) => {
                const dist = distanceLabel(g.distance_meters || g.race_distance_meters);
                const pace = derivePace(g.target_time_seconds, g.distance_meters || g.race_distance_meters);
                const wks = weeksUntil(g.race_date);
                return (
                  <motion.div
                    key={g.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.05 }}
                    className="goal-card"
                    style={{ background: '#fff', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 2px rgba(27,37,89,0.05),0 2px 12px rgba(27,37,89,0.04)', transition: 'transform 0.15s, box-shadow 0.15s' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                      <div>
                        <span style={{ background: '#ECEEF4', color: '#4A5173', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                          {dist}
                        </span>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', marginTop: 8, marginBottom: 3, lineHeight: 1.2 }}>
                          {g.race_name}
                        </h3>
                        <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B93B0' }}>{fmtDate(g.race_date)}</p>
                      </div>
                      <div style={{ background: '#F8F9FC', borderRadius: 9, padding: '5px 10px', flexShrink: 0, marginTop: 2, textAlign: 'center' }}>
                        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: 'var(--color-navy)', lineHeight: 1 }}>{wks}w</div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#8B93B0', marginTop: 2 }}>out</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 18, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #ECEEF4' }}>
                      {[
                        g.target_time_seconds && { v: secondsToHMS(g.target_time_seconds), l: 'Target' },
                        pace && { v: pace, l: 'Req. Pace' },
                      ].filter(Boolean).map((s, j) => (
                        <div key={j}>
                          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)' }}>{s.v}</div>
                          <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#8B93B0', marginTop: 2 }}>{s.l}</div>
                        </div>
                      ))}
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleSetActive(g.id)}
                        disabled={settingActiveId === g.id}
                        style={{ flex: 1, background: 'var(--color-navy)', border: 'none', borderRadius: 9, padding: 8, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                      >
                        {settingActiveId === g.id ? 'Setting...' : 'Set as Active'}
                      </button>
                      <Link
                        to={`/goals/${g.id}/edit`}
                        style={{ flex: 1, background: '#F8F9FC', border: '1px solid #D4D8E8', borderRadius: 9, padding: 8, fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#4A5173', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        Edit
                      </Link>
                    </div>
                  </motion.div>
                );
              })}

              {/* Add Race Goal dashed card */}
              <Link
                to="/goals/new"
                style={{ background: 'transparent', border: '2px dashed #D4D8E8', borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 10, minHeight: 160, textDecoration: 'none', transition: 'border-color 0.15s, background 0.15s' }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.background = '#F8F9FC'; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D4D8E8'; e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#ECEEF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, color: '#8B93B0' }}>+</div>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#8B93B0' }}>Add Race Goal</span>
              </Link>
            </div>
          </div>

          {/* ③ Weekly Cross-Training Targets */}
          <div>
            <SLabel action={
              <button
                onClick={() => setShowCrossModal(true)}
                style={{ background: 'none', border: 'none', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: 'var(--color-coral)', cursor: 'pointer' }}
              >
                + Add Target
              </button>
            }>
              Weekly Cross-Training Targets
            </SLabel>

            {ctGoals.length === 0 ? (
              <div className="card" style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>🏋️</div>
                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#8B93B0', marginBottom: 14 }}>
                  No cross-training targets yet. Add one above!
                </p>
                <button
                  onClick={() => setShowCrossModal(true)}
                  style={{ background: 'var(--color-navy)', border: 'none', borderRadius: 9, padding: '8px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                >
                  + Add Target
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
                {ctGoals.map((ct) => {
                  const cfg = ACTIVITY_CONFIGS[ct.activity_type] || ACTIVITY_CONFIGS.workout;
                  const done = ctProgress[ct.activity_type] || 0;
                  const pct = Math.min(100, Math.round((done / ct.sessions_per_week) * 100));
                  return (
                    <div key={ct.id} className="card" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F8F9FC', border: '1px solid #ECEEF4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                        {cfg.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 700, color: 'var(--color-navy)', marginBottom: 2 }}>
                          {cfg.label}
                        </div>
                        <div style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B93B0', marginBottom: 6 }}>
                          {done}/{ct.sessions_per_week} this week
                        </div>
                        <div style={{ height: 4, background: '#ECEEF4', borderRadius: 99, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: pct >= 100 ? 'var(--color-sage)' : cfg.color, borderRadius: 99, transition: 'width 0.3s' }} />
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteCT(ct.id)}
                        style={{ background: 'none', border: 'none', color: '#8B93B0', fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}
                      >
                        ✕
                      </button>
                    </div>
                  );
                })}
                <button
                  onClick={() => setShowCrossModal(true)}
                  style={{ background: 'transparent', border: '2px dashed #D4D8E8', borderRadius: 16, padding: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: 84, transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-navy)'; e.currentTarget.style.background = '#F8F9FC'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#D4D8E8'; e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600, color: '#8B93B0' }}>+ Add Target</span>
                </button>
              </div>
            )}
          </div>

          {/* ④ Completed Goals */}
          <div>
            <button
              onClick={() => setCompletedOpen((v) => !v)}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', background: 'none', border: 'none', marginBottom: completedOpen ? 14 : 0, cursor: 'pointer', padding: '2px 0' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, fontWeight: 700, color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Completed Goals
                </span>
                <span style={{ background: '#ECEEF4', color: '#4A5173', borderRadius: 99, padding: '1px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                  {completed.length}
                </span>
              </div>
              <span style={{ fontSize: 12, color: '#8B93B0', display: 'inline-block', transform: completedOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.25s' }}>
                ▾
              </span>
            </button>

            <AnimatePresence>
              {completedOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  style={{ overflow: 'hidden' }}
                >
                  {completed.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '32px 0' }}>
                      <p style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: '#8B93B0' }}>
                        No completed races yet — go get one
                      </p>
                    </div>
                  ) : (() => {
                    const PAGE_SIZE = 6;
                    const totalPages = Math.ceil(completed.length / PAGE_SIZE);
                    const page = Math.min(completedPage, totalPages - 1);
                    const pageItems = completed.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
                    return (
                    <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 14 }}>
                      {pageItems.map((c, i) => {
                        const hasDiff = c.target_time_seconds && c.result_time_seconds;
                        const diff = hasDiff ? timeDiffSec(c.target_time_seconds, c.result_time_seconds) : null;
                        const needsResult = !c.result_time_seconds;

                        // Border and accent color based on outcome
                        let accentColor = '#D4D8E8'; // default: no result
                        let accentBg = '#F8F9FC';
                        if (diff) {
                          accentColor = diff.faster ? '#2ECC8B' : 'var(--color-coral)';
                          accentBg = diff.faster ? '#F0FBF6' : '#FEF4F2';
                        } else if (c.result_time_seconds && !c.target_time_seconds) {
                          accentColor = 'var(--color-sage)';
                          accentBg = '#F2F7EF';
                        }

                        return (
                          <motion.div
                            key={c.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.25, delay: i * 0.04 }}
                            style={{
                              background: accentBg,
                              borderRadius: 16,
                              border: `1.5px solid ${accentColor}`,
                              padding: '20px 22px',
                              position: 'relative',
                              overflow: 'hidden',
                            }}
                          >
                            {/* Left accent bar */}
                            <div style={{ position: 'absolute', top: 0, left: 0, width: 4, height: '100%', background: accentColor, borderRadius: '16px 0 0 16px' }} />

                            {/* Top row: name + badges */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                                  <span style={{ background: '#ECEEF4', color: '#4A5173', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                                    {distanceLabel(c.distance_meters || c.race_distance_meters)}
                                  </span>
                                  {c.is_pr && (
                                    <span style={{ background: '#FFF3CD', color: '#856404', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                                      PR
                                    </span>
                                  )}
                                  {needsResult && (
                                    <span style={{ background: 'rgba(229,168,48,0.15)', color: '#B8860B', borderRadius: 5, padding: '2px 8px', fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>
                                      No result
                                    </span>
                                  )}
                                </div>
                                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: 'var(--color-navy)', margin: 0, lineHeight: 1.2 }}>
                                  {c.race_name}
                                </h3>
                                <p style={{ fontFamily: 'var(--font-sans)', fontSize: 12, color: '#8B93B0', marginTop: 3 }}>
                                  {fmtDate(c.race_date)}
                                </p>
                              </div>
                              {diff && (
                                <div style={{ textAlign: 'center', flexShrink: 0 }}>
                                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: accentColor, lineHeight: 1 }}>
                                    {diff.faster ? '−' : '+'}{diff.str}
                                  </div>
                                  <div style={{ fontFamily: 'var(--font-sans)', fontSize: 9, color: '#8B93B0', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>
                                    {diff.faster ? 'under goal' : 'over goal'}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Times + actions row */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 14, borderTop: `1px solid ${accentColor}33`, gap: 12 }}>
                              {/* Times */}
                              <div style={{ display: 'flex', gap: 20 }}>
                                {c.target_time_seconds && (
                                  <div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 600, color: '#8B93B0', lineHeight: 1 }}>
                                      {secondsToHMS(c.target_time_seconds)}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#8B93B0', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                      Goal
                                    </div>
                                  </div>
                                )}
                                {c.target_time_seconds && c.result_time_seconds && (
                                  <div style={{ width: 1, background: `${accentColor}55`, alignSelf: 'stretch' }} />
                                )}
                                {c.result_time_seconds && (
                                  <div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 17, fontWeight: 700, color: 'var(--color-navy)', lineHeight: 1 }}>
                                      {secondsToHMS(c.result_time_seconds)}
                                    </div>
                                    <div style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: '#8B93B0', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                      Result
                                    </div>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div style={{ display: 'flex', gap: 7, flexShrink: 0 }}>
                                <Link
                                  to={`/goals/${c.id}/edit`}
                                  style={{ background: '#ECEEF4', border: 'none', borderRadius: 9, padding: '7px 13px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: '#4A5173', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
                                >
                                  Edit
                                </Link>
                                <button
                                  onClick={() => setLogGoal(c)}
                                  style={{ background: 'var(--color-navy)', border: 'none', borderRadius: 9, padding: '7px 13px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 700, color: '#fff', cursor: 'pointer' }}
                                >
                                  {c.result_time_seconds ? 'Edit result' : 'Log result'}
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                    {totalPages > 1 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 16 }}>
                        <button
                          onClick={() => setCompletedPage(p => Math.max(0, p - 1))}
                          disabled={page === 0}
                          style={{ background: page === 0 ? '#ECEEF4' : 'var(--color-navy)', border: 'none', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: page === 0 ? '#8B93B0' : '#fff', cursor: page === 0 ? 'default' : 'pointer' }}
                        >
                          ← Prev
                        </button>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#8B93B0' }}>
                          {page + 1} / {totalPages}
                        </span>
                        <button
                          onClick={() => setCompletedPage(p => Math.min(totalPages - 1, p + 1))}
                          disabled={page === totalPages - 1}
                          style={{ background: page === totalPages - 1 ? '#ECEEF4' : 'var(--color-navy)', border: 'none', borderRadius: 8, padding: '6px 14px', fontFamily: 'var(--font-sans)', fontSize: 12, fontWeight: 600, color: page === totalPages - 1 ? '#8B93B0' : '#fff', cursor: page === totalPages - 1 ? 'default' : 'pointer' }}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                    </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      )}

      {/* Modals */}
      {showCrossModal && <CrossTargetModal onClose={() => setShowCrossModal(false)} onSave={handleAddCT} />}
      {logGoal && <LogResultModal goal={logGoal} onClose={() => setLogGoal(null)} onSave={handleLogResult} />}

      {/* Toast */}
      <div style={{
        position: 'fixed', bottom: 28, left: '50%',
        transform: `translateX(-50%) translateY(${toast.visible ? 0 : 16}px)`,
        opacity: toast.visible ? 1 : 0, transition: 'all 0.3s ease',
        background: 'var(--color-sage)', color: '#fff', borderRadius: 12,
        padding: '9px 20px', fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 600,
        boxShadow: '0 4px 20px rgba(91,140,62,0.3)', zIndex: 999, pointerEvents: 'none',
      }}>
        ✓ {toast.msg}
      </div>
    </div>
  );
};

export default Goals;
