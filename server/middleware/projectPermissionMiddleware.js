const mongoose = require('mongoose');
const Project = require('../models/Project');
const ProjectMember = require('../models/ProjectMember');
const Task = require('../models/Task');

// Helper to extract project id from req params, body, or related entities
const resolveProjectId = async (req) => {
  if (req.params.projectId && mongoose.Types.ObjectId.isValid(req.params.projectId)) {
    return req.params.projectId;
  }
  if (req.body.projectId && mongoose.Types.ObjectId.isValid(req.body.projectId)) {
    return req.body.projectId;
  }
  if (req.params.taskId && mongoose.Types.ObjectId.isValid(req.params.taskId)) {
    const task = await Task.findById(req.params.taskId).select('project');
    if (task) return task.project.toString();
  }
  // Check if req.params.id might be a project ID
  if (req.params.id && mongoose.Types.ObjectId.isValid(req.params.id)) {
    // If the route is a project route
    if (req.baseUrl.includes('/projects')) {
      return req.params.id;
    }
    // If the route is a task route
    if (req.baseUrl.includes('/tasks')) {
      const task = await Task.findById(req.params.id).select('project');
      if (task) return task.project.toString();
    }
  }
  return null;
};

// Middleware: Require at least 'member' role (or manager or owner, or global admin)
const requireProjectMember = async (req, res, next) => {
  try {
    const projectId = await resolveProjectId(req);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID could not be identified',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    req.project = project;

    // Global admin has universal access
    if (req.user.globalRole === 'admin') {
      req.projectRole = 'admin';
      return next();
    }

    // Check project owner
    if (project.owner.toString() === req.user._id.toString()) {
      req.projectRole = 'owner';
      return next();
    }

    // Check ProjectMember record
    const member = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (!member) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not a member of this project',
      });
    }

    req.projectMember = member;
    req.projectRole = member.role;
    next();
  } catch (error) {
    console.error('Project permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project permissions',
    });
  }
};

// Middleware: Require at least 'manager' role (manager or owner, or global admin)
const requireProjectManager = async (req, res, next) => {
  try {
    const projectId = await resolveProjectId(req);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID could not be identified',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    req.project = project;

    if (req.user.globalRole === 'admin') {
      req.projectRole = 'admin';
      return next();
    }

    if (project.owner.toString() === req.user._id.toString()) {
      req.projectRole = 'owner';
      return next();
    }

    const member = await ProjectMember.findOne({
      project: projectId,
      user: req.user._id,
    });

    if (!member || (member.role !== 'manager' && member.role !== 'owner')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Manager or Owner permissions required',
      });
    }

    req.projectMember = member;
    req.projectRole = member.role;
    next();
  } catch (error) {
    console.error('Project manager permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project permissions',
    });
  }
};

// Middleware: Require 'owner' role (or global admin)
const requireProjectOwner = async (req, res, next) => {
  try {
    const projectId = await resolveProjectId(req);

    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'Project ID could not be identified',
      });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Project not found',
      });
    }

    req.project = project;

    if (req.user.globalRole === 'admin') {
      req.projectRole = 'admin';
      return next();
    }

    if (project.owner.toString() === req.user._id.toString()) {
      req.projectRole = 'owner';
      return next();
    }

    return res.status(403).json({
      success: false,
      message: 'Access denied: Only the Project Owner can perform this action',
    });
  } catch (error) {
    console.error('Project owner permission error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking project owner permissions',
    });
  }
};

module.exports = {
  requireProjectMember,
  requireProjectManager,
  requireProjectOwner,
  resolveProjectId,
};
