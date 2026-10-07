const express = require('express');
const router = express.Router({ mergeParams: true });
const {
  getComments,
  createComment,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const { protect } = require('../middleware/authMiddleware');
const { requireProjectMember } = require('../middleware/projectPermissionMiddleware');
const validate = require('../middleware/validationMiddleware');
const { createCommentValidator } = require('../validators/commentValidators');

router.use(protect);

router.route('/task/:taskId')
  .get(requireProjectMember, getComments)
  .post(requireProjectMember, createCommentValidator, validate, createComment);

router.route('/:id')
  .put(updateComment)
  .delete(deleteComment);

module.exports = router;
