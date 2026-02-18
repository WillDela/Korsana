import client from './client';

export const coachAPI = {
  // Send a message to the AI coach
  sendMessage: async (message) => {
    const response = await client.post('/coach/message', { message });
    return response.data;
  },

  // Get conversation history
  getHistory: async () => {
    const response = await client.get('/coach/history');
    return response.data;
  },

  // Generate a training plan
  generatePlan: async (days = 7, confirm = false) => {
    const response = await client.post('/coach/generate-plan', { days, confirm });
    return response.data;
  },
};
