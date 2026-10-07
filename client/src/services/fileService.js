import API from './api';

export const fileService = {
  uploadTaskAttachment: (taskId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post(`/attachments/task/${taskId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadProjectAttachment: (projectId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return API.post(`/attachments/project/${projectId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getProjectAttachments: (projectId) =>
    API.get(`/attachments/project/${projectId}`),
  deleteAttachment: (id) => API.delete(`/attachments/${id}`),
};

export default fileService;
