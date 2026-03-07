import client from './client';

export const coachAPI = {
  sendMessage: async (message) => {
    const response = await client.post('/coach/message', { message });
    return {
      ...response.data,
      _quota: extractQuotaHeaders(response.headers),
    };
  },

  getHistory: async () => {
    const response = await client.get('/coach/history');
    return response.data;
  },

  getQuota: async () => {
    const response = await client.get('/coach/quota');
    return response.data;
  },

  generatePlan: async (days = 7, confirm = false) => {
    const response = await client.post('/coach/generate-plan', { days, confirm });
    return {
      ...response.data,
      _quota: extractQuotaHeaders(response.headers),
    };
  },
};

function extractQuotaHeaders(headers) {
  const limit = parseInt(headers['x-ratelimit-limit'], 10);
  const used = parseInt(headers['x-ratelimit-used'], 10);
  const remaining = parseInt(headers['x-ratelimit-remaining'], 10);
  if (isNaN(limit)) return null;
  return { limit, used, remaining };
}
