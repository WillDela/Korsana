import ArtifactPanel from '../../ui/ArtifactPanel';

export default function RaceStrategyArtifact({ data }) {
  if (!data) return null;

  const phases = Array.isArray(data.phases) ? data.phases : [];
  const reminders = Array.isArray(data.key_reminders) ? data.key_reminders : [];

  return (
    <ArtifactPanel
      type="race_strategy"
      title="Race Strategy"
      timestamp={new Date().toISOString()}
    >
      <div className="space-y-4">
        {data.headline && (
          <p className="text-sm font-semibold text-navy font-heading leading-snug">
            {data.headline}
          </p>
        )}

        {data.target_pace && (
          <div className="rounded-xl border border-[rgba(232,114,90,0.16)] bg-[var(--coral-tint)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-1">
              Target Pace
            </p>
            <p className="text-lg font-mono font-semibold text-coral">
              {data.target_pace}
            </p>
          </div>
        )}

        {phases.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-2">
              Race Breakdown
            </p>
            <div className="space-y-2.5">
              {phases.map((phase, index) => (
                <div
                  key={`${phase.phase || 'phase'}-${index}`}
                  className="rounded-xl border border-[var(--color-border-light)] bg-[var(--color-bg-elevated)] px-4 py-3"
                >
                  <p className="text-xs font-bold text-navy font-sans uppercase tracking-wide mb-1">
                    {phase.phase || `Phase ${index + 1}`}
                  </p>
                  <p className="text-sm text-[var(--color-text-secondary)] font-sans leading-relaxed">
                    {phase.guidance || 'Guidance unavailable.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {reminders.length > 0 && (
          <div className="rounded-xl border border-[rgba(27,37,89,0.08)] bg-[var(--navy-tint)] px-4 py-3">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-2">
              Key Reminders
            </p>
            <ul className="space-y-1.5">
              {reminders.map((reminder, index) => (
                <li key={`${reminder}-${index}`} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-coral flex-shrink-0" />
                  <span className="text-sm text-[var(--color-text-secondary)] font-sans leading-snug">
                    {reminder}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </ArtifactPanel>
  );
}
