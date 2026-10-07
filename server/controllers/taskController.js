const Task = require('../models/Task');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const { createNotification } = require('../services/notificationService');
const socketService = require('../services/socketService');

// @desc    Get all tasks for a project with filters
// @route   GET /api/projects/:projectId/tasks
// @access  Private (Project Member)
const getTasks = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const { status, priority, assignee, label, search } = req.query;

  let query = { project: projectId };

  if (status && status !== 'ALL') {
    query.status = status;
  }
  if (priority && priority !== 'ALL') {
    query.priority = priority;
  }
  if (assignee && assignee !== 'ALL') {
    query.assignedTo = assignee === 'unassigned' ? null : assignee;
  }
  if (label && label !== 'ALL') {
    query.labels = label;
  }
  if (search && search.trim() !== '') {
    query.$or = [
      { title: new RegExp(search.trim(), 'i') },
      { description: new RegExp(search.trim(), 'i') },
    ];
  }

  const tasks = await Task.find(query)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('reviewSubmittedBy', 'name email avatar')
    .populate('attachments')
    .sort({ order: 1, createdAt: -1 });

  res.json({
    success: true,
    data: { tasks },
  });
});

// @desc    Get current user's assigned tasks (My Tasks)
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { projectId, status, priority } = req.query;

  let query = { assignedTo: userId };

  if (projectId) query.project = projectId;
  if (status) query.status = status;
  if (priority) query.priority = priority;

  const tasks = await Task.find(query)
    .populate('project', 'name status priority')
    .populate('createdBy', 'name email avatar')
    .populate('attachments')
    .sort({ dueDate: 1, createdAt: -1 });

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  // Group logically for the My Tasks dashboard
  const categorized = {
    today: [],
    upcoming: [],
    overdue: [],
    inProgress: [],
    inReview: [],
    completed: [],
  };

  tasks.forEach((task) => {
    if (task.status === 'DONE') {
      categorized.completed.push(task);
      return;
    }
    if (task.status === 'IN_REVIEW') {
      categorized.inReview.push(task);
    }
    if (task.status === 'IN_PROGRESS') {
      categorized.inProgress.push(task);
    }

    if (task.dueDate) {
      const due = new Date(task.dueDate);
      if (due < startOfToday) {
        categorized.overdue.push(task);
      } else if (due >= startOfToday && due <= endOfToday) {
        categorized.today.push(task);
      } else {
        categorized.upcoming.push(task);
      }
    }
  });

  res.json({
    success: true,
    data: {
      tasks,
      categorized,
      counts: {
        total: tasks.length,
        today: categorized.today.length,
        upcoming: categorized.upcoming.length,
        overdue: categorized.overdue.length,
        inProgress: categorized.inProgress.length,
        inReview: categorized.inReview.length,
        completed: categorized.completed.length,
      },
    },
  });
});

// @desc    Create a new task
// @route   POST /api/projects/:projectId/tasks
// @access  Private (Owner / Manager)
const createTask = asyncHandler(async (req, res) => {
  const { projectId } = req.params;
  const {
    title,
    description,
    assignedTo,
    status,
    priority,
    startDate,
    dueDate,
    labels,
    checklist,
  } = req.body;

  const count = await Task.countDocuments({ project: projectId, status: status || 'TODO' });

  const formattedChecklist = Array.isArray(checklist)
    ? checklist.map((item) => (typeof item === 'string' ? { title: item } : item))
    : [];

  const task = await Task.create({
    title,
    description: description || '',
    project: projectId,
    createdBy: req.user._id,
    assignedTo: assignedTo || null,
    status: status || 'TODO',
    priority: priority || 'MEDIUM',
    startDate: startDate || new Date(),
    dueDate: dueDate || null,
    labels: labels || [],
    checklist: formattedChecklist,
    order: count,
  });

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name');

  // Log activity
  await logActivity({
    project: projectId,
    task: task._id,
    user: req.user._id,
    action: 'TASK_CREATED',
    description: `${req.user.name} created task "${task.title}"`,
  });

  // Notify assigned user if specified
  if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      title: 'New Task Assigned',
      message: `${req.user.name} assigned you to task "${task.title}" in ${populatedTask.project.name}`,
      project: projectId,
      task: task._id,
    });
  }

  // Socket
  socketService.emitToProject(projectId, 'task:created', populatedTask);

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: { task: populatedTask },
  });
});

