const { body } = require('express-validator');

const createInvitationValidator = [
  body('expiresInDays')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiration days must be between 1 and 365'),
  body('maxUses')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('Maximum uses must be between 1 and 1000'),
  body('role')
    .optional()
    .isIn(['member', 'manager'])
    .withMessage('Role must be either member or manager'),
];

module.exports = {
  createInvitationValidator,
};
