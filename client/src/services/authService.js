import API from './api';

export const authService = {
  register: (data) => API.post('/auth/register', data),
  login: (data) => API.post('/auth/login', data),
  logout: () => API.post('/auth/logout'),
  getMe: () => API.get('/auth/me'),
  updateProfile: (data) => API.put('/auth/profile', data),
  changePassword: (data) => API.put('/auth/change-password', data),
  searchUsers: (query) => API.get(`/users/search?q=${encodeURIComponent(query)}`),
  getUserProfile: (id) => API.get(`/users/${id}`),
};

export default authService;
