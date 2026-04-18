const ARTIFACT_LABELS = {
  daily_brief: 'Daily Brief',
  weekly_review: 'Weekly Review',
  workout_adjustment: 'Workout Adjustment',
  goal_feasibility: 'Goal Feasibility',
  race_strategy: 'Race Strategy',
};

export function getArtifactLabel(type) {
  if (!type) return 'Coach Artifact';
  return ARTIFACT_LABELS[type]
    || type
      .split('_')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
}

export function parseArtifactPayload(artifact) {
  if (!artifact || typeof artifact !== 'object') {
    return { ok: false, type: null, reason: 'Missing artifact payload.' };
  }

  const { type, data } = artifact;
  if (!type || typeof type !== 'string') {
    console.error('Coach artifact missing a valid type.', artifact);
    return { ok: false, type: null, reason: 'Missing artifact type.' };
  }

  let parsed = data;
  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch (error) {
      console.error(`Failed to parse ${type} artifact payload.`, error, data);
      return {
        ok: false,
        type,
        reason: 'The structured data for this coach reply was not valid JSON.',
      };
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    console.error(`Coach artifact payload for ${type} was malformed.`, parsed);
    return {
      ok: false,
      type,
      reason: 'The structured data for this coach reply was incomplete.',
    };
  }

  return { ok: true, type, data: parsed };
}
