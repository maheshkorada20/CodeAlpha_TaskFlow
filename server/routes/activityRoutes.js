const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectActivity,
  getTaskActivity,
} = require('../controllers/activityController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectPermissionMiddleware');

router.use(protect);

router.get('/project/:projectId', requireProjectMember, getProjectActivity);
router.get('/task/:taskId', requireProjectMember, getTaskActivity);

module.exports = router;
