const Activity = require('../models/Activity');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get project activity timeline
// @route   GET /api/projects/:projectId/activity
// @access  Private (Project Member)
const getProjectActivity = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 40);

  const activities = await Activity.find({ project: projectId })
    .populate('user', 'name email avatar')
    .populate('task', 'title status priority')
    .sort({ createdAt: -1 })
    .limit(limit);

  res.json({
    success: true,
    data: { activities },
  });
});

// @desc    Get task specific activity timeline
// @route   GET /api/tasks/:taskId/activity
// @access  Private (Project Member)
const getTaskActivity = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const activities = await Activity.find({ task: taskId })
    .populate('user', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(30);

  res.json({
    success: true,
    data: { activities },
  });
});

module.exports = {
  getProjectActivity,
  getTaskActivity,
};
