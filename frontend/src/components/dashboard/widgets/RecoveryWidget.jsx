export default function RecoveryWidget({ data }) {
  if (!data) {
    return (
      <div className="widget-card">
        <div className="flex justify-between mb-3.5">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Recovery</span>
          <span className="font-sans text-[9px] font-bold text-[var(--color-coral)]">✦ Korsana</span>
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span className="text-3xl">📭</span>
          <div className="font-sans text-xs text-[var(--color-text-muted)]">No activity data yet</div>
        </div>
      </div>
    );
  }

  const score = Math.round(data.recovery_pct || 0);
  const color = score >= 70 ? '#2ECC8B' : score >= 40 ? '#F5A623' : '#E84A4A';
  const r = 48, circ = 2 * Math.PI * r;

  return (
    <div className="widget-card">
      <div className="flex justify-between mb-3.5">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Recovery Status</span>
        <span className="font-sans text-[9px] font-bold text-[var(--color-coral)]">✦ Korsana</span>
      </div>
      <div className="flex gap-5 items-center">
        <div className="relative w-[120px] h-[120px] shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={r} fill="none" stroke="var(--color-border-light)" strokeWidth="10" />
            <circle
              cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10"
              strokeDasharray={`${(score / 100) * circ} ${circ}`}
              strokeLinecap="round" transform="rotate(-90 60 60)"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-mono text-[28px] font-bold leading-none" style={{ color }}>
              {score}
            </span>
            <span className="font-sans text-[10px] text-[var(--color-text-muted)]">/ 100</span>
          </div>
        </div>
        <div className="flex-1">
          {data.last_hard_date && (
            <div className="mb-2.5">
              <div className="font-sans text-[10px] text-[var(--color-text-muted)]">Last hard session</div>
              <div className="font-mono text-[13px] font-bold text-navy mt-0.5">{data.last_hard_date}</div>
              {data.last_hard_hr > 0 && (
                <div className="font-sans text-[11px] text-[var(--color-text-secondary)]">
                  {data.last_hard_hr} bpm avg · {Math.round(data.hours_since)}h ago
                </div>
              )}
            </div>
          )}
          <div>
            <div className="font-sans text-[10px] text-[var(--color-text-muted)]">Next quality session</div>
            <div className="font-mono text-base font-bold mt-0.5" style={{ color }}>{data.next_quality_day}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
