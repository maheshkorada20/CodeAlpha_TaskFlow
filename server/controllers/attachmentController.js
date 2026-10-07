const Attachment = require('../models/Attachment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const { uploadFile, deleteFile } = require('../services/cloudinaryService');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Upload attachment for a task
// @route   POST /api/tasks/:taskId/attachments
// @access  Private (Project Member)
const uploadTaskAttachment = asyncHandler(async (req, res) => {
  const { taskId } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a file to upload' });
  }

  const task = await Task.findById(taskId).populate('project');
  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  // Process upload through Cloudinary / local fallback
  const uploadResult = await uploadFile(req.file, `taskflow/tasks/${taskId}`);

  const attachment = await Attachment.create({
    project: task.project._id,
    task: taskId,
    uploadedBy: req.user._id,
    fileName: uploadResult.fileName,
    fileUrl: uploadResult.fileUrl,
    publicId: uploadResult.publicId,
    fileType: uploadResult.fileType,
    fileSize: uploadResult.fileSize,
  });

  task.attachments.push(attachment._id);
  await task.save();

  const populated = await Attachment.findById(attachment._id).populate('uploadedBy', 'name email avatar');

  await logActivity({
    project: task.project._id,
    task: task._id,
    user: req.user._id,
    action: 'FILE_UPLOADED',
    description: `${req.user.name} uploaded ${attachment.fileName} to task "${task.title}"`,
  });

  // Notify assigned user if someone else uploaded file
  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: 'FILE_UPLOADED',
      title: 'File Attached to Task',
      message: `${req.user.name} attached ${attachment.fileName} to "${task.title}"`,
      project: task.project._id,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project._id, 'attachment:task_uploaded', {
    taskId,
    attachment: populated,
  });

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: { attachment: populated },
  });
});

// @desc    Upload attachment for project files workspace
// @route   POST /api/projects/:projectId/attachments
// @access  Private (Project Member)
const uploadProjectAttachment = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Please select a file to upload' });
  }

  const uploadResult = await uploadFile(req.file, `taskflow/projects/${projectId}`);

  const attachment = await Attachment.create({
    project: projectId,
    uploadedBy: req.user._id,
    fileName: uploadResult.fileName,
    fileUrl: uploadResult.fileUrl,
    publicId: uploadResult.publicId,
    fileType: uploadResult.fileType,
    fileSize: uploadResult.fileSize,
  });

  const populated = await Attachment.findById(attachment._id).populate('uploadedBy', 'name email avatar');

  await logActivity({
    project: projectId,
    user: req.user._id,
    action: 'FILE_UPLOADED',
    description: `${req.user.name} uploaded file ${attachment.fileName} to project workspace`,
  });

  socketService.emitToProject(projectId, 'attachment:project_uploaded', populated);

  res.status(201).json({
    success: true,
    message: 'File uploaded successfully',
    data: { attachment: populated },
  });
});

// @desc    Get all attachments for a project
// @route   GET /api/projects/:projectId/attachments
// @access  Private (Project Member)
const getProjectAttachments = asyncHandler(async (req, res) => {
  const { projectId } = req.params;

  const attachments = await Attachment.find({ project: projectId })
    .populate('uploadedBy', 'name email avatar')
    .populate('task', 'title status')
    .sort({ createdAt: -1 });

  res.json({
    success: true,
    data: { attachments },
  });
});

// @desc    Delete attachment
// @route   DELETE /api/attachments/:id
// @access  Private (Uploader or Owner)
const deleteAttachment = asyncHandler(async (req, res) => {
  const attachment = await Attachment.findById(req.params.id);

  if (!attachment) {
    return res.status(404).json({ success: false, message: 'Attachment not found' });
  }

  const isUploader = attachment.uploadedBy.toString() === req.user._id.toString();
  const isAdmin = req.user.globalRole === 'admin';

  if (!isUploader && !isAdmin) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this file' });
  }

  // Remove from storage
  await deleteFile(attachment.publicId, attachment.fileUrl);

  // If linked to task, remove from task.attachments
  if (attachment.task) {
    await Task.findByIdAndUpdate(attachment.task, {
      $pull: { attachments: attachment._id },
    });
  }

  await attachment.deleteOne();

  socketService.emitToProject(attachment.project, 'attachment:deleted', {
    attachmentId: req.params.id,
  });

  res.json({
    success: true,
    message: 'Attachment deleted successfully',
    data: {},
  });
});

module.exports = {
  uploadTaskAttachment,
  uploadProjectAttachment,
  getProjectAttachments,
  deleteAttachment,
};
