import API from './api';

export const chatService = {
  getMessages: (projectId, limit = 50) =>
    API.get(`/messages/project/${projectId}?limit=${limit}`),
  sendMessage: (projectId, data) =>
    API.post(`/messages/project/${projectId}`, data),
  deleteMessage: (messageId) => API.delete(`/messages/${messageId}`),
};

export default chatService;
