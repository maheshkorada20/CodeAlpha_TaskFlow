const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectAnalytics,
  getUserDashboardAnalytics,
} = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectPermissionMiddleware');

router.use(protect);

router.get('/dashboard', getUserDashboardAnalytics);
router.get('/project/:projectId', requireProjectMember, getProjectAnalytics);

module.exports = router;
