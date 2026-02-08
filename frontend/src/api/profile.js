import api from './client';

export const profileAPI = {
  // Get full profile (user + strava status + active goal)
  getProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Get AI coaching insight for dashboard
  getInsight: async () => {
    const response = await api.get('/coach/insight');
    return response.data;
  },
};
