export default function LongRunConfidenceWidget({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-[22px] shadow-sm">
        <div className="flex justify-between mb-[14px]">
          <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
            Long Run
          </span>
          <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
        </div>
        <div className="flex flex-col items-center py-6 gap-2">
          <span style={{ fontSize: 28 }}>📭</span>
          <div className="font-sans text-[12px] text-[var(--color-text-muted)]">No long runs recorded yet</div>
        </div>
      </div>
    );
  }

  const pct = data.coverage_pct || 0;
  const color = pct >= 90 ? '#2ECC8B' : pct >= 60 ? '#F5A623' : '#E8634A';
  const confidenceBadgeColor = data.confidence === 'Strong'
    ? '#2ECC8B'
    : data.confidence === 'Building' ? '#F5A623' : '#E8634A';

  const r = 56;
  const cx = 80, cy = 75;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const startAngle = -180;
  const endAngle = startAngle + (pct / 100) * 180;
  const arcX = (angle) => cx + r * Math.cos(toRad(angle));
  const arcY = (angle) => cy + r * Math.sin(toRad(angle));
  const largeArc = pct > 50 ? 1 : 0;

  return (
    <div className="bg-white rounded-2xl p-[22px] shadow-sm">
      <div className="flex justify-between mb-3">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          Long Run Coverage
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      <div className="flex flex-col items-center">
        <svg width="160" height="90" viewBox="0 0 160 90">
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none" stroke="#ECEEF4" strokeWidth="12" strokeLinecap="round"
          />
          {pct > 0 && (
            <path
              d={`M ${cx - r} ${cy} A ${r} ${r} 0 ${largeArc} 1 ${arcX(endAngle)} ${arcY(endAngle)}`}
              fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
            />
          )}
          {[50, 75, 90].map(m => {
            const angle = -180 + (m / 100) * 180;
            const mx = cx + (r + 16) * Math.cos(toRad(angle));
            const my = cy + (r + 16) * Math.sin(toRad(angle));
            return (
              <text
                key={m} x={mx} y={my} textAnchor="middle" dominantBaseline="middle"
                fontFamily="IBM Plex Mono, monospace" fontSize="8" fill="#8B93B0"
              >{m}%</text>
            );
          })}
        </svg>
        <div className="font-mono text-[48px] font-bold leading-none -mt-1" style={{ color }}>
          {Math.round(pct)}%
        </div>
        <div className="font-sans text-[11px] text-[var(--color-text-muted)] mt-1">
          of race distance covered
        </div>
        <div className="flex gap-3 mt-[14px] items-center">
          <div className="font-sans text-[11px] text-[var(--color-text-secondary)]">
            {data.long_run_count} long run{data.long_run_count !== 1 ? 's' : ''} (84 days)
          </div>
          <span
            className="font-sans text-[9px] font-bold rounded-full px-2 py-[2px]"
            style={{ background: `${confidenceBadgeColor}20`, color: confidenceBadgeColor }}
          >
            {data.confidence}
          </span>
        </div>
      </div>
    </div>
  );
}
