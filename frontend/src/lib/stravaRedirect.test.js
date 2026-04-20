import { describe, expect, it } from 'vitest';
import { formatStravaSyncMessage, getStravaRedirectState } from './stravaRedirect';

describe('stravaRedirect helpers', () => {
  it('prefers the richer backend sync message when present', () => {
    expect(formatStravaSyncMessage({
      count: 12,
      status: 'partial',
      message: 'Synced 12 recent Strava activities. Older backlog will continue on later syncs.',
    })).toBe('Synced 12 recent Strava activities. Older backlog will continue on later syncs.');
  });

  it('preserves after-connect messaging around richer backend sync messages', () => {
    expect(formatStravaSyncMessage({
      count: 0,
      status: 'noop',
      message: 'No new Strava activities found.',
    }, { afterConnect: true })).toBe('Strava connected. No new Strava activities found.');
  });

  it('maps known redirect params into user-facing messages', () => {
    const params = new URLSearchParams('strava_error=already_connected');
    expect(getStravaRedirectState(params)).toEqual({
      type: 'error',
      text: 'This Strava account is already linked to another Korsana account.',
    });
  });
});
