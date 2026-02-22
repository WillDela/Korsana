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
  getActivities: async (page = 1, perPage = 30) => {
    const response = await api.get(`/strava/activities?page=${page}&per_page=${perPage}`);
    return response.data;
  },
};
