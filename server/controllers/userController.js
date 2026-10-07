const User = require('../models/User');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Search active users for assignment or invites
// @route   GET /api/users/search
// @access  Private
const searchUsers = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim() === '') {
    return res.json({ success: true, data: { users: [] } });
  }

  const queryRegex = new RegExp(q.trim(), 'i');

  const users = await User.find({
    isActive: true,
    $or: [{ name: queryRegex }, { email: queryRegex }],
  })
    .select('_id name email avatar')
    .limit(10);

  res.json({
    success: true,
    data: { users },
  });
});

// @desc    Get public profile details & workload statistics
// @route   GET /api/users/:id
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password');
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Count projects joined
  const projectsCount = await ProjectMember.countDocuments({ user: user._id });

  // Count tasks
  const completedTasksCount = await Task.countDocuments({
    assignedTo: user._id,
    status: 'DONE',
  });

  const activeTasksCount = await Task.countDocuments({
    assignedTo: user._id,
    status: { $in: ['TODO', 'IN_PROGRESS', 'IN_REVIEW'] },
  });

  res.json({
    success: true,
    data: {
      user,
      stats: {
        projectsCount,
        completedTasksCount,
        activeTasksCount,
      },
    },
  });
});

module.exports = {
  searchUsers,
  getUserProfile,
};
