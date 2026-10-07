const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');
const ProjectInvitation = require('../models/ProjectInvitation');
const asyncHandler = require('../utils/asyncHandler');
const { logActivity } = require('../services/activityService');
const socketService = require('../services/socketService');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = asyncHandler(async (req, res) => {
  const { name, description, objective, priority, status, startDate, dueDate, labels } = req.body;

  const defaultLabels = labels && labels.length > 0 ? labels : [
    { name: 'Frontend', color: '#3b82f6' },
    { name: 'Backend', color: '#10b981' },
    { name: 'Bug', color: '#ef4444' },
    { name: 'Feature', color: '#8b5cf6' },
    { name: 'UI/UX', color: '#f59e0b' },
    { name: 'Documentation', color: '#06b6d4' },
  ];

  const project = await Project.create({
    name,
    description,
    objective: objective || '',
    owner: req.user._id,
    priority: priority || 'MEDIUM',
    status: status || 'ACTIVE',
    startDate: startDate || new Date(),
    dueDate: dueDate || null,
    labels: defaultLabels,
  });

  // Automatically add creator as OWNER in ProjectMember collection
  await ProjectMember.create({
    project: project._id,
    user: req.user._id,
    role: 'owner',
  });

  // Log activity
  await logActivity({
    project: project._id,
    user: req.user._id,
    action: 'PROJECT_CREATED',
    description: `${req.user.name} created project "${project.name}"`,
  });

  res.status(201).json({
    success: true,
    message: 'Project created successfully',
    data: {
      project,
    },
  });
});

// @desc    Get all projects for current logged-in user
// @route   GET /api/projects
// @access  Private
const getProjects = asyncHandler(async (req, res) => {
  const { status, search } = req.query;

  // Find all projects where user is a member or owner
  let memberProjects = await ProjectMember.find({ user: req.user._id }).select('project role');
  const projectIds = memberProjects.map((m) => m.project);

  let query = { _id: { $in: projectIds } };

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (search && search.trim() !== '') {
    query.name = new RegExp(search.trim(), 'i');
  }

  const projects = await Project.find(query)
    .populate('owner', 'name email avatar')
    .sort({ updatedAt: -1 });

  // Augment each project with real task metrics
  const projectsWithMetrics = await Promise.all(
    projects.map(async (p) => {
      const totalTasks = await Task.countDocuments({ project: p._id });
      const completedTasks = await Task.countDocuments({ project: p._id, status: 'DONE' });
      const inProgressTasks = await Task.countDocuments({ project: p._id, status: 'IN_PROGRESS' });
      const inReviewTasks = await Task.countDocuments({ project: p._id, status: 'IN_REVIEW' });
      const overdueTasks = await Task.countDocuments({
        project: p._id,
        status: { $ne: 'DONE' },
        dueDate: { $lt: new Date() },
      });
      const membersCount = await ProjectMember.countDocuments({ project: p._id });

      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      const userMember = memberProjects.find((m) => m.project.toString() === p._id.toString());

      return {
        ...p.toObject(),
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          overdueTasks,
          membersCount,
          progress,
        },
        userRole: userMember ? userMember.role : (p.owner._id.toString() === req.user._id.toString() ? 'owner' : 'member'),
      };
    })
  );

  res.json({
    success: true,
    data: {
      projects: projectsWithMetrics,
    },
  });
});

