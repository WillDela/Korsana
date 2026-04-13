import { LuTrendingUp as TrendingUp, LuAlertTriangle as AlertTriangle, LuMinus as Minus } from 'react-icons/lu';

const signalConfig = {
  positive: { Icon: TrendingUp, color: 'text-[var(--color-success)]' },
  warning:  { Icon: AlertTriangle, color: 'text-[var(--color-warning)]' },
  neutral:  { Icon: Minus, color: 'text-[var(--color-text-muted)]' },
};

export default function EvidenceCard({ items = [], confidence }) {
  return (
    <div className="bg-[var(--navy-tint)] rounded-xl p-4 border border-[rgba(27,37,89,0.08)]">
      <div className="space-y-2">
        {items.map((item, i) => {
          const cfg = signalConfig[item.signal] || signalConfig.neutral;
          const { Icon } = cfg;
          return (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Icon size={12} className={cfg.color} />
                <span className="text-xs text-[var(--color-text-secondary)] font-sans">
                  {item.label}
                </span>
              </div>
              <span className={`text-xs font-mono font-semibold ${cfg.color}`}>
                {item.value}
              </span>
            </div>
          );
        })}
      </div>
      {confidence != null && (
        <div className="mt-3 pt-3 border-t border-[rgba(27,37,89,0.08)] flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--color-text-muted)] font-sans">
            Confidence
          </span>
          <span className="text-xs font-mono font-bold text-navy">
            {Math.round(confidence * 100)}%
          </span>
        </div>
      )}
    </div>
  );
}
