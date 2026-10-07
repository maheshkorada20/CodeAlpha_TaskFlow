const express = require('express');
const router = express.Router({ mergeParams: true });
const {
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
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');
const {
  requireProjectMember,
  requireProjectManager,
} = require('../middleware/projectPermissionMiddleware');
const validate = require('../middleware/validationMiddleware');
const {
  createTaskValidator,
  updateTaskValidator,
} = require('../validators/taskValidators');

router.use(protect);

// My tasks endpoint
router.get('/my-tasks', getMyTasks);

// Project tasks endpoints
router.route('/project/:projectId')
  .get(requireProjectMember, getTasks)
  .post(requireProjectManager, createTaskValidator, validate, createTask);

// Single task endpoints
router.route('/:id')
  .get(requireProjectMember, getTaskById)
  .put(requireProjectMember, updateTaskValidator, validate, updateTask)
  .delete(requireProjectManager, deleteTask);

router.patch('/:id/status', requireProjectMember, updateTaskStatus);
router.patch('/:id/assign', requireProjectManager, assignTask);
router.patch('/:id/checklist', requireProjectMember, updateChecklist);
router.post('/:id/submit-review', requireProjectMember, submitTaskForReview);
router.patch('/:id/approve', requireProjectManager, approveTask);
router.patch('/:id/reject', requireProjectManager, rejectTask);

module.exports = router;
