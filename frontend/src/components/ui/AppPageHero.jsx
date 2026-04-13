import StatusBadge from './StatusBadge';

export default function AppPageHero({
  title,
  subtitle,
  status,
  primaryAction,
  secondaryAction,
  children,
}) {
  return (
    <div className="mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <h1 className="text-2xl font-bold font-heading text-navy leading-tight">
              {title}
            </h1>
            {status && <StatusBadge {...status} size="sm" />}
          </div>
          {subtitle && (
            <p className="text-[13px] text-[var(--color-text-muted)] font-sans">
              {subtitle}
            </p>
          )}
          {children && <div className="mt-3">{children}</div>}
        </div>

        {(primaryAction || secondaryAction) && (
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            {secondaryAction && (
              <button
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold text-navy border border-[var(--color-border)] bg-white hover:bg-[var(--color-bg-elevated)] active:scale-[0.98] transition-all cursor-pointer"
              >
                {secondaryAction.label}
              </button>
            )}
            {primaryAction && (
              <button
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-bold text-white bg-coral hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer border-none shadow-sm"
              >
                {primaryAction.label}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