// @desc    Get single task details
// @route   GET /api/tasks/:id
// @access  Private (Project Member)
const getTaskById = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('reviewSubmittedBy', 'name email avatar')
    .populate('project', 'name status owner')
    .populate({
      path: 'attachments',
      populate: { path: 'uploadedBy', select: 'name email avatar' },
    });

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  res.json({
    success: true,
    data: { task },
  });
});

// @desc    Update task details
// @route   PUT /api/tasks/:id
// @access  Private (Owner / Manager / Assignee)
const updateTask = asyncHandler(async (req, res) => {
  const { title, description, priority, startDate, dueDate, labels, assignedTo } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;

  if (title) task.title = title;
  if (description !== undefined) task.description = description;
  if (priority) task.priority = priority;
  if (startDate) task.startDate = startDate;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (labels) task.labels = labels;
  if (assignedTo !== undefined) task.assignedTo = assignedTo || null;

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name');

  await logActivity({
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'TASK_UPDATED',
    description: `${req.user.name} updated details for task "${task.title}"`,
  });

  // If assignee changed, notify new assignee
  const newAssignee = task.assignedTo ? task.assignedTo.toString() : null;
  if (newAssignee && newAssignee !== previousAssignee && newAssignee !== req.user._id.toString()) {
    await createNotification({
      recipient: newAssignee,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      title: '📋 New Task Assigned to You',
      message: `${req.user.name} assigned you to "${task.title}" in ${populatedTask.project?.name || 'a project'}`,
      project: task.project,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project, 'task:updated', populatedTask);

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: { task: populatedTask },
  });
});

// @desc    Update task status (drag and drop or status dropdown)
// @route   PATCH /api/tasks/:id/status
// @access  Private (Project Member)
const updateTaskStatus = asyncHandler(async (req, res) => {
  const { status, order } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (!['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid task status' });
  }

  const oldStatus = task.status;
  task.status = status;
  if (order !== undefined) task.order = order;
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name owner');

  await logActivity({
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'TASK_STATUS_CHANGED',
    description: `${req.user.name} moved "${task.title}" from ${oldStatus} to ${status}`,
    metadata: { oldStatus, newStatus: status },
  });

  // Notify assignee if someone else moved their task
  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: task.assignedTo,
      sender: req.user._id,
      type: 'TASK_STATUS_CHANGED',
      title: 'Task Status Updated',
      message: `${req.user.name} moved your task "${task.title}" to ${status}`,
      project: task.project,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project, 'task:status_changed', populatedTask);

  res.json({
    success: true,
    message: `Task status updated to ${status}`,
    data: { task: populatedTask },
  });
});

// @desc    Assign or reassign task
// @route   PATCH /api/tasks/:id/assign
// @access  Private (Owner / Manager)
const assignTask = asyncHandler(async (req, res) => {
  const { assignedTo } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.assignedTo = assignedTo || null;
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('project', 'name');

  const assigneeName = populatedTask.assignedTo ? populatedTask.assignedTo.name : 'Unassigned';

  await logActivity({
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'TASK_ASSIGNED',
    description: `${req.user.name} assigned "${task.title}" to ${assigneeName}`,
  });

  if (assignedTo && assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: assignedTo,
      sender: req.user._id,
      type: 'TASK_ASSIGNED',
      title: 'Task Assigned To You',
      message: `${req.user.name} assigned you to "${task.title}"`,
      project: task.project,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project, 'task:updated', populatedTask);

  res.json({
    success: true,
    message: `Task assigned to ${assigneeName}`,
    data: { task: populatedTask },
  });
});

// @desc    Manage checklist items (add, toggle, remove)
// @route   PATCH /api/tasks/:id/checklist
// @access  Private (Project Member)
const updateChecklist = asyncHandler(async (req, res) => {
  const { action, itemId, title, completed } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  if (action === 'ADD') {
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Checklist item title is required' });
    }
    task.checklist.push({
      title: title.trim(),
      completed: false,
    });
  } else if (action === 'TOGGLE') {
    const item = task.checklist.id(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Checklist item not found' });
    }
    item.completed = completed !== undefined ? completed : !item.completed;
    item.completedBy = item.completed ? req.user._id : null;
    item.completedAt = item.completed ? new Date() : null;
  } else if (action === 'REMOVE') {
    task.checklist.pull({ _id: itemId });
  }

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar');

  socketService.emitToProject(task.project, 'task:updated', populatedTask);

  res.json({
    success: true,
    data: {
      task: populatedTask,
      checklistProgress: populatedTask.checklistProgress,
    },
  });
});

