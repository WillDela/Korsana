import { describe, expect, it } from 'vitest';
import {
  getOnboardingIntegrationFeedback,
  getOnboardingPrimaryButtonLabel,
  getOnboardingSecondaryButtonLabel,
} from './onboardingFlow';

describe('onboardingFlow helpers', () => {
  it('maps primary button labels across the onboarding phases', () => {
    expect(getOnboardingPrimaryButtonLabel({ step: 0 })).toBe('Get Started');
    expect(getOnboardingPrimaryButtonLabel({ step: 1, stravaConnected: false })).toBe('Skip for now');
    expect(getOnboardingPrimaryButtonLabel({ step: 1, stravaConnected: true })).toBe('Continue');
    expect(getOnboardingPrimaryButtonLabel({ step: 2, submitting: false })).toBe('Set Goal');
    expect(getOnboardingPrimaryButtonLabel({ step: 2, submitting: true })).toBe('Creating goal...');
    expect(getOnboardingPrimaryButtonLabel({ step: 3 })).toBe('Open Dashboard');
  });

  it('only exposes a secondary action on the race goal step', () => {
    expect(getOnboardingSecondaryButtonLabel(0)).toBeUndefined();
    expect(getOnboardingSecondaryButtonLabel(1)).toBeUndefined();
    expect(getOnboardingSecondaryButtonLabel(2)).toBe('Skip for now');
    expect(getOnboardingSecondaryButtonLabel(3)).toBeUndefined();
  });

  it('turns a successful Strava redirect into onboarding feedback', () => {
    const searchParams = new URLSearchParams('strava_connected=true');

    expect(getOnboardingIntegrationFeedback(searchParams)).toEqual({
      step: 1,
      stravaConnected: true,
      message: {
        type: 'success',
        text: 'Strava connected successfully. You can continue setup or finish onboarding now.',
      },
    });
  });

  it('passes Strava redirect errors through to the onboarding step', () => {
    const searchParams = new URLSearchParams('strava_error=already_connected');

    expect(getOnboardingIntegrationFeedback(searchParams)).toEqual({
      step: 1,
      stravaConnected: false,
      message: {
        type: 'error',
        text: 'This Strava account is already linked to another Korsana account.',
      },
    });
  });
});
