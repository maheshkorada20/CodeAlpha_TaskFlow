import API from './api';

export const notificationService = {
  getNotifications: (params) => API.get('/notifications', { params }),
  markAsRead: (id) => API.patch(`/notifications/${id}/read`),
  markAllAsRead: () => API.patch('/notifications/read-all'),
  deleteNotification: (id) => API.delete(`/notifications/${id}`),
};

export default notificationService;
