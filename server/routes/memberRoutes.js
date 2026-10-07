const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getMembers,
  updateMemberRole,
  removeMember,
} = require('../controllers/memberController');
const { protect } = require('../middleware/authMiddleware');
const {
  requireProjectMember,
  requireProjectOwner,
} = require('../middleware/projectPermissionMiddleware');

router.use(protect);

router.get('/', requireProjectMember, getMembers);
router.put('/:userId', requireProjectOwner, updateMemberRole);
router.delete('/:userId', requireProjectMember, removeMember);

module.exports = router;
