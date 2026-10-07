const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  updateProjectStatus,
  archiveProject,
  deleteProject,
} = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');
const {
  requireProjectMember,
  requireProjectManager,
  requireProjectOwner,
} = require('../middleware/projectPermissionMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
  createProjectValidator,
  updateProjectValidator,
} = require('../validators/projectValidators');

router.use(protect);

router.route('/')
  .get(getProjects)
  .post(createProjectValidator, validate, createProject);

router.route('/:id')
  .get(requireProjectMember, getProjectById)
  .put(requireProjectManager, updateProjectValidator, validate, updateProject)
  .delete(requireProjectOwner, deleteProject);

router.patch('/:id/status', requireProjectManager, updateProjectStatus);
router.patch('/:id/archive', requireProjectOwner, archiveProject);

module.exports = router;
