const Comment = require('../models/Comment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Get all comments for a task
// @route   GET /api/tasks/:taskId/comments
// @access  Private (Project Member)
const getComments = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  const comments = await Comment.find({ task: taskId })
    .populate('user', 'name email avatar')
    .populate('mentions', 'name email')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name email avatar' },
    })
    .sort({ createdAt: 1 });

  res.json({
    success: true,
    data: { comments },
  });
});

// @desc    Add a comment to a task
// @route   POST /api/tasks/:taskId/comments
// @access  Private (Project Member)
const createComment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;
  const { content, mentions = [], attachments = [], parentComment = null } = req.body;

  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const comment = await Comment.create({
    task: taskId,
    user: req.user._id,
    content,
    parentComment: parentComment || null,
    mentions: mentions || [],
    attachments: attachments || [],
  });

  const populatedComment = await Comment.findById(comment._id)
    .populate('user', 'name email avatar')
    .populate('mentions', 'name email')
    .populate('attachments');

  await logActivity({
    project: task.project._id,
    task: task._id,
    user: req.user._id,
    action: 'COMMENT_ADDED',
    description: `${req.user.name} commented on task "${task.title}"`,
  });

  // Notify assigned user if someone else commented
  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    const isAppreciation = content.includes('Appreciation') || content.includes('🏆') || content.includes('👏') || content.includes('🚀') || content.includes('🎉');
    await createNotification({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: isAppreciation ? 'TASK_APPROVED' : 'COMMENT_ADDED',
      title: isAppreciation ? '🌟 Team Lead Appreciated Your Work!' : 'New Comment on Your Task',
      message: isAppreciation 
        ? `${req.user.name} sent you appreciation on "${task.title}": ${content.replace('🏆 Appreciation from Team Lead: ', '')}`
        : `${req.user.name} commented on "${task.title}": "${content.substring(0, 50)}..."`,
      project: task.project._id,
      task: task._id,
    });
  }

  // Notify any mentioned users
  if (Array.isArray(mentions) && mentions.length > 0) {
    for (const mentionId of mentions) {
      if (mentionId !== req.user._id.toString()) {
        await createNotification({
          recipient: mentionId,
          sender: req.user._id,
          type: 'MENTION',
          title: 'You were mentioned',
          message: `${req.user.name} mentioned you in a comment on "${task.title}"`,
          project: task.project._id,
          task: task._id,
        });
      }
    }
  }

  // Socket
  socketService.emitToProject(task.project._id, 'comment:new', {
    taskId,
    comment: populatedComment,
  });

  res.status(201).json({
    success: true,
    message: 'Comment posted',
    data: { comment: populatedComment },
  });
});

// @desc    Update own comment
// @route   PUT /api/comments/:id
// @access  Private (Comment author)
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const comment = await Comment.findById(req.params.id);

  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  if (comment.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Cannot edit comments written by other users' });
  }

  comment.content = content;
  comment.isEdited = true;
  await comment.save();

  const populated = await Comment.findById(comment._id)
    .populate('user', 'name email avatar')
    .populate('attachments');

  const task = await Task.findById(comment.task).select('project');
  if (task) {
    socketService.emitToProject(task.project, 'comment:updated', {
      taskId: comment.task,
      comment: populated,
    });
  }

  res.json({
    success: true,
    message: 'Comment updated',
    data: { comment: populated },
  });
});

// @desc    Delete comment
// @route   DELETE /api/comments/:id
// @access  Private (Author or Project Owner/Manager)
const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }

  const task = await Task.findById(comment.task).select('project');
  const isAuthor = comment.user.toString() === req.user._id.toString();
  const isAdminOrOwner = ['admin', 'owner', 'manager'].includes(req.user.globalRole);

  if (!isAuthor && !isAdminOrOwner) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
  }

  await comment.deleteOne();

  if (task) {
    socketService.emitToProject(task.project, 'comment:deleted', {
      taskId: comment.task,
      commentId: req.params.id,
    });
  }

  res.json({
    success: true,
    message: 'Comment deleted',
    data: {},
  });
});

module.exports = {
  getComments,
  createComment,
  updateComment,
  deleteComment,
};
