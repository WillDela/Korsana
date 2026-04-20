import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { getArtifactLabel, parseArtifactPayload } from './coachArtifacts';

describe('coachArtifacts helpers', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('formats known and unknown artifact labels', () => {
    expect(getArtifactLabel('race_strategy')).toBe('Race Strategy');
    expect(getArtifactLabel('custom_plan_preview')).toBe('Custom Plan Preview');
    expect(getArtifactLabel(null)).toBe('Coach Artifact');
  });

  it('returns a safe fallback state for invalid artifact JSON', () => {
    const parsed = parseArtifactPayload({
      type: 'race_strategy',
      data: '{"headline":"Bad payload"',
    });

    expect(parsed).toEqual({
      ok: false,
      type: 'race_strategy',
      reason: 'The structured data for this coach reply was not valid JSON.',
    });
    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it('parses valid structured artifact data objects', () => {
    const parsed = parseArtifactPayload({
      type: 'race_strategy',
      data: {
        headline: 'Stay calm through 10K.',
        target_pace: '9:10/mi',
        phases: [{ phase: 'Start', guidance: 'Relax early.' }],
        key_reminders: ['Fuel early'],
      },
    });

    expect(parsed.ok).toBe(true);
    expect(parsed.type).toBe('race_strategy');
    expect(parsed.data.target_pace).toBe('9:10/mi');
  });
});
