import API from './api';

export const adminService = {
  getDashboardStats: () => API.get('/admin/dashboard'),
  getUsers: (params) => API.get('/admin/users', { params }),
  toggleUserStatus: (id) => API.patch(`/admin/users/${id}/status`),
  updateUserRole: (id, role) => API.patch(`/admin/users/${id}/role`, { role }),
  deleteUser: (id) => API.delete(`/admin/users/${id}`),
  getProjects: (params) => API.get('/admin/projects', { params }),
  getTasks: (params) => API.get('/admin/tasks', { params }),
  getPlatformAnalytics: () => API.get('/admin/analytics'),
};

export default adminService;
