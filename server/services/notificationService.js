const Notification = require('../models/Notification');
const socketService = require('./socketService');

const createNotification = async ({
  recipient,
  sender,
  type,
  title,
  message,
  project,
  task,
}) => {
  try {
    // Avoid sending notification to oneself
    if (recipient && sender && recipient.toString() === sender.toString()) {
      return null;
    }

    const notification = await Notification.create({
      recipient,
      sender,
      type,
      title,
      message,
      project,
      task,
    });

    const populatedNotification = await Notification.findById(notification._id)
      .populate('sender', 'name email avatar')
      .populate('project', 'name')
      .populate('task', 'title');

    // Emit real-time notification to the specific recipient's room
    socketService.emitToUser(
      recipient,
      'notification:new',
      populatedNotification
    );

    return populatedNotification;
  } catch (error) {
    console.error('Error creating notification:', error.message);
    return null;
  }
};

module.exports = {
  createNotification,
};
