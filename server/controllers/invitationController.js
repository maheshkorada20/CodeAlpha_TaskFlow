const ProjectInvitation = require('../models/ProjectInvitation');
const ProjectMember = require('../models/ProjectMember');
const Project = require('../models/Project');
const asyncHandler = require('../utils/asyncHandler');
const { createOrRegenerateInvitation } = require('../services/invitationService');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Get active invitation link for a project
// @route   GET /api/invitations/project/:projectId
// @access  Private (Owner / Manager)
const getProjectInvitation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  let invitation = await ProjectInvitation.findOne({
    project: projectId,
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() },
  }).populate('createdBy', 'name email');

  // If no active invitation exists, automatically generate one for ease of use
  if (!invitation || (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses)) {
    invitation = await createOrRegenerateInvitation({
      projectId,
      userId: req.user._id,
      expiresInDays: 30,
      maxUses: 25,
      role: 'member',
    });
    invitation = await ProjectInvitation.findById(invitation._id).populate('createdBy', 'name email');
  }

  res.json({
    success: true,
    data: {
      invitation,
    },
  });
});

// @desc    Generate a new invitation link for a project
// @route   POST /api/invitations/project/:projectId
// @access  Private (Owner / Manager)
const createInvitation = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { expiresInDays = 30, maxUses = 10, role = 'member' } = req.body;

  // Check if an active, usable invitation already exists
  let invitation = await ProjectInvitation.findOne({
    project: projectId,
    status: 'ACTIVE',
    expiresAt: { $gt: new Date() },
  });

  if (!invitation || (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses)) {
    invitation = await createOrRegenerateInvitation({
      projectId,
      userId: req.user._id,
      expiresInDays,
      maxUses,
      role,
    });
  }

  const populated = await ProjectInvitation.findById(invitation._id).populate('createdBy', 'name email');

  res.status(200).json({
    success: true,
    message: 'Invitation link ready',
    data: {
      invitation: populated,
    },
  });
});

const sanitizeToken = (raw) => {
  if (!raw) return '';
  const trimmed = String(raw).trim();
  const lastSegment = trimmed.split('?')[0].split('/').filter(Boolean).pop() || trimmed;
  return lastSegment.replace(/[-\s]/g, '').toUpperCase();
};

// @desc    Get invitation details by token (Public endpoint to preview project before joining)
// @route   GET /api/invitations/:token
// @access  Public
const getInvitationByToken = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const cleanToken = sanitizeToken(token);

  const invitation = await ProjectInvitation.findOne({
    $or: [{ token: cleanToken }, { token: token.trim() }],
  })
    .populate('project', 'name description objective status priority')
    .populate('createdBy', 'name email avatar');

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: 'Invitation not found or invalid link',
    });
  }

  // Check validity
  if (invitation.status === 'DISABLED') {
    return res.status(410).json({
      success: false,
      message: 'This invitation link has been disabled by the project owner',
    });
  }

  if (new Date() > invitation.expiresAt) {
    invitation.status = 'EXPIRED';
    await invitation.save();
    return res.status(410).json({
      success: false,
      message: 'This invitation link has expired',
    });
  }

  if (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
    invitation.status = 'FULL';
    await invitation.save();
    return res.status(410).json({
      success: false,
      message: 'This invitation link has reached its maximum allowed uses',
    });
  }

  res.json({
    success: true,
    data: {
      invitation: {
        token: invitation.token,
        project: invitation.project,
        createdBy: invitation.createdBy,
        expiresAt: invitation.expiresAt,
        role: invitation.role,
        status: invitation.status,
      },
    },
  });
});

