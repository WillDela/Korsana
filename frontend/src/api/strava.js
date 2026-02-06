import api from './client';

export const stravaAPI = {
  // Get Strava auth URL
  getAuthURL: async () => {
    const response = await api.get('/strava/auth');
    return response.data;
  },

  // Sync activities from Strava
  syncActivities: async () => {
    const response = await api.post('/strava/sync');
    return response.data;
  },

  // Get user's activities
  getActivities: async () => {
    const response = await api.get('/strava/activities');
    return response.data;
  },
};
