import client from './client';

export const coachAPI = {
  // Sessions
  getSessions: async () => {
    const res = await client.get('/coach/sessions');
    return res.data;
  },
  createSession: async () => {
    const res = await client.post('/coach/sessions');
    return res.data;
  },
  getSessionMessages: async (sessionId) => {
    const res = await client.get(`/coach/sessions/${sessionId}/messages`);
    return res.data;
  },

  // Messages
  sendMessage: async (message, sessionId = null) => {
    const res = await client.post('/coach/message', {
      message,
      session_id: sessionId,
    });
    return { ...res.data, _quota: extractQuota(res.headers) };
  },

  // Legacy history (no session)
  getHistory: async () => {
    const res = await client.get('/coach/history');
    return res.data;
  },

  // Dashboard insight
  getInsight: () => client.get('/coach/insight').then(r => r.data),

  // Quota
  getQuota: async () => {
    const res = await client.get('/coach/quota');
    return res.data;
  },

  // Plan
  generatePlan: async (days = 7, confirm = false) => {
    const res = await client.post('/coach/generate-plan', { days, confirm });
    return { ...res.data, _quota: extractQuota(res.headers) };
  },
};

function extractQuota(headers) {
  const limit = parseInt(headers['x-ratelimit-limit'], 10);
  const used  = parseInt(headers['x-ratelimit-used'], 10);
  const remaining = parseInt(headers['x-ratelimit-remaining'], 10);
  if (isNaN(limit)) return null;
  return { limit, used, remaining };
}
