import ArtifactPanel from '../../ui/ArtifactPanel';
import EvidenceCard from '../../ui/EvidenceCard';

const signalDot = {
  positive: { color: '#2ECC8B', bg: 'rgba(46,204,139,0.1)' },
  warning:  { color: '#E5A830', bg: 'rgba(229,168,48,0.1)' },
  neutral:  { color: '#8B93B0', bg: 'rgba(139,147,176,0.1)' },
};

export default function WeeklyReviewArtifact({ data }) {
  if (!data) return null;

  const evidenceItems = (data.metrics ?? []).map(m => ({
    label: m.label,
    value: m.vs_plan ? `${m.value} (${m.vs_plan})` : m.value,
    signal: m.signal ?? 'neutral',
  }));

  return (
    <ArtifactPanel
      type="weekly_review"
      title={data.week ? `Week of ${data.week}` : 'Weekly Review'}
      timestamp={new Date().toISOString()}
    >
      <div className="space-y-4">
        {/* Summary */}
        {data.summary && (
          <p className="text-sm text-[var(--color-text-secondary)] font-sans leading-relaxed">
            {data.summary}
          </p>
        )}

        {/* Metrics */}
        {evidenceItems.length > 0 && (
          <EvidenceCard items={evidenceItems} />
        )}

        {/* Highlights + Risks row */}
        {((data.highlights?.length ?? 0) > 0 || (data.risks?.length ?? 0) > 0) && (
          <div className="grid grid-cols-2 gap-3">
            {data.highlights?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-2">
                  Highlights
                </p>
                <ul className="space-y-1.5">
                  {data.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-success)] flex-shrink-0" />
                      <span className="text-xs text-[var(--color-text-secondary)] font-sans leading-snug">
                        {h}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {data.risks?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-2">
                  Watch Out
                </p>
                <ul className="space-y-1.5">
                  {data.risks.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="mt-1 w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] flex-shrink-0" />
                      <span className="text-xs text-[var(--color-text-secondary)] font-sans leading-snug">
                        {r}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Next focus */}
        {data.next_focus && (
          <div className="bg-[var(--navy-tint)] rounded-xl px-4 py-3 border border-[rgba(27,37,89,0.08)]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-1">
              Next Week's Focus
            </p>
            <p className="text-sm text-navy font-sans font-medium leading-snug">
              {data.next_focus}
            </p>
          </div>
        )}
      </div>
    </ArtifactPanel>
  );
}
