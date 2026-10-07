import API from './api';

export const analyticsService = {
  getProjectAnalytics: (projectId) => API.get(`/analytics/project/${projectId}`),
  getUserDashboardAnalytics: () => API.get('/analytics/dashboard'),
};

export default analyticsService;
