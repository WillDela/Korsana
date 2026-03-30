const StravaIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7 13.828h4.169" />
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
            <div className="w-10 h-10 rounded-xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex items-center justify-center text-[#FC4C02]">
              <StravaIcon />
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
              className="mt-1 px-4 py-2 rounded-lg bg-[#FC4C02] text-white font-sans text-[12px] font-bold border-none cursor-pointer hover:bg-[#e04400] transition-colors"
            >
              Connect Strava
            </button>
          </>
        ) : (
          <>
            <div className="w-10 h-10 rounded-xl bg-[var(--color-bg-elevated)] border border-[var(--color-border-light)] flex items-center justify-center text-[var(--color-text-muted)]">
              <StravaIcon />
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
