export const STRAVA_ERROR_MESSAGES = {
  missing_code: 'Authorization code missing.',
  missing_state: 'Security validation failed.',
  invalid_state: 'Your Strava connect session expired. Please try again.',
  connection_failed: 'Failed to connect Strava.',
  already_connected: 'This Strava account is already linked to another Korsana account.',
};

export function getStravaRedirectState(searchParams) {
  if (searchParams.get('strava_connected') === 'true') {
    return {
      type: 'success',
      text: 'Strava connected successfully.',
    };
  }

  const error = searchParams.get('strava_error');
  if (!error) return null;

  return {
    type: 'error',
    text: STRAVA_ERROR_MESSAGES[error] || 'Failed to connect Strava.',
  };
}

export function clearStravaRedirectParams(setSearchParams) {
  setSearchParams(prev => {
    const next = new URLSearchParams(prev);
    next.delete('strava_connected');
    next.delete('strava_error');
    return next;
  }, { replace: true });
}

export function formatStravaSyncMessage(count, { afterConnect = false } = {}) {
  const base = count > 0
    ? `Synced ${count} activit${count === 1 ? 'y' : 'ies'}.`
    : 'Already up to date.';

  return afterConnect ? `Strava connected. ${base}` : base;
}
