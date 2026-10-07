const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getProjectInvitation,
  createInvitation,
  getInvitationByToken,
  joinProject,
  disableInvitation,
  regenerateInvitation,
} = require('../controllers/invitationController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectManager } = require('../middleware/projectPermissionMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createInvitationValidator } = require('../validators/invitationValidators');

// Project invitation management (placed FIRST to avoid :token matching "project")
router.get(
  '/project/:projectId',
  protect,
  requireProjectManager,
  getProjectInvitation
);

router.post(
  '/project/:projectId',
  protect,
  requireProjectManager,
  createInvitationValidator,
  validate,
  createInvitation
);

router.patch('/:id/disable', protect, disableInvitation);
router.post('/:id/regenerate', protect, regenerateInvitation);

// Authenticated join route
router.post('/:token/join', protect, joinProject);

// Public preview route (wildcard :token placed at the end)
router.get('/:token', getInvitationByToken);

module.exports = router;
