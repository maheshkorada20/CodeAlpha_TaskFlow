const Task = require('../models/Task');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get real analytics for a project
// @route   GET /api/projects/:projectId/analytics
// @access  Private (Project Member)
const getProjectAnalytics = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const project = await Project.findById(projectId);
  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Tasks counts by status
  const totalTasks = await Task.countDocuments({ project: projectId });
  const todoTasks = await Task.countDocuments({ project: projectId, status: 'TODO' });
  const inProgressTasks = await Task.countDocuments({ project: projectId, status: 'IN_PROGRESS' });
  const inReviewTasks = await Task.countDocuments({ project: projectId, status: 'IN_REVIEW' });
  const doneTasks = await Task.countDocuments({ project: projectId, status: 'DONE' });

  // Overdue count
  const overdueTasks = await Task.countDocuments({
    project: projectId,
    status: { $ne: 'DONE' },
    dueDate: { $lt: new Date() },
  });

  const completionPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  // Status breakdown array for charts
  const statusData = [
    { name: 'To Do', value: todoTasks, key: 'TODO', color: '#64748b' },
    { name: 'In Progress', value: inProgressTasks, key: 'IN_PROGRESS', color: '#3b82f6' },
    { name: 'In Review', value: inReviewTasks, key: 'IN_REVIEW', color: '#f59e0b' },
    { name: 'Done', value: doneTasks, key: 'DONE', color: '#10b981' },
  ];

  // Priority breakdown - Case-insensitive regex to catch LOW, Low, low, etc.
  const lowPriority = await Task.countDocuments({ project: projectId, priority: { $regex: /^low$/i } });
  const mediumPriority = await Task.countDocuments({ project: projectId, priority: { $regex: /^medium$/i } });
  const highPriority = await Task.countDocuments({ project: projectId, priority: { $regex: /^high$/i } });
  const urgentPriority = await Task.countDocuments({ project: projectId, priority: { $regex: /^urgent$/i } });

  const priorityData = [
    { name: 'Low', count: lowPriority, color: '#10b981' },
    { name: 'Medium', count: mediumPriority, color: '#3b82f6' },
    { name: 'High', count: highPriority, color: '#f59e0b' },
    { name: 'Urgent', count: urgentPriority, color: '#ef4444' },
  ];

  // Member workload - ensure all active project members and project lead are included
  const members = await ProjectMember.find({ project: projectId }).populate(
    'user',
    'name email avatar'
  );

  const populatedProject = await Project.findById(projectId).populate('owner', 'name email avatar');

  const validMembers = members
    .filter(m => m && m.user && m.user._id)
    .map(m => ({ user: m.user, role: m.role }));

  // Include project owner in workload if not already listed
  if (populatedProject && populatedProject.owner && populatedProject.owner._id) {
    const ownerIdStr = populatedProject.owner._id.toString();
    const hasOwner = validMembers.some(m => m.user._id.toString() === ownerIdStr);
    if (!hasOwner) {
      validMembers.unshift({ user: populatedProject.owner, role: 'Owner' });
    }
  }

  const memberWorkload = await Promise.all(
    validMembers.map(async (m) => {
      const uId = m.user._id;
      const memberTotal = await Task.countDocuments({
        project: projectId,
        assignedTo: uId,
      });
      const memberDone = await Task.countDocuments({
        project: projectId,
        assignedTo: uId,
        status: 'DONE',
      });
      const memberActive = await Task.countDocuments({
        project: projectId,
        assignedTo: uId,
        status: { $in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
      });
      const memberOverdue = await Task.countDocuments({
        project: projectId,
        assignedTo: uId,
        status: { $ne: 'DONE' },
        dueDate: { $lt: new Date() },
      });

      return {
        userId: uId,
        name: m.user.name || 'Member',
        email: m.user.email || '',
        avatar: m.user.avatar || '',
        role: m.role || 'Member',
        total: memberTotal,
        completed: memberDone,
        active: memberActive,
        overdue: memberOverdue,
      };
    })
  );

  // Unassigned tasks count
  const unassignedTasks = await Task.countDocuments({
    project: projectId,
    assignedTo: null,
  });

  // Recent completion timeline (last 7 days)
  const now = new Date();
  const timelineData = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0);
    const dayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 23, 59, 59, 999);

    const completedOnDay = await Task.countDocuments({
      project: projectId,
      status: 'DONE',
      updatedAt: { $gte: dayStart, $lte: dayEnd },
    });

    const dayName = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    timelineData.push({
      date: dayName,
      completed: completedOnDay,
    });
  }

  res.json({
    success: true,
    data: {
      metrics: {
        totalTasks,
        todoTasks,
        inProgressTasks,
        inReviewTasks,
        doneTasks,
        overdueTasks,
        completionPercentage,
        unassignedTasks,
        membersCount: validMembers.length,
      },
      statusData,
      priorityData,
      memberWorkload,
      timelineData,
    },
  });
});

// @desc    Get logged in user's global dashboard analytics
// @route   GET /api/dashboard/analytics
// @access  Private
const getUserDashboardAnalytics = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Projects joined
  const memberRecords = await ProjectMember.find({ user: userId }).select('project');
  const projectIds = memberRecords.map((m) => m.project);

  const totalProjects = projectIds.length;
  const activeProjects = await Project.countDocuments({
    _id: { $in: projectIds },
    status: 'ACTIVE',
  });

  // Tasks assigned to user
  const totalTasks = await Task.countDocuments({ assignedTo: userId });
  const completedTasks = await Task.countDocuments({ assignedTo: userId, status: 'DONE' });
  const activeTasks = await Task.countDocuments({
    assignedTo: userId,
    status: { $in: ['TODO', 'IN_PROGRESS'] },
  });
  const inReviewTasks = await Task.countDocuments({
    assignedTo: userId,
    status: 'IN_REVIEW',
  });
  const overdueTasks = await Task.countDocuments({
    assignedTo: userId,
    status: { $ne: 'DONE' },
    dueDate: { $lt: new Date() },
  });

  // Urgent pending tasks
  const urgentTasks = await Task.find({
    assignedTo: userId,
    priority: { $in: ['HIGH', 'URGENT'] },
    status: { $ne: 'DONE' },
  })
    .populate('project', 'name')
    .sort({ dueDate: 1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      stats: {
        totalProjects,
        activeProjects,
        totalTasks,
        completedTasks,
        activeTasks,
        inReviewTasks,
        overdueTasks,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      urgentTasks,
    },
  });
});

module.exports = {
  getProjectAnalytics,
  getUserDashboardAnalytics,
};
