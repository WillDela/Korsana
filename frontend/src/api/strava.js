import api from './client';

export const stravaAPI = {
  // Get Strava auth URL. Pass returnTo (e.g. '/dashboard') to redirect back
  // to that page after the user connects, instead of going to /settings.
  getAuthURL: async (returnTo = '') => {
    const params = returnTo ? `?return_to=${encodeURIComponent(returnTo)}` : '';
    const response = await api.get(`/strava/auth${params}`);
    return response.data;
  },

  // Sync activities from Strava
  // Uses a longer timeout than the default 30s — syncing 50 activities
  // against a remote DB can take up to 60s on first run.
  syncActivities: async () => {
    const response = await api.post('/strava/sync', null, { timeout: 95000 });
    return response.data;
  },

  // Get user's activities
  getActivities: async (page = 1, perPage = 30) => {
    const response = await api.get(`/strava/activities?page=${page}&per_page=${perPage}`);
    return response.data;
  },

  // Disconnect Strava account
  disconnect: async () => {
    const response = await api.delete('/strava');
    return response.data;
  },
};
