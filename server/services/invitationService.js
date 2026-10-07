const crypto = require('crypto');
const ProjectInvitation = require('../models/ProjectInvitation');

// Generate 10-character secure alphanumeric token (e.g., 8FJ29KX9P2)
const generateInvitationToken = () => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let token = '';
  const randomBytes = crypto.randomBytes(10);
  for (let i = 0; i < 10; i++) {
    token += chars[randomBytes[i] % chars.length];
  }
  return token;
};

const createOrRegenerateInvitation = async ({
  projectId,
  userId,
  expiresInDays = 30,
  maxUses = 10,
  role = 'member',
}) => {
  const token = generateInvitationToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (Number(expiresInDays) || 30));

  const invitation = await ProjectInvitation.create({
    token,
    project: projectId,
    createdBy: userId,
    expiresAt,
    maxUses: Number(maxUses) || 10,
    usedCount: 0,
    status: 'ACTIVE',
    role: role || 'member',
  });

  return invitation;
};

module.exports = {
  generateInvitationToken,
  createOrRegenerateInvitation,
};
