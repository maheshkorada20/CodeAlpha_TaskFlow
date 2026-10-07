import API from './api';

export const commentService = {
  getComments: (taskId) => API.get(`/comments/task/${taskId}`),
  createComment: (taskId, data) => API.post(`/comments/task/${taskId}`, data),
  updateComment: (commentId, data) => API.put(`/comments/${commentId}`, data),
  deleteComment: (commentId) => API.delete(`/comments/${commentId}`),
};

export default commentService;
