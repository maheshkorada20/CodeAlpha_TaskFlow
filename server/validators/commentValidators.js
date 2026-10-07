const { body } = require('express-validator');

const createCommentValidator = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment cannot be empty')
    .isLength({ max: 2000 })
    .withMessage('Comment cannot exceed 2000 characters'),
];

module.exports = {
  createCommentValidator,
};
