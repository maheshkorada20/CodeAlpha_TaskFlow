import API from './api';

export const taskService = {
  getTasks: (projectId, params) => API.get(`/tasks/project/${projectId}`, { params }),
  getMyTasks: (params) => API.get('/tasks/my-tasks', { params }),
  getTaskById: (id) => API.get(`/tasks/${id}`),
  createTask: (projectId, data) => API.post(`/tasks/project/${projectId}`, data),
  updateTask: (id, data) => API.put(`/tasks/${id}`, data),
  deleteTask: (id) => API.delete(`/tasks/${id}`),
  updateStatus: (id, status, order) => API.patch(`/tasks/${id}/status`, { status, order }),
  assignTask: (id, assignedTo) => API.patch(`/tasks/${id}/assign`, { assignedTo }),
  updateChecklist: (id, payload) => API.patch(`/tasks/${id}/checklist`, payload),
  submitForReview: (id, notes) => API.post(`/tasks/${id}/submit-review`, { notes }),
  approveTask: (id) => API.patch(`/tasks/${id}/approve`),
  rejectTask: (id, notes) => API.patch(`/tasks/${id}/reject`, { notes }),
  getTaskActivity: (taskId) => API.get(`/activity/task/${taskId}`),
};

export default taskService;
