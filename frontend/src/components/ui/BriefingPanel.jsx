import { LuCheck as Check } from 'react-icons/lu';
import ActionRail from './ActionRail';

const variantConfig = {
  insight: {
    bg: 'bg-[var(--navy-tint)]',
    border: 'border-navy/10',
    accent: 'bg-navy',
    label: 'Coach Insight',
    labelColor: 'text-navy',
  },
  warning: {
    bg: 'bg-[var(--amber-tint)]',
    border: 'border-[var(--color-warning)]/20',
    accent: 'bg-[var(--color-warning)]',
    label: 'Heads Up',
    labelColor: 'text-[var(--color-warning)]',
  },
  neutral: {
    bg: 'bg-[var(--color-bg-elevated)]',
    border: 'border-[var(--color-border)]',
    accent: 'bg-[var(--color-text-muted)]',
    label: 'Note',
    labelColor: 'text-[var(--color-text-secondary)]',
  },
};

export default function BriefingPanel({
  headline,
  reason,
  evidence = [],
  action,
  variant = 'insight',
}) {
  const cfg = variantConfig[variant] || variantConfig.insight;

  return (
    <div className={`rounded-2xl border ${cfg.bg} ${cfg.border} p-5`}>
      <div className="flex items-start gap-3">
        <div className={`w-1 self-stretch rounded-full shrink-0 ${cfg.accent}`} />
        <div className="flex-1 min-w-0">
          <p className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${cfg.labelColor}`}>
            {cfg.label}
          </p>
          {headline && (
            <p className="text-[15px] font-semibold text-navy font-heading leading-snug mb-1">
              {headline}
            </p>
          )}
          {reason && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">{reason}</p>
          )}
          {evidence.length > 0 && (
            <ul className="space-y-1 mb-3">
              {evidence.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                  <Check size={11} className="mt-[3px] shrink-0 text-[var(--color-success)]" />
                  {item}
                </li>
              ))}
            </ul>
          )}
          {action && (
            <ActionRail
              ghost={{
                label: action.label,
                onClick: action.onClick ?? (() => { if (action.href) window.location.href = action.href; }),
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
