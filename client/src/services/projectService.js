import API from './api';

export const projectService = {
  getProjects: (params) => API.get('/projects', { params }),
  getProjectById: (id) => API.get(`/projects/${id}`),
  createProject: (data) => API.post('/projects', data),
  updateProject: (id, data) => API.put(`/projects/${id}`, data),
  deleteProject: (id) => API.delete(`/projects/${id}`),
  updateStatus: (id, status) => API.patch(`/projects/${id}/status`, { status }),
  archiveProject: (id) => API.patch(`/projects/${id}/archive`),
  getProjectActivity: (projectId) => API.get(`/activity/project/${projectId}`),
};

export default projectService;
