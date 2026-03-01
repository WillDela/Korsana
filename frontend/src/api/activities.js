import api from './client';

export const activitiesAPI = {
  getActivities: (type = '', page = 1, perPage = 30) =>
    api
      .get(`/activities?page=${page}&per_page=${perPage}${type ? `&type=${type}` : ''}`)
      .then((r) => r.data),
  createActivity: (data) =>
    api.post('/activities', data).then((r) => r.data),
  deleteActivity: (id) =>
    api.delete(`/activities/${id}`).then((r) => r.data),
};