// @desc    Get single project by ID with members & stats
// @route   GET /api/projects/:id
// @access  Private (project member)
const getProjectById = asyncHandler(async (req, res) => {
  const project = await Project.findById(req.params.id).populate('owner', 'name email avatar');

  if (!project) {
    return res.status(404).json({ success: false, message: 'Project not found' });
  }

  // Find user's role in this project
  const memberRecord = await ProjectMember.findOne({
    project: project._id,
    user: req.user._id,
  });

  const userRole = req.user.globalRole === 'admin' 
    ? 'admin' 
    : (project.owner._id.toString() === req.user._id.toString() ? 'owner' : (memberRecord ? memberRecord.role : 'member'));

  // Calculate real metrics
  const totalTasks = await Task.countDocuments({ project: project._id });
  const completedTasks = await Task.countDocuments({ project: project._id, status: 'DONE' });
  const inProgressTasks = await Task.countDocuments({ project: project._id, status: 'IN_PROGRESS' });
  const inReviewTasks = await Task.countDocuments({ project: project._id, status: 'IN_REVIEW' });
  const todoTasks = await Task.countDocuments({ project: project._id, status: 'TODO' });
  const overdueTasks = await Task.countDocuments({
    project: project._id,
    status: { $ne: 'DONE' },
    dueDate: { $lt: new Date() },
  });
  const membersCount = await ProjectMember.countDocuments({ project: project._id });
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  res.json({
    success: true,
    data: {
      project: {
        ...project.toObject(),
        userRole,
        metrics: {
          totalTasks,
          completedTasks,
          inProgressTasks,
          inReviewTasks,
          todoTasks,
          overdueTasks,
          membersCount,
          progress,
        },
      },
    },
  });
});

// @desc    Update project details
// @route   PUT /api/projects/:id
// @access  Private (Owner/Manager)
const updateProject = asyncHandler(async (req, res) => {
  const { name, description, objective, priority, status, startDate, dueDate, labels } = req.body;
  const project = req.project;

  if (name) project.name = name;
  if (description) project.description = description;
  if (objective !== undefined) project.objective = objective;
  if (priority) project.priority = priority;
  if (status) project.status = status;
  if (startDate) project.startDate = startDate;
  if (dueDate !== undefined) project.dueDate = dueDate;
  if (labels) project.labels = labels;

  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: 'PROJECT_UPDATED',
    description: `${req.user.name} updated project details for "${project.name}"`,
  });

  socketService.emitToProject(project._id, 'project:updated', project);

  res.json({
    success: true,
    message: 'Project updated successfully',
    data: { project },
  });
});

// @desc    Update project status
// @route   PATCH /api/projects/:id/status
// @access  Private (Owner/Manager)
const updateProjectStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const project = req.project;

  if (!['PLANNING', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'ARCHIVED'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid project status' });
  }

  project.status = status;
  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: 'STATUS_CHANGED',
    description: `${req.user.name} changed project status to ${status}`,
  });

  socketService.emitToProject(project._id, 'project:updated', project);

  res.json({
    success: true,
    message: `Project status updated to ${status}`,
    data: { project },
  });
});

// @desc    Archive project
// @route   PATCH /api/projects/:id/archive
// @access  Private (Owner)
const archiveProject = asyncHandler(async (req, res) => {
  const project = req.project;
  project.status = project.status === 'ARCHIVED' ? 'ACTIVE' : 'ARCHIVED';
  await project.save();

  await logActivity({
    project: project._id,
    user: req.user._id,
    action: project.status === 'ARCHIVED' ? 'PROJECT_ARCHIVED' : 'PROJECT_RESTORED',
    description: `${req.user.name} ${project.status === 'ARCHIVED' ? 'archived' : 'restored'} project "${project.name}"`,
  });

  socketService.emitToProject(project._id, 'project:updated', project);

  res.json({
    success: true,
    message: `Project ${project.status === 'ARCHIVED' ? 'archived' : 'restored'} successfully`,
    data: { project },
  });
});

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Owner)
const deleteProject = asyncHandler(async (req, res) => {
  const project = req.project;

  await Task.deleteMany({ project: project._id });
  await ProjectMember.deleteMany({ project: project._id });
  await ProjectInvitation.deleteMany({ project: project._id });
  await project.deleteOne();

  socketService.emitToProject(project._id, 'project:deleted', { projectId: project._id });

  res.json({
    success: true,
    message: 'Project and all related data deleted successfully',
    data: {},
  });
});

module.exports = {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  archiveProject,
  deleteProject,
};
