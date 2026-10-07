const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getAdminUsers,
  toggleUserStatus,
  updateUserRole,
  deleteUser,
  getAdminProjects,
  getAdminTasks,
  getAdminAnalytics,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/roleMiddleware');

router.use(protect, isAdmin);

router.get('/dashboard', getAdminDashboard);
router.get('/users', getAdminUsers);
router.patch('/users/:id/status', toggleUserStatus);
router.patch('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/projects', getAdminProjects);
router.get('/tasks', getAdminTasks);
router.get('/analytics', getAdminAnalytics);

module.exports = router;
