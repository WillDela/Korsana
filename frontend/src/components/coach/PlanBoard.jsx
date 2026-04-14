import { motion } from 'framer-motion';
import WorkoutCard from '../ui/WorkoutCard';

// Map backend workout_type strings → WorkoutCard type names
const TYPE_MAP = {
  easy:        'Easy',
  long:        'Long Run',
  tempo:       'Tempo',
  interval:    'Intervals',
  intervals:   'Intervals',
  recovery:    'Recovery',
  rest:        'Rest',
  race:        'Tempo',
  cross_train: 'Cross-Train',
  cycling:     'Cycling',
  swimming:    'Swimming',
};

function normalizeType(raw) {
  return TYPE_MAP[raw?.toLowerCase()] ?? 'Easy';
}

function distanceMi(km) {
  if (!km || km <= 0) return null;
  return +(km * 0.621371).toFixed(1);
}

function dayLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00'); // avoid timezone shifting
  return {
    day:  d.toLocaleDateString('en-US', { weekday: 'short' }),
    date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
  };
}

export default function PlanBoard({ planData, onConfirm, onDiscard, isSaving }) {
  if (!planData?.plan?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      style={{ margin: '0 16px 8px' }}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{
            fontFamily: 'var(--font-heading)', fontWeight: 700,
            fontSize: '14px', color: '#1B2559',
          }}>
            7-Day Training Plan
          </span>
          <span style={{
            fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
            textTransform: 'uppercase', letterSpacing: '0.06em',
            padding: '2px 7px', borderRadius: '4px',
            background: '#1B2559', color: '#FFFFFF',
          }}>
            Preview
          </span>
        </div>
      </div>

      {planData.summary && (
        <p style={{
          fontFamily: 'var(--font-sans)', fontSize: '12px',
          color: '#4A5173', marginBottom: '12px', lineHeight: 1.6,
        }}>
          {planData.summary}
        </p>
      )}

      {/* 7-column board */}
      <div style={{ overflowX: 'auto', marginBottom: '12px', borderRadius: '12px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, minmax(130px, 1fr))',
          gap: '8px',
          minWidth: '910px',
          padding: '2px',
        }}>
          {planData.plan.map((entry, i) => {
            const { day, date } = dayLabel(entry.date);
            const type = normalizeType(entry.workout_type);
            const dist = distanceMi(entry.distance_km);
            const isRest = type === 'Rest';

            return (
              <div key={i}>
                {/* Day header */}
                <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                  <div style={{
                    fontFamily: 'var(--font-heading)', fontSize: '11px', fontWeight: 700,
                    color: '#1B2559', textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>
                    {day}
                  </div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: '#8B93B0' }}>
                    {date}
                  </div>
                </div>

                {/* Day card */}
                {isRest ? (
                  <div style={{
                    borderRadius: '10px', padding: '16px 8px', textAlign: 'center',
                    background: '#F5F6FA', border: '1px dashed #D4D8E8',
                    minHeight: '72px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#8B93B0', fontWeight: 500 }}>
                      Rest
                    </span>
                  </div>
                ) : (
                  <WorkoutCard
                    type={type}
                    title={entry.title}
                    distance={dist}
                    unit="mi"
                    status="planned"
                    source="ai_coach"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button onClick={onConfirm} disabled={isSaving} className="btn btn-primary btn-sm">
          {isSaving ? 'Saving…' : 'Save to Calendar'}
        </button>
        <button onClick={onDiscard} className="btn btn-ghost btn-sm">
          Discard
        </button>
      </div>
    </motion.div>
  );
}
