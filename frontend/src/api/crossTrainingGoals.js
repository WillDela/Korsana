import api from './client';

export const crossTrainingGoalsAPI = {
  getGoals: () => api.get('/cross-training-goals').then((r) => r.data),
  upsertGoal: (activityType, sessionsPerWeek) =>
    api
      .put('/cross-training-goals', {
        activity_type: activityType,
        sessions_per_week: sessionsPerWeek,
      })
      .then((r) => r.data),
  deleteGoal: (id) =>
    api.delete(`/cross-training-goals/${id}`).then((r) => r.data),
};
