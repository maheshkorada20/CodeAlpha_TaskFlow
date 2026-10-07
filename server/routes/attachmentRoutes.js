const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  uploadTaskAttachment,
  uploadProjectAttachment,
  getProjectAttachments,
  deleteAttachment,
} = require('../controllers/attachmentController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectPermissionMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect);

router.post(
  '/task/:taskId',
  requireProjectMember,
  upload.single('file'),
  uploadTaskAttachment
);

router.route('/project/:projectId')
  .get(requireProjectMember, getProjectAttachments)
  .post(requireProjectMember, upload.single('file'), uploadProjectAttachment);

router.delete('/:id', deleteAttachment);

module.exports = router;
