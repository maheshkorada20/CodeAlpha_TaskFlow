const Message = require('../models/Message');
const asyncHandler = require('../utils/asyncHandler');
const socketService = require('../services/socketService');

// @desc    Get project chat messages (paginated or last 100)
// @route   GET /api/projects/:projectId/messages
// @access  Private (Project Member)
const getMessages = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 50);

  const messages = await Message.find({ project: projectId, isDeleted: false })
    .populate('sender', 'name email avatar')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name email avatar' },
    })
    .sort({ createdAt: 1 })
    .limit(limit);

  res.json({
    success: true,
    data: { messages },
  });
});

// @desc    Send a new chat message to the project
// @route   POST /api/projects/:projectId/messages
// @access  Private (Project Member)
const sendMessage = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { content, attachments = [] } = req.body;

  if ((!content || !content.trim()) && (!attachments || attachments.length === 0)) {
    return res.status(400).json({
      success: false,
      message: 'Message cannot be completely empty',
    });
  }

  const message = await Message.create({
    project: projectId,
    sender: req.user._id,
    content: content ? content.trim() : '',
    attachments: attachments || [],
  });

  const populatedMessage = await Message.findById(message._id)
    .populate('sender', 'name email avatar')
    .populate('attachments');

  // Emit socket event to project room
  socketService.emitToProject(projectId, 'message:new', populatedMessage);

  res.status(201).json({
    success: true,
    data: { message: populatedMessage },
  });
});

// @desc    Delete message
// @route   DELETE /api/messages/:id
// @access  Private (Author or Project Owner)
const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ success: false, message: 'Message not found' });
  }

  const isAuthor = message.sender.toString() === req.user._id.toString();
  const isOwner = req.user.globalRole === 'admin';

  if (!isAuthor && !isOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
  }

  message.isDeleted = true;
  await message.save();

  socketService.emitToProject(message.project, 'message:deleted', {
    messageId: message._id,
  });

  res.json({
    success: true,
    message: 'Message deleted',
    data: {},
  });
});

module.exports = {
  getMessages,
  sendMessage,
  deleteMessage,
};
