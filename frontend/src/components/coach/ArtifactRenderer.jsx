import WeeklyReviewArtifact from './artifacts/WeeklyReviewArtifact';
import DailyBriefArtifact from './artifacts/DailyBriefArtifact';
import WorkoutAdjustmentArtifact from './artifacts/WorkoutAdjustmentArtifact';
import GoalFeasibilityArtifact from './artifacts/GoalFeasibilityArtifact';
import RaceStrategyArtifact from './artifacts/RaceStrategyArtifact';
import ArtifactPanel from '../ui/ArtifactPanel';
import { getArtifactLabel, parseArtifactPayload } from '../../lib/coachArtifacts';

function ArtifactFallback({ type, reason }) {
  const label = getArtifactLabel(type);

  return (
    <ArtifactPanel
      type={type || 'daily_brief'}
      title={`${label} unavailable`}
      timestamp={new Date().toISOString()}
    >
      <div className="space-y-2">
        <p className="text-sm text-[var(--color-text-secondary)] font-sans leading-relaxed">
          We could not safely render this coach artifact, so the thread stays visible and usable.
        </p>
        <p className="text-xs font-mono text-[var(--color-text-muted)]">
          {reason || 'Malformed artifact payload.'}
        </p>
      </div>
    </ArtifactPanel>
  );
}

export default function ArtifactRenderer({ artifact }) {
  if (!artifact) return null;

  const parsed = parseArtifactPayload(artifact);
  const wrapperStyle = { marginTop: '8px', marginLeft: '34px' };

  if (!parsed.ok) {
    return (
      <div style={wrapperStyle}>
        <ArtifactFallback type={parsed.type} reason={parsed.reason} />
      </div>
    );
  }

  const artifactByType = {
    weekly_review: WeeklyReviewArtifact,
    daily_brief: DailyBriefArtifact,
    workout_adjustment: WorkoutAdjustmentArtifact,
    goal_feasibility: GoalFeasibilityArtifact,
    race_strategy: RaceStrategyArtifact,
  };

  const Component = artifactByType[parsed.type];
  if (!Component) {
    console.error(`Unsupported coach artifact type: ${parsed.type}`, artifact);
    return (
      <div style={wrapperStyle}>
        <ArtifactFallback
          type={parsed.type}
          reason="This artifact type is not supported by the current renderer yet."
        />
      </div>
    );
  }

  return (
    <div style={wrapperStyle}>
      <Component data={parsed.data} />
    </div>
  );
}
