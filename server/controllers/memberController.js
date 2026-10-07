const ProjectMember = require('../models/ProjectMember');
const ProjectInvitation = require('../models/ProjectInvitation');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Get all members and invitations for a project
// @route   GET /api/projects/:projectId/members
// @access  Private (Project Member)
const getMembers = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const members = await ProjectMember.find({ project: projectId })
    .populate('user', 'name email avatar bio createdAt')
    .sort({ role: -1, createdAt: 1 });

  // Augment members with task counts
  const membersWithWorkload = await Promise.all(
    members.map(async (member) => {
      const totalTasks = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
      });
      const completedTasks = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: 'DONE',
      });
      const activeTasks = await Task.countDocuments({
        project: projectId,
        assignedTo: member.user._id,
        status: { $in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
      });

      return {
        ...member.toObject(),
        workload: {
          totalTasks,
          completedTasks,
          activeTasks,
        },
      };
    })
  );

  // If user is owner or manager, fetch invitations as well
  let invitations = [];
  if (['owner', 'manager', 'admin'].includes(req.projectRole)) {
    invitations = await ProjectInvitation.find({ project: projectId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });
  }

  res.json({
    success: true,
    data: {
      members: membersWithWorkload,
      invitations,
    },
  });
});

// @desc    Update project member role (e.g. member <-> manager)
// @route   PUT /api/projects/:projectId/members/:userId
// @access  Private (Owner only)
const updateMemberRole = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;
  const { role } = req.body;

  if (!['manager', 'member'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be manager or member' });
  }

  const member = await ProjectMember.findOne({ project: projectId, user: userId }).populate('user', 'name');
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found in project' });
  }

  if (member.role === 'owner') {
    return res.status(400).json({ success: false, message: 'Cannot alter Project Owner role' });
  }

  const oldRole = member.role;
  member.role = role;
  await member.save();

  // Activity
  await logActivity({
    project: projectId,
    user: req.user._id,
    action: 'MEMBER_ROLE_CHANGED',
    description: `${req.user.name} changed ${member.user.name}'s role from ${oldRole} to ${role}`,
  });

  // Notification
  await createNotification({
    recipient: userId,
    sender: req.user._id,
    type: 'ROLE_CHANGED',
    title: 'Project Role Updated',
    message: `Your role in "${req.project.name}" was changed to ${role}`,
    project: projectId,
  });

  // Socket
  socketService.emitToProject(projectId, 'member:updated', {
    userId,
    newRole: role,
  });

  res.json({
    success: true,
    message: `Member role updated to ${role}`,
    data: { member },
  });
});

// @desc    Remove a member from the project
// @route   DELETE /api/projects/:projectId/members/:userId
// @access  Private (Owner or Manager, or user removing self)
const removeMember = asyncHandler(async (req, res) => {
  const { projectId, userId } = req.params;

  const member = await ProjectMember.findOne({ project: projectId, user: userId }).populate('user', 'name');
  if (!member) {
    return res.status(404).json({ success: false, message: 'Member not found in project' });
  }

  if (member.role === 'owner') {
    return res.status(400).json({ success: false, message: 'Project Owner cannot be removed from project' });
  }

  // Only owner, or manager removing member, or member leaving project
  const isSelf = req.user._id.toString() === userId.toString();
  const isOwner = req.projectRole === 'owner' || req.user.globalRole === 'admin';
  const isManager = req.projectRole === 'manager' && member.role === 'member';

  if (!isSelf && !isOwner && !isManager) {
    return res.status(403).json({ success: false, message: 'Permission denied to remove this member' });
  }

  await member.deleteOne();

  // Unassign tasks from removed member
  await Task.updateMany(
    { project: projectId, assignedTo: userId },
    { $unset: { assignedTo: '' } }
  );

  const actionText = isSelf
    ? `${req.user.name} left the project`
    : `${req.user.name} removed ${member.user.name} from the project`;

  await logActivity({
    project: projectId,
    user: req.user._id,
    action: 'MEMBER_REMOVED',
    description: actionText,
  });

  if (!isSelf) {
    await createNotification({
      recipient: userId,
      sender: req.user._id,
      type: 'MEMBER_REMOVED',
      title: 'Removed from Project',
      message: `You were removed from project "${req.project.name}"`,
      project: projectId,
    });
  }

  socketService.emitToProject(projectId, 'member:removed', { userId });

  res.json({
    success: true,
    message: 'Member removed from project',
    data: {},
  });
});

module.exports = {
  getMembers,
  updateMemberRole,
  removeMember,
};
