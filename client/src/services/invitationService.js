import API from './api';

export const invitationService = {
  getProjectInvitation: (projectId) => API.get(`/invitations/project/${projectId}`),
  createInvitation: (projectId, data) => API.post(`/invitations/project/${projectId}`, data),
  getInvitationByToken: (token) => API.get(`/invitations/${token}`),
  joinProject: (token) => API.post(`/invitations/${token}/join`),
  disableInvitation: (id) => API.patch(`/invitations/${id}/disable`),
  regenerateInvitation: (id) => API.post(`/invitations/${id}/regenerate`),
};

export default invitationService;
