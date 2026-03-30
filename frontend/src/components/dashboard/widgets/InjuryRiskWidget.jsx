import { useState } from 'react';
import WidgetEmptyState from './WidgetEmptyState';

export default function InjuryRiskWidget({ data, stravaConnected, onConnect }) {
  const [expanded, setExpanded] = useState(false);

  if (!data) {
    return <WidgetEmptyState label="Injury Risk" title="injury risk score" stravaConnected={stravaConnected} onConnect={onConnect} />;
  }

  const riskColor = data.risk_level === 'High' ? '#E84A4A' : data.risk_level === 'Moderate' ? '#F5A623' : '#2ECC8B';

  const factors = [
    { label: 'Mileage Jump', score: data.mileage_jump_score },
    { label: 'Load Ratio', score: data.load_ratio_score },
    { label: 'Consec. Hard Days', score: data.consecutive_score },
  ];

  return (
    <div className="widget-card">
      <div className="flex justify-between mb-3.5">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">Injury Risk</span>
        <span className="font-sans text-[9px] font-bold text-[var(--color-coral)]">✦ Korsana</span>
      </div>
      <div className="flex gap-5 mb-3.5">
        <div>
          <div className="font-mono text-[36px] font-bold leading-none" style={{ color: riskColor }}>{data.score}</div>
          <div className="font-sans text-[11px] font-semibold mt-0.5" style={{ color: riskColor }}>{data.risk_level} Risk</div>
        </div>
        <div className="flex-1 flex flex-col gap-2">
          {factors.map((f, i) => (
            <div key={i}>
              <div className="flex justify-between mb-0.5">
                <span className="font-sans text-[10px] text-[var(--color-text-secondary)]">{f.label}</span>
                <span className="font-mono text-[10px] text-navy">{Math.round(f.score)}</span>
              </div>
              <div className="h-[5px] bg-[var(--color-border-light)] rounded-full">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${f.score}%`,
                    background: f.score > 70 ? '#E84A4A' : f.score > 40 ? '#F5A623' : '#2ECC8B',
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
      {data.primary_signal && (
        <div className="font-sans text-[11px] text-[var(--color-text-secondary)] px-2.5 py-2 bg-[var(--color-bg-elevated)] rounded-lg mb-2">
          {data.primary_signal}
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="font-sans text-[11px] text-[var(--color-text-muted)] bg-transparent border-none cursor-pointer p-0"
      >
        How this works {expanded ? '▴' : '▾'}
      </button>
      {expanded && (
        <div className="mt-2 p-3 bg-[var(--color-bg-elevated)] rounded-lg font-sans text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
          Score = 40% mileage jump + 40% ATL/CTL ratio + 20% consecutive
          hard days. 0-39: Low, 40-69: Moderate, 70+: High risk.
        </div>
      )}
    </div>
  );
}
