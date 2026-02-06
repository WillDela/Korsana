import api from './client';

export const goalsAPI = {
  // Create a new race goal
  createGoal: async (goalData) => {
    const response = await api.post('/goals', goalData);
    return response.data;
  },

  // Get all goals for the current user
  getGoals: async () => {
    const response = await api.get('/goals');
    return response.data;
  },

  // Get the active goal
  getActiveGoal: async () => {
    const response = await api.get('/goals/active');
    return response.data;
  },

  // Get a specific goal by ID
  getGoal: async (goalId) => {
    const response = await api.get(`/goals/${goalId}`);
    return response.data;
  },

  // Update a goal
  updateGoal: async (goalId, goalData) => {
    const response = await api.put(`/goals/${goalId}`, goalData);
    return response.data;
  },

  // Delete a goal
  deleteGoal: async (goalId) => {
    const response = await api.delete(`/goals/${goalId}`);
    return response.data;
  },
};