// @desc    Submit task for review (Workflow: IN_PROGRESS -> IN_REVIEW)
// @route   POST /api/tasks/:id/submit-review
// @access  Private (Assignee / Member)
const submitTaskForReview = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const task = await Task.findById(req.params.id).populate('project');

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'IN_REVIEW';
  task.reviewSubmittedBy = req.user._id;
  task.reviewSubmittedAt = new Date();
  if (notes) task.reviewNotes = notes;

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('reviewSubmittedBy', 'name email avatar');

  await logActivity({
    project: task.project._id,
    task: task._id,
    user: req.user._id,
    action: 'TASK_SUBMITTED',
    description: `${req.user.name} submitted "${task.title}" for review`,
  });

  // Notify Project Owner
  await createNotification({
    recipient: task.project.owner,
    sender: req.user._id,
    type: 'TASK_SUBMITTED',
    title: 'Task Awaiting Review',
    message: `${req.user.name} submitted "${task.title}" for review`,
    project: task.project._id,
    task: task._id,
  });

  socketService.emitToProject(task.project._id, 'task:status_changed', populatedTask);

  res.json({
    success: true,
    message: 'Task submitted for team leader review',
    data: { task: populatedTask },
  });
});

// @desc    Approve submitted task (Workflow: IN_REVIEW -> DONE)
// @route   PATCH /api/tasks/:id/approve
// @access  Private (Owner / Manager)
const approveTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'DONE';
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('reviewSubmittedBy', 'name email avatar');

  await logActivity({
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'TASK_APPROVED',
    description: `${req.user.name} approved task "${task.title}" as completed`,
  });

  // Notify the member who submitted review
  const notifyRecipient = task.reviewSubmittedBy || task.assignedTo;
  if (notifyRecipient && notifyRecipient.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: notifyRecipient,
      sender: req.user._id,
      type: 'TASK_APPROVED',
      title: 'Task Approved! 🎉',
      message: `Your work on "${task.title}" has been reviewed and approved by ${req.user.name}`,
      project: task.project,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project, 'task:status_changed', populatedTask);

  res.json({
    success: true,
    message: 'Task approved and marked as DONE',
    data: { task: populatedTask },
  });
});

// @desc    Reject submitted task (Workflow: IN_REVIEW -> IN_PROGRESS)
// @route   PATCH /api/tasks/:id/reject
// @access  Private (Owner / Manager)
const rejectTask = asyncHandler(async (req, res) => {
  const { notes } = req.body;
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  task.status = 'IN_PROGRESS';
  if (notes) task.reviewNotes = `Feedback from ${req.user.name}: ${notes}`;
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('assignedTo', 'name email avatar')
    .populate('createdBy', 'name email avatar')
    .populate('reviewSubmittedBy', 'name email avatar');

  await logActivity({
    project: task.project,
    task: task._id,
    user: req.user._id,
    action: 'TASK_REJECTED',
    description: `${req.user.name} requested changes on "${task.title}"`,
  });

  const notifyRecipient = task.reviewSubmittedBy || task.assignedTo;
  if (notifyRecipient && notifyRecipient.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: notifyRecipient,
      sender: req.user._id,
      type: 'TASK_REJECTED',
      title: 'Changes Requested on Task',
      message: `${req.user.name} reviewed "${task.title}" and requested changes${notes ? `: "${notes}"` : ''}`,
      project: task.project,
      task: task._id,
    });
  }

  socketService.emitToProject(task.project, 'task:status_changed', populatedTask);

  res.json({
    success: true,
    message: 'Task returned to IN_PROGRESS for revisions',
    data: { task: populatedTask },
  });
});

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Owner / Manager)
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    return res.status(404).json({ success: false, message: 'Task not found' });
  }

  const projectId = task.project;
  const taskTitle = task.title;

  await task.deleteOne();

  await logActivity({
    project: projectId,
    user: req.user._id,
    action: 'TASK_DELETED',
    description: `${req.user.name} deleted task "${taskTitle}"`,
  });

  socketService.emitToProject(projectId, 'task:deleted', { taskId: req.params.id });

  res.json({
    success: true,
    message: 'Task deleted successfully',
    data: {},
  });
});

module.exports = {
  getTasks,
  getMyTasks,
  createTask,
  getTaskById,
  updateTask,
  updateTaskStatus,
  assignTask,
  updateChecklist,
  submitTaskForReview,
  approveTask,
  rejectTask,
  deleteTask,
};
