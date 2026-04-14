import ArtifactPanel from '../../ui/ArtifactPanel';
import EvidenceCard from '../../ui/EvidenceCard';

const VERDICT_CONFIG = {
  achievable: { label: 'Achievable', color: '#2ECC8B', bg: 'rgba(46,204,139,0.1)',  bar: '#2ECC8B' },
  stretch:    { label: 'Stretch',    color: '#E5A830', bg: 'rgba(229,168,48,0.1)',  bar: '#E5A830' },
  unlikely:   { label: 'Unlikely',   color: '#E84A4A', bg: 'rgba(232,74,74,0.1)',   bar: '#E84A4A' },
};

export default function GoalFeasibilityArtifact({ data }) {
  if (!data) return null;

  const cfg = VERDICT_CONFIG[data.verdict] ?? VERDICT_CONFIG.stretch;
  const confidencePct = data.confidence != null ? Math.round(data.confidence * 100) : null;

  // Normalise evidence — backend may send strings or EvidenceCard-shape objects
  const evidenceItems = (data.evidence ?? []).map(e =>
    typeof e === 'string'
      ? { label: e, value: '', signal: 'neutral' }
      : { label: e.label ?? '', value: e.value ?? '', signal: e.signal ?? 'neutral' }
  );

  return (
    <ArtifactPanel
      type="goal_feasibility"
      title="Goal Feasibility"
      timestamp={new Date().toISOString()}
      confidence={data.confidence}
    >
      <div className="space-y-4">
        {/* Verdict + headline */}
        <div className="flex items-center gap-3 flex-wrap">
          <span
            className="text-xs font-bold font-sans uppercase tracking-wider px-3 py-1.5 rounded-full flex-shrink-0"
            style={{ background: cfg.bg, color: cfg.color }}
          >
            {cfg.label}
          </span>
          {data.headline && (
            <p className="text-sm font-semibold text-navy font-heading leading-snug flex-1">
              {data.headline}
            </p>
          )}
        </div>

        {/* Confidence bar */}
        {confidencePct != null && (
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans">
                Confidence
              </span>
              <span className="text-xs font-mono font-semibold text-navy">
                {confidencePct}%
              </span>
            </div>
            <div className="h-1.5 bg-[var(--color-border-light)] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${confidencePct}%`, background: cfg.bar }}
              />
            </div>
          </div>
        )}

        {/* Evidence */}
        {evidenceItems.length > 0 && (
          <EvidenceCard items={evidenceItems} />
        )}

        {/* Gap */}
        {data.gap && (
          <div className="bg-[var(--amber-tint)] rounded-xl px-4 py-3 border border-[rgba(229,168,48,0.2)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-warning)] font-sans mb-1">
              Gap to Close
            </p>
            <p className="text-sm text-[var(--color-text-secondary)] font-sans leading-snug">
              {data.gap}
            </p>
          </div>
        )}

        {/* Recommendation */}
        {data.recommendation && (
          <div className="bg-[var(--navy-tint)] rounded-xl px-4 py-3 border border-[rgba(27,37,89,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-1">
              Recommendation
            </p>
            <p className="text-sm text-navy font-sans leading-relaxed">
              {data.recommendation}
            </p>
          </div>
        )}
      </div>
    </ArtifactPanel>
  );
}
