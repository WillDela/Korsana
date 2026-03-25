export default function ExecutionScoreWidget({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-[22px] shadow-sm">
        <div className="flex justify-between mb-[14px]">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
            Execution Score
          </span>
          <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">
            Complete planned workouts to see scores
          </div>
        </div>
      </div>
    );
  }

  const avg = Math.round(data.weekly_avg || 0);
  const avgColor = avg >= 80 ? '#2ECC8B' : avg >= 60 ? '#F5A623' : '#E8634A';
  const avgLabel = avg >= 80 ? 'Excellent' : avg >= 60 ? 'Good' : 'Needs work';

  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
      <div className="flex justify-between mb-[14px]">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Execution Score
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      <div className="flex items-end gap-[10px] mb-4">
        <span className="font-mono text-[36px] font-bold leading-none" style={{ color: avgColor }}>
          {avg}
        </span>
        <div className="mb-1">
          <div className="font-sans text-[11px] font-semibold" style={{ color: avgColor }}>{avgLabel}</div>
          <div className="font-sans text-[10px] text-[var(--color-text-muted)]">avg last 30 days</div>
        </div>
      </div>
      {(data.runs || []).length > 0 ? (
        <div>
          <div
            className="grid gap-[6px] px-[6px] mb-1"
            style={{ gridTemplateColumns: '80px 1fr 50px 1fr' }}
          >
            {['Date', 'Type', 'Score', 'Note'].map(h => (
              <div key={h} className="font-sans text-[9px] font-bold text-[var(--color-text-muted)] uppercase">
                {h}
              </div>
            ))}
          </div>
          {data.runs.map((r, i) => (
            <div
              key={i}
              className="grid gap-[6px] px-[6px] py-[7px] rounded-[7px] items-center"
              style={{
                gridTemplateColumns: '80px 1fr 50px 1fr',
                background: i % 2 === 0 ? 'var(--color-bg-elevated)' : 'transparent',
              }}
            >
              <span className="font-mono text-[10px] text-[var(--color-text-secondary)]">
                {r.date
                  ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                  : '--'}
              </span>
              <span className="font-sans text-[11px] text-navy">{r.type}</span>
              <span
                className="font-mono text-[12px] font-bold"
                style={{ color: r.score >= 80 ? '#2ECC8B' : r.score >= 60 ? '#F5A623' : '#E8634A' }}
              >
                {Math.round(r.score)}
              </span>
              <span className="font-sans text-[10px] text-[var(--color-text-muted)]">{r.issue || '—'}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="font-sans text-[12px] text-[var(--color-text-muted)] text-center py-[10px]">
          No completed planned runs yet
        </div>
      )}
    </div>
  );
}
