import api from './client';

export const userProfileAPI = {
  getFullProfile: async () => {
    const response = await api.get('/profile');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await api.put('/profile', data);
    return response.data;
  },

  sendTestNotification: async (type) => {
    const response = await api.post('/profile/notifications/test', { type });
    return response.data;
  },

  requestIntegrationInterest: async (source) => {
    const response = await api.post(`/profile/integrations/interest/${encodeURIComponent(source)}`);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.put('/profile/password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    const response = await api.post('/profile/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getPersonalRecords: async () => {
    const response = await api.get('/profile/prs');
    return response.data;
  },

  upsertPersonalRecord: async (label, data) => {
    const response = await api.put(`/profile/prs/${encodeURIComponent(label)}`, data);
    return response.data;
  },

  deletePersonalRecord: async (label) => {
    const response = await api.delete(`/profile/prs/${encodeURIComponent(label)}`);
    return response.data;
  },

  detectPRsFromStrava: async () => {
    const response = await api.post('/profile/prs/detect');
    return response.data;
  },

  getTrainingZones: async (type) => { // 'hr' or 'pace'
    const response = await api.get(`/profile/zones?type=${type}`);
    return response.data;
  },

  updateTrainingZones: async (type, zones) => {
    const response = await api.put(`/profile/zones?type=${type}`, zones);
    return response.data;
  },

  calculateZones: async (type) => {
    const response = await api.post(`/profile/zones/calculate?type=${type}`);
    return response.data;
  },

  changeEmail: async (currentPassword, newEmail) => {
    const response = await api.put('/profile/email', { current_password: currentPassword, new_email: newEmail });
    return response.data;
  },

  deleteAccount: async () => {
    const response = await api.delete('/profile');
    return response.data;
  },

  exportData: async () => {
    const response = await api.get('/profile/export', { responseType: 'blob' });
    return response.data;
  },
};
