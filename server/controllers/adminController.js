const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');
const { getPagination, formatPaginatedResponse } = require('../utils/pagination');

// @desc    Get overall admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getAdminDashboard = asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ isActive: true });

  const totalProjects = await Project.countDocuments();
  const activeProjects = await Project.countDocuments({ status: 'ACTIVE' });
  const completedProjects = await Project.countDocuments({ status: 'COMPLETED' });

  const totalTasks = await Task.countDocuments();
  const completedTasks = await Task.countDocuments({ status: 'DONE' });
  const overdueTasks = await Task.countDocuments({
    status: { $ne: 'DONE' },
    dueDate: { $lt: new Date() },
  });

  const recentUsers = await User.find()
    .select('-password')
    .sort({ createdAt: -1 })
    .limit(5);

  const recentProjects = await Project.find()
    .populate('owner', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json({
    success: true,
    data: {
      stats: {
        totalUsers,
        activeUsers,
        totalProjects,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
      },
      recentUsers,
      recentProjects,
    },
  });
});

// @desc    Get list of all users with search and pagination
// @route   GET /api/admin/users
// @access  Private (Admin only)
const getAdminUsers = asyncHandler(async (req, res) => {
  const { search, role, status } = req.query;
  const { page, limit, skip } = getPagination(req);

  let query = {};
  if (search && search.trim() !== '') {
    const reg = new RegExp(search.trim(), 'i');
    query.$or = [{ name: reg }, { email: reg }];
  }
  if (role && role !== 'ALL') {
    query.globalRole = role;
  }
  if (status && status !== 'ALL') {
    query.isActive = status === 'active';
  }

  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: formatPaginatedResponse({ data: users, total, page, limit }),
  });
});

// @desc    Toggle user active/inactive status
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin only)
const toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Admins cannot deactivate their own account' });
  }

  user.isActive = !user.isActive;
  await user.save();

  res.json({
    success: true,
    message: `User account has been ${user.isActive ? 'activated' : 'deactivated'}`,
    data: { user },
  });
});

// @desc    Get all projects on platform
// @route   GET /api/admin/projects
// @access  Private (Admin only)
const getAdminProjects = asyncHandler(async (req, res) => {
  const { search, status } = req.query;
  const { page, limit, skip } = getPagination(req);

  let query = {};
  if (search && search.trim() !== '') {
    query.name = new RegExp(search.trim(), 'i');
  }
  if (status && status !== 'ALL') {
    query.status = status;
  }

  const total = await Project.countDocuments(query);
  const projects = await Project.find(query)
    .populate('owner', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: formatPaginatedResponse({ data: projects, total, page, limit }),
  });
});

// @desc    Get all tasks on platform
// @route   GET /api/admin/tasks
// @access  Private (Admin only)
const getAdminTasks = asyncHandler(async (req, res) => {
  const { search, status, priority } = req.query;
  const { page, limit, skip } = getPagination(req);

  let query = {};
  if (search && search.trim() !== '') {
    query.title = new RegExp(search.trim(), 'i');
  }
  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (priority && priority !== 'ALL') {
    query.priority = priority;
  }

  const total = await Task.countDocuments(query);
  const tasks = await Task.find(query)
    .populate('project', 'name')
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({
    success: true,
    data: formatPaginatedResponse({ data: tasks, total, page, limit }),
  });
});

// @desc    Platform-wide analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin only)
const getAdminAnalytics = asyncHandler(async (req, res) => {
  const tasksByStatus = await Task.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  const tasksByPriority = await Task.aggregate([
    { $group: { _id: '$priority', count: { $sum: 1 } } },
  ]);

  const projectsByStatus = await Project.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);

  res.json({
    success: true,
    data: {
      tasksByStatus,
      tasksByPriority,
      projectsByStatus,
    },
  });
});

// @desc    Update user global role
// @route   PATCH /api/admin/users/:id/role
// @access  Private (Admin only)
const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Invalid role specified. Role must be user or admin.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString() && role !== 'admin') {
    return res.status(400).json({ success: false, message: 'Admins cannot revoke their own admin privileges' });
  }

  user.globalRole = role;
  await user.save();

  res.json({
    success: true,
    message: `User role has been updated to ${role}`,
    data: { user },
  });
});

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin only)
const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'Admins cannot delete their own account' });
  }

  await User.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'User account has been permanently removed',
  });
});

module.exports = {
  getAdminDashboard,
  getAdminUsers,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getAdminProjects,
  getAdminTasks,
  getAdminAnalytics,
};
