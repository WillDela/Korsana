import { getStravaRedirectState } from './stravaRedirect';

export function getOnboardingPrimaryButtonLabel({
  step,
  stravaConnected = false,
  submitting = false,
}) {
  if (step === 0) return 'Get Started';
  if (step === 1) return stravaConnected ? 'Continue' : 'Skip for now';
  if (step === 2) return submitting ? 'Creating goal...' : 'Set Goal';
  return 'Open Dashboard';
}

export function getOnboardingSecondaryButtonLabel(step) {
  return step === 2 ? 'Skip for now' : undefined;
}

export function getOnboardingIntegrationFeedback(searchParams) {
  const redirectState = getStravaRedirectState(searchParams);
  if (!redirectState) return null;

  if (redirectState.type === 'success') {
    return {
      step: 1,
      stravaConnected: true,
      message: {
        type: 'success',
        text: 'Strava connected successfully. You can continue setup or finish onboarding now.',
      },
    };
  }

  return {
    step: 1,
    stravaConnected: false,
    message: redirectState,
  };
}
