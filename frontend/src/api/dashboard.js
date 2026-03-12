import api from './client';

export const dashboardAPI = {
  get: () => api.get('/dashboard').then(r => r.data),
};

export const crossTrainingAPI = {
  list: (weeks = 4) => api.get(`/crosstraining?weeks=${weeks}`).then(r => r.data),
  create: (data) => api.post('/crosstraining', data).then(r => r.data),
  delete: (id) => api.delete(`/crosstraining/${id}`).then(r => r.data),
};

export const gearAPI = {
  listShoes: () => api.get('/gear/shoes').then(r => r.data),
  addShoe: (data) => api.post('/gear/shoes', data).then(r => r.data),
  updateShoe: (id, data) => api.put(`/gear/shoes/${id}`, data).then(r => r.data),
  deleteShoe: (id) => api.delete(`/gear/shoes/${id}`).then(r => r.data),
};

export const predictorAPI = {
  saveManual: (data) => api.post('/predictor/manual', data).then(r => r.data),
};
