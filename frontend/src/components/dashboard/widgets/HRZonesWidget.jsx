import WidgetEmptyState from './WidgetEmptyState';

const ZONE_COLORS = ['#5CC8FF', '#2ECC8B', '#F5A623', '#E8634A', '#E84A4A'];

export default function HRZonesWidget({ data, stravaConnected, onConnect }) {
  if (!data || !data.zones?.length) {
    return <WidgetEmptyState label="HR Zones · This Week" title="HR zone breakdown" stravaConnected={stravaConnected} onConnect={onConnect} />;
  }

  return (
    <div className="widget-card">
      <div className="flex justify-between mb-[14px]">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          HR Zones · This Week
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      {data.zones.map((z, i) => (
        <div key={i} className={i < data.zones.length - 1 ? 'mb-[11px]' : ''}>
          <div className="flex justify-between items-center mb-1">
            <div className="flex items-center gap-[6px]">
              <div className="w-[7px] h-[7px] rounded-full" style={{ background: ZONE_COLORS[i] }} />
              <span className="font-sans text-[12px] font-semibold text-[var(--color-text-secondary)]">
                {z.name}
              </span>
              <span className="font-mono text-[10px] text-[var(--color-text-muted)]">{z.bpm}</span>
            </div>
            <div className="flex items-center gap-[6px]">
              <span className="font-mono text-[11px] font-bold text-navy">{Math.round(z.minutes)}min</span>
              <span className="font-mono text-[11px] text-[var(--color-text-muted)]">{Math.round(z.pct)}%</span>
              {z.in_range && (
                <span className="text-[12px]" style={{ color: '#2ECC8B' }}>✓</span>
              )}
            </div>
          </div>
          <div className="h-[6px] bg-[var(--color-border-light)] rounded-full">
            <div
              className="h-full rounded-full"
              style={{ width: `${z.pct}%`, background: ZONE_COLORS[i] }}
            />
          </div>
        </div>
      ))}
      {data.z1z2_combined !== undefined && (
        <div
          className="mt-3 px-[10px] py-2 rounded-lg font-sans text-[11px]"
          style={{
            background: data.z1z2_combined >= 80 ? '#E8F4EC' : '#FFF3CD',
            color: data.z1z2_combined >= 80 ? '#2ECC8B' : '#F5A623',
          }}
        >
          Z1+Z2: {Math.round(data.z1z2_combined)}%{' '}
          {data.z1z2_combined >= 80 ? '✓ Great aerobic base' : '— Aim for >=80% easy running'}
        </div>
      )}
    </div>
  );
}
