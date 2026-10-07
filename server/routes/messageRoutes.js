const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMessages,
  sendMessage,
  deleteMessage,
} = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectPermissionMiddleware');

router.use(protect);

router.route('/project/:projectId')
  .get(requireProjectMember, getMessages)
  .post(requireProjectMember, sendMessage);

router.delete('/:id', deleteMessage);

module.exports = router;
