import { LuTrendingUp as TrendingUp, LuTrendingDown as TrendingDown, LuMinus as Minus } from 'react-icons/lu';

const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <TrendingUp size={10} />;
  if (trend === 'down') return <TrendingDown size={10} />;
  return <Minus size={10} />;
};

const variantColor = {
  success: 'text-[var(--color-success)]',
  warning: 'text-[var(--color-warning)]',
  danger:  'text-[var(--color-danger)]',
  neutral: 'text-[var(--color-text-muted)]',
};

export default function MetricStrip({ metrics = [] }) {
  return (
    <div className="flex items-stretch bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      {metrics.map((m, i) => (
        <div
          key={i}
          className={`flex-1 px-4 py-3 ${i < metrics.length - 1 ? 'border-r border-[var(--color-border-light)]' : ''}`}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-0.5 font-sans">
            {m.label}
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-xl font-bold font-mono text-[var(--color-text-primary)]">
              {m.value}
            </span>
            {m.unit && (
              <span className="text-xs text-[var(--color-text-muted)] font-mono">{m.unit}</span>
            )}
          </div>
          {m.trend && (
            <div
              className={`flex items-center gap-0.5 mt-0.5 text-[10px] font-medium font-sans ${variantColor[m.variant] || variantColor.neutral}`}
            >
              <TrendIcon trend={m.trend} />
              {m.trendLabel && <span>{m.trendLabel}</span>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
