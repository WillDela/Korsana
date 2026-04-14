import { useState } from 'react';
import ArtifactPanel from '../../ui/ArtifactPanel';

const typeColors = {
  Easy:       { bg: 'rgba(91,140,62,0.1)',   text: '#5B8C3E' },
  'Long Run': { bg: 'rgba(27,37,89,0.1)',    text: '#1B2559' },
  Tempo:      { bg: 'rgba(232,114,90,0.1)',  text: '#E8725A' },
  Intervals:  { bg: 'rgba(232,114,90,0.1)',  text: '#E8725A' },
  Rest:       { bg: 'rgba(139,147,176,0.1)', text: '#8B93B0' },
  Recovery:   { bg: 'rgba(91,140,62,0.1)',   text: '#5B8C3E' },
};

function TypePill({ type }) {
  const c = typeColors[type] ?? typeColors.Easy;
  return (
    <span style={{
      display: 'inline-block', padding: '2px 8px', borderRadius: '5px',
      fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
      background: c.bg, color: c.text,
    }}>
      {type}
    </span>
  );
}

function WorkoutSummary({ workout, label }) {
  return (
    <div style={{ flex: 1 }}>
      <p style={{
        fontFamily: 'var(--font-sans)', fontSize: '10px', fontWeight: 700,
        textTransform: 'uppercase', letterSpacing: '0.08em', color: '#8B93B0',
        marginBottom: '6px',
      }}>
        {label}
      </p>
      <div style={{
        background: '#F5F6FA', borderRadius: '10px', padding: '10px 12px',
        border: '1px solid #ECEEF4',
      }}>
        <TypePill type={workout.type ?? 'Easy'} />
        {workout.distance && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: '#1B2559', marginTop: '6px', fontWeight: 600 }}>
            {workout.distance} mi
          </p>
        )}
        {workout.reason && (
          <p style={{ fontFamily: 'var(--font-sans)', fontSize: '11px', color: '#8B93B0', marginTop: '4px', lineHeight: 1.4 }}>
            {workout.reason}
          </p>
        )}
      </div>
    </div>
  );
}

export default function WorkoutAdjustmentArtifact({ data }) {
  const [accepted, setAccepted] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (!data || dismissed) return null;

  const dateStr = data.original?.date
    ? new Date(data.original.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    : null;

  return (
    <ArtifactPanel
      type="workout_adjustment"
      title={dateStr ? `Adjustment · ${dateStr}` : 'Workout Adjustment'}
      timestamp={new Date().toISOString()}
    >
      {accepted ? (
        <p className="text-sm text-[var(--color-success)] font-sans font-medium">
          Adjustment noted. Update your calendar when you're ready.
        </p>
      ) : (
        <div className="space-y-4">
          {/* Before / After */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            {data.original && <WorkoutSummary workout={data.original} label="Original" />}
            <div style={{ display: 'flex', alignItems: 'center', paddingTop: '22px', flexShrink: 0, color: '#8B93B0' }}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 10h12M10 4l6 6-6 6" />
              </svg>
            </div>
            {data.adjusted && <WorkoutSummary workout={data.adjusted} label="Suggested" />}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={() => setAccepted(true)}
              className="btn btn-primary btn-sm"
            >
              Accept
            </button>
            <button
              onClick={() => setDismissed(true)}
              className="btn btn-ghost btn-sm"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </ArtifactPanel>
  );
}
