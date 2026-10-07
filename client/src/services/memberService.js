import API from './api';

export const memberService = {
  getMembers: (projectId) => API.get(`/projects/${projectId}/members`),
  updateMemberRole: (projectId, userId, role) =>
    API.put(`/projects/${projectId}/members/${userId}`, { role }),
  removeMember: (projectId, userId) =>
    API.delete(`/projects/${projectId}/members/${userId}`),
};

export default memberService;
