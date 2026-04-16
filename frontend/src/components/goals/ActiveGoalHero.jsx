import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LuFlag, LuCalendar, LuArrowRight } from 'react-icons/lu';
import StatusBadge from '../ui/StatusBadge';

const DIST_LABELS = [
  { label: 'Marathon',      meters: 42195, tolerance: 500 },
  { label: 'Half Marathon', meters: 21097, tolerance: 300 },
  { label: '10K',           meters: 10000, tolerance: 200 },
  { label: '5K',            meters: 5000,  tolerance: 200 },
];

const PLAN_WEEKS = { Marathon: 16, 'Half Marathon': 12, '10K': 8, '5K': 6 };

const TRAINING_PHASES = [
  { maxWeeks: 1,        label: 'Race Week', variant: 'danger' },
  { maxWeeks: 3,        label: 'Taper',     variant: 'warning' },
  { maxWeeks: 8,        label: 'Peak',      variant: 'coral' },
  { maxWeeks: 16,       label: 'Build',     variant: 'info' },
  { maxWeeks: Infinity, label: 'Base',      variant: 'neutral' },
];

function getPhase(weeksOut) {
  return TRAINING_PHASES.find(p => weeksOut <= p.maxWeeks) || TRAINING_PHASES[TRAINING_PHASES.length - 1];
}

function getPlanProgress(distLabel, weeksOut) {
  const total = PLAN_WEEKS[distLabel] || 16;
  const elapsed = Math.max(0, total - weeksOut);
  const pct = Math.min(100, (elapsed / total) * 100);
  return { elapsed, total, pct };
}

function namedDist(distMeters) {
  if (!distMeters) return null;
  for (const { label, meters, tolerance } of DIST_LABELS) {
    if (Math.abs(distMeters - meters) < tolerance) return label;
  }
  return null;
}

export default function ActiveGoalHero({
  goal,
  distLabel,
  targetTime,
  requiredPace,
  weeksOut,
  onDeactivate,
  onLogResult,
}) {
  const phase = getPhase(weeksOut);
  const named = namedDist(goal.distance_meters || goal.race_distance_meters);
  const { elapsed, total, pct } = getPlanProgress(named, weeksOut);
  const racePassed = new Date(goal.race_date) < new Date();
  const fmtDate = (d) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        background: 'var(--color-navy)',
        borderRadius: 20,
        padding: '28px 32px',
        boxShadow: '0 8px 40px rgba(27,37,89,0.22)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Coral left accent */}
      <div style={{
        position: 'absolute', top: 0, left: 0,
        width: 5, height: '100%',
        background: 'var(--color-coral)',
      }} />

      {/* Top row — badges + title + stats */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 20 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Badge row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{
              background: 'var(--color-coral)', color: '#fff',
              borderRadius: 5, padding: '3px 10px',
              fontSize: 10, fontWeight: 700, fontFamily: 'var(--font-sans)',
              textTransform: 'uppercase', letterSpacing: '0.07em',
            }}>
              {distLabel}
            </span>
            <StatusBadge label={phase.label} variant={phase.variant} size="sm" />
            <StatusBadge label="Active" variant="success" size="sm" dot />
          </div>

          {/* Race name */}
          <h2 style={{
            fontFamily: 'var(--font-heading)', fontSize: 26, fontWeight: 700,
            color: '#fff', lineHeight: 1, marginBottom: 7,
          }}>
            {goal.race_name}
          </h2>

          {/* Date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LuCalendar size={12} color="rgba(255,255,255,0.4)" />
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>
              {fmtDate(goal.race_date)}
            </span>
          </div>
        </div>

        {/* Stats block */}
        <div style={{ display: 'flex', alignItems: 'stretch', flexShrink: 0, gap: 0 }}>
          {[
            { value: targetTime || 'Just finish', label: 'Target Time',   size: 22, color: '#fff' },
            { value: requiredPace || '—',         label: 'Req. Pace',     size: 18, color: 'rgba(255,255,255,0.8)' },
            { value: `${weeksOut}w`,              label: 'To Race Day',   size: 28, color: 'var(--color-coral)' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
              {i > 0 && (
                <div style={{ width: 1, height: 44, background: 'rgba(255,255,255,0.1)', margin: '0 18px' }} />
              )}
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  fontFamily: 'var(--font-mono)', fontSize: s.size,
                  fontWeight: 700, color: s.color, lineHeight: 1,
                }}>
                  {s.value}
                </div>
                <div style={{
                  fontFamily: 'var(--font-sans)', fontSize: 10,
                  color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase',
                  letterSpacing: '0.07em', marginTop: 5,
                }}>
                  {s.label}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress bar */}
      {!racePassed && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: 'var(--font-sans)', fontSize: 10, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Training Progress
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
              Week {elapsed} of {total}
            </span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              height: '100%', width: `${pct}%`,
              background: 'var(--color-coral)',
              borderRadius: 99,
              transition: 'width 0.6s var(--ease-out)',
            }} />
          </div>
        </div>
      )}

      {/* Bottom row — actions */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.08)', gap: 12,
      }}>
        {racePassed ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              background: 'rgba(232,114,90,0.2)', color: 'var(--color-coral)',
              borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-sans)',
            }}>
              Race day has passed
            </span>
            <button
              onClick={() => onLogResult?.(goal)}
              style={{
                background: 'var(--color-coral)', border: 'none', borderRadius: 9,
                padding: '6px 14px', fontFamily: 'var(--font-sans)', fontSize: 12,
                fontWeight: 700, color: '#fff', cursor: 'pointer',
              }}
            >
              Log your result
            </button>
          </div>
        ) : (
          <Link
            to="/coach"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(232,114,90,0.18)', border: '1px solid rgba(232,114,90,0.3)',
              borderRadius: 9, padding: '7px 16px', fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 700, color: 'var(--color-coral)', textDecoration: 'none',
            }}
          >
            <LuFlag size={13} />
            Talk to Coach about this goal
            <LuArrowRight size={12} />
          </Link>
        )}

        <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
          <Link
            to={`/goals/${goal.id}/edit`}
            style={{
              background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 9, padding: '8px 16px', fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 600, color: '#fff', textDecoration: 'none',
              display: 'inline-flex', alignItems: 'center',
            }}
          >
            Edit
          </Link>
          <button
            onClick={() => onDeactivate?.(goal.id)}
            style={{
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 9, padding: '8px 14px', fontFamily: 'var(--font-sans)',
              fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.4)', cursor: 'pointer',
            }}
          >
            Deactivate
          </button>
        </div>
      </div>
    </motion.div>
  );
}
