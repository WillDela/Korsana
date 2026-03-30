import BrandIcon from '../../BrandIcon';

const ActivityIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
  </svg>
);

export default function WidgetEmptyState({ title, label, stravaConnected, onConnect }) {
  const isDisconnected = stravaConnected === false;

  return (
    <div className="widget-card">
      <div className="flex justify-between mb-[14px]">
        <span className="font-sans text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-[0.1em]">
          {label}
        </span>
        <span className="font-sans text-[9px] font-bold text-coral">✦ Korsana</span>
      </div>
      <div className="flex flex-col items-center py-6 gap-3 text-center">
        {isDisconnected ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-strava)]/10 border border-[var(--color-strava)]/20 flex items-center justify-center text-[var(--color-strava)]">
              <BrandIcon brand="strava" size={18} />
            </div>
            <div>
              <p className="font-sans text-[13px] font-semibold text-navy mb-1">
                Connect Strava
              </p>
              <p className="font-sans text-[11px] text-[var(--color-text-muted)]">
                to see your {title}
              </p>
            </div>
            <button
              onClick={onConnect}
              className="mt-1 px-4 py-2 rounded-lg text-white font-sans text-[12px] font-bold border-none cursor-pointer transition-colors"
              style={{ background: 'var(--color-strava)' }}
            >
              Connect Strava
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-text-muted)]">
              <ActivityIcon />
            </div>
            <p className="font-sans text-[12px] text-[var(--color-text-muted)]">
              No {title} data yet —<br />sync your activities to get started
            </p>
          </>
        )}
      </div>
    </div>
  );
}
