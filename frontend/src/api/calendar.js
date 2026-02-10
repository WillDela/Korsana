import api from './client';

export const calendarAPI = {
  // Get calendar entries for a week
  getWeek: async (startDate) => {
    const response = await api.get(`/calendar/week?start=${startDate}`);
    return response.data;
  },

  // Create or update a calendar entry (upsert by date)
  upsertEntry: async (entry) => {
    const response = await api.put('/calendar/entry', entry);
    return response.data;
  },

  // Delete a calendar entry
  deleteEntry: async (entryId) => {
    const response = await api.delete(`/calendar/entry/${entryId}`);
    return response.data;
  },

  // Update the status of a calendar entry
  updateStatus: async (entryId, status, activityId = null) => {
    const response = await api.patch(`/calendar/entry/${entryId}/status`, {
      status,
      activity_id: activityId,
    });
    return response.data;
  },
};