// @desc    Join project using invitation token
// @route   POST /api/invitations/:token/join
// @access  Private
const joinProject = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const cleanToken = sanitizeToken(token);
  const user = req.user;

  const invitation = await ProjectInvitation.findOne({
    $or: [{ token: cleanToken }, { token: token.trim() }],
  }).populate('project');

  if (!invitation) {
    return res.status(404).json({
      success: false,
      message: 'Invalid invitation link',
    });
  }

  if (invitation.status !== 'ACTIVE') {
    return res.status(400).json({
      success: false,
      message: `Invitation is no longer active (Status: ${invitation.status})`,
    });
  }

  if (new Date() > invitation.expiresAt) {
    invitation.status = 'EXPIRED';
    await invitation.save();
    return res.status(400).json({
      success: false,
      message: 'This invitation link has expired',
    });
  }

  if (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
    invitation.status = 'FULL';
    await invitation.save();
    return res.status(400).json({
      success: false,
      message: 'This invitation link has reached its maximum uses',
    });
  }

  const project = await Project.findById(invitation.project._id);
  if (!project) {
    return res.status(404).json({
      success: false,
      message: 'Project associated with this invitation does not exist',
    });
  }

  // Prevent duplicate membership
  const existingMember = await ProjectMember.findOne({
    project: project._id,
    user: user._id,
  });

  if (existingMember) {
    return res.status(400).json({
      success: false,
      message: 'You are already a member of this project',
      data: {
        projectId: project._id,
      },
    });
  }

  // Create ProjectMember
  const member = await ProjectMember.create({
    project: project._id,
    user: user._id,
    role: invitation.role || 'member',
  });

  // Increment usage
  invitation.usedCount += 1;
  if (invitation.maxUses > 0 && invitation.usedCount >= invitation.maxUses) {
    invitation.status = 'FULL';
  }
  await invitation.save();

  // Activity
  await logActivity({
    project: project._id,
    user: user._id,
    action: 'MEMBER_JOINED',
    description: `${user.name} joined the project via invitation link.`,
  });

  // Notification for Project Owner
  await createNotification({
    recipient: project.owner,
    sender: user._id,
    type: 'MEMBER_JOINED',
    title: 'New Member Joined',
    message: `${user.name} joined "${project.name}"`,
    project: project._id,
  });

  const populatedMember = await ProjectMember.findById(member._id).populate(
    'user',
    'name email avatar bio createdAt'
  );

  // Emit real-time event to project room
  socketService.emitToProject(project._id, 'member:joined', {
    member: populatedMember,
    projectId: project._id,
  });

  res.status(200).json({
    success: true,
    message: `Successfully joined ${project.name}!`,
    data: {
      projectId: project._id,
      member: populatedMember,
    },
  });
});

// @desc    Disable an invitation link
// @route   PATCH /api/invitations/:id/disable
// @access  Private (Owner/Manager)
const disableInvitation = asyncHandler(async (req, res) => {
  const invitation = await ProjectInvitation.findById(req.params.id);
  if (!invitation) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }

  invitation.status = 'DISABLED';
  await invitation.save();

  res.json({
    success: true,
    message: 'Invitation disabled successfully',
    data: { invitation },
  });
});

// @desc    Regenerate invitation token
// @route   POST /api/invitations/:id/regenerate
// @access  Private (Owner/Manager)
const regenerateInvitation = asyncHandler(async (req, res) => {
  const oldInvitation = await ProjectInvitation.findById(req.params.id);
  if (!oldInvitation) {
    return res.status(404).json({ success: false, message: 'Invitation not found' });
  }

  // Mark old as disabled
  oldInvitation.status = 'DISABLED';
  await oldInvitation.save();

  // Create new invitation
  const newInvitation = await createOrRegenerateInvitation({
    projectId: oldInvitation.project,
    userId: req.user._id,
    expiresInDays: 30,
    maxUses: oldInvitation.maxUses || 10,
    role: oldInvitation.role || 'member',
  });

  const populated = await ProjectInvitation.findById(newInvitation._id).populate('createdBy', 'name email');

  res.json({
    success: true,
    message: 'Invitation regenerated successfully',
    data: { invitation: populated },
  });
});

module.exports = {
  getProjectInvitation,
  createInvitation,
  getInvitationByToken,
  joinProject,
  disableInvitation,
  regenerateInvitation,
};
