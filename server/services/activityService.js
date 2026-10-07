const Activity = require('../models/Activity');
const socketService = require('./socketService');

const logActivity = async ({
  project,
  task = null,
  user,
  action,
  description,
  metadata = {},
}) => {
  try {
    const activity = await Activity.create({
      project,
      task,
      user,
      action,
      description,
      metadata,
    });

    const populatedActivity = await Activity.findById(activity._id)
      .populate('user', 'name email avatar')
      .populate('task', 'title status priority');

    // Emit real-time activity to the project room
    if (project) {
      socketService.emitToProject(project, 'activity:new', populatedActivity);
    }

    return populatedActivity;
  } catch (error) {
    console.error('Error logging activity:', error.message);
    return null;
  }
};

module.exports = {
  logActivity,
};
