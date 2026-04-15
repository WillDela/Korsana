import ArtifactPanel from '../../ui/ArtifactPanel';
import EvidenceCard from '../../ui/EvidenceCard';
import { useUnits } from '../../../context/UnitsContext';

const RECOMMENDATION_CONFIG = {
  run_easy:    { label: 'Easy Run',       color: '#2ECC8B', bg: 'rgba(46,204,139,0.1)',  dot: '#2ECC8B' },
  run_hard:    { label: 'Quality Session',color: '#4A6CF7', bg: 'rgba(74,108,247,0.1)',  dot: '#4A6CF7' },
  rest:        { label: 'Rest Day',       color: '#8B93B0', bg: 'rgba(139,147,176,0.1)', dot: '#8B93B0' },
  cross_train: { label: 'Cross-Train',    color: '#E5A830', bg: 'rgba(229,168,48,0.1)',  dot: '#E5A830' },
};

export default function DailyBriefArtifact({ data }) {
  const { unit } = useUnits();
  const distUnit = unit === 'imperial' ? 'mi' : 'km';

  if (!data) return null;

  const rec = RECOMMENDATION_CONFIG[data.recommendation] ?? RECOMMENDATION_CONFIG.run_easy;

  const evidenceItems = (data.evidence ?? []).map(e => ({
    label: e,
    value: '',
    signal: 'neutral',
  }));

  return (
    <ArtifactPanel type="daily_brief" title="Today's Decision" timestamp={new Date().toISOString()}>
      <div className="space-y-4">
        {/* Recommendation badge + headline */}
        <div className="flex items-center gap-3">
          <span
            className="flex-shrink-0 text-xs font-bold font-sans uppercase tracking-wider px-3 py-1 rounded-full"
            style={{ background: rec.bg, color: rec.color }}
          >
            {rec.label}
          </span>
          {data.headline && (
            <p className="text-sm font-semibold text-navy font-heading leading-snug">
              {data.headline}
            </p>
          )}
        </div>

        {/* Reason */}
        {data.reason && (
          <p className="text-sm text-[var(--color-text-secondary)] font-sans leading-relaxed">
            {data.reason}
          </p>
        )}

        {/* Evidence */}
        {evidenceItems.length > 0 && (
          <EvidenceCard items={evidenceItems} />
        )}

        {/* Workout suggestion */}
        {data.workout_suggestion && (
          <div className="flex items-center gap-4 bg-[var(--navy-tint)] rounded-xl px-4 py-3 border border-[rgba(27,37,89,0.08)]">
            <div className="flex-1">
              <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-0.5">
                Suggested Workout
              </p>
              <p className="text-sm font-semibold text-navy font-heading">
                {data.workout_suggestion.type}
                {data.workout_suggestion.distance
                  ? ` · ${data.workout_suggestion.distance} ${distUnit}`
                  : ''}
              </p>
            </div>
            {data.workout_suggestion.pace && (
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] font-sans mb-0.5">
                  Pace
                </p>
                <p className="text-sm font-mono font-semibold text-navy">
                  {data.workout_suggestion.pace}/{distUnit}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ArtifactPanel>
  );
}
