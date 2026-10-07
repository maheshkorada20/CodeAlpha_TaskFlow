const { body } = require('express-validator');

const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ min: 2, max: 150 })
    .withMessage('Task title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description cannot exceed 3000 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
  body('assignedTo')
    .optional({ checkFalsy: true })
    .isMongoId()
    .withMessage('Assigned user must be a valid ID'),
  body('startDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('dueDate')
    .optional({ checkFalsy: true })
    .isISO8601()
    .withMessage('Due date must be a valid date'),
];

const updateTaskValidator = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 })
    .withMessage('Task title must be between 2 and 150 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 3000 })
    .withMessage('Description cannot exceed 3000 characters'),
  body('status')
    .optional()
    .isIn(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'])
    .withMessage('Invalid status'),
  body('priority')
    .optional()
    .isIn(['LOW', 'MEDIUM', 'HIGH', 'URGENT'])
    .withMessage('Invalid priority'),
];

const checklistValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Checklist item title is required'),
];

module.exports = {
  createTaskValidator,
  updateTaskValidator,
  checklistValidator,
};
