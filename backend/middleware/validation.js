const { body, param, query, validationResult } = require('express-validator');
const { ValidationError } = require('../utils/errors');

/**
 * Middleware to check validation results and throw error if validation fails
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));
    throw new ValidationError('Validation failed', formattedErrors);
  }
  next();
};

/**
 * Common validation rules
 */
const validationRules = {
  // User authentication validations
  register: [
    body('name')
      .trim()
      .notEmpty().withMessage('Name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role')
      .notEmpty().withMessage('Role is required')
      .isIn(['organiser', 'player']).withMessage('Role must be either organiser or player')
  ],

  login: [
    body('email')
      .trim()
      .notEmpty().withMessage('Email is required')
      .isEmail().withMessage('Invalid email format')
      .normalizeEmail(),
    body('password')
      .notEmpty().withMessage('Password is required')
  ],

  // Tournament validations
  createTournament: [
    body('name')
      .trim()
      .notEmpty().withMessage('Tournament name is required')
      .isLength({ min: 3, max: 200 }).withMessage('Tournament name must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('startDate')
      .notEmpty().withMessage('Start date is required')
      .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
      .notEmpty().withMessage('End date is required')
      .isISO8601().withMessage('Invalid end date format')
      .custom((endDate, { req }) => {
        if (new Date(endDate) < new Date(req.body.startDate)) {
          throw new Error('End date must be after start date');
        }
        return true;
      }),
    body('numberOfCourts')
      .notEmpty().withMessage('Number of courts is required')
      .isInt({ min: 1, max: 50 }).withMessage('Number of courts must be between 1 and 50')
  ],

  updateTournament: [
    param('id')
      .isMongoId().withMessage('Invalid tournament ID'),
    body('name')
      .optional()
      .trim()
      .isLength({ min: 3, max: 200 }).withMessage('Tournament name must be between 3 and 200 characters'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 }).withMessage('Description must not exceed 1000 characters'),
    body('startDate')
      .optional()
      .isISO8601().withMessage('Invalid start date format'),
    body('endDate')
      .optional()
      .isISO8601().withMessage('Invalid end date format'),
    body('numberOfCourts')
      .optional()
      .isInt({ min: 1, max: 50 }).withMessage('Number of courts must be between 1 and 50'),
    body('status')
      .optional()
      .isIn(['upcoming', 'ongoing', 'completed']).withMessage('Invalid tournament status')
  ],

  // Category validations
  createCategory: [
    param('tournamentId')
      .isMongoId().withMessage('Invalid tournament ID'),
    body('name')
      .trim()
      .notEmpty().withMessage('Category name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Category name must be between 2 and 100 characters'),
    body('isTeamEvent')
      .notEmpty().withMessage('Team event flag is required')
      .isBoolean().withMessage('Team event flag must be boolean'),
    body('registrationLimit')
      .optional()
      .isInt({ min: 2 }).withMessage('Registration limit must be at least 2'),
    body('stages')
      .optional()
      .isArray().withMessage('Stages must be an array')
  ],

  // Registration validations
  createRegistration: [
    body('tournamentCode')
      .trim()
      .notEmpty().withMessage('Tournament code is required')
      .isLength({ min: 6, max: 6 }).withMessage('Tournament code must be 6 characters'),
    body('categoryId')
      .notEmpty().withMessage('Category ID is required')
      .isMongoId().withMessage('Invalid category ID'),
    body('teamName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 }).withMessage('Team name must be between 2 and 100 characters'),
    body('teamMembers')
      .optional()
      .isArray().withMessage('Team members must be an array')
  ],

  // Match validations
  scheduleMatch: [
    body('categoryId')
      .notEmpty().withMessage('Category ID is required')
      .isMongoId().withMessage('Invalid category ID'),
    body('stageName')
      .trim()
      .notEmpty().withMessage('Stage name is required'),
    body('players')
      .notEmpty().withMessage('Players are required')
      .isArray({ min: 2, max: 2 }).withMessage('Match must have exactly 2 players'),
    body('court')
      .notEmpty().withMessage('Court number is required')
      .isInt({ min: 1 }).withMessage('Court number must be positive'),
    body('schedule.date')
      .notEmpty().withMessage('Match date is required')
      .isISO8601().withMessage('Invalid date format'),
    body('schedule.time')
      .notEmpty().withMessage('Match time is required')
      .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Invalid time format (HH:MM)')
  ],

  updateLiveScore: [
    param('id')
      .isMongoId().withMessage('Invalid match ID'),
    body('score')
      .notEmpty().withMessage('Score is required')
      .isArray().withMessage('Score must be an array')
  ],

  updateMatchResult: [
    param('id')
      .isMongoId().withMessage('Invalid match ID'),
    body('score')
      .notEmpty().withMessage('Score is required')
      .isArray().withMessage('Score must be an array'),
    body('winner')
      .notEmpty().withMessage('Winner is required')
      .isMongoId().withMessage('Invalid winner ID')
  ],

  // Request validations
  createRescheduleRequest: [
    body('matchId')
      .notEmpty().withMessage('Match ID is required')
      .isMongoId().withMessage('Invalid match ID'),
    body('note')
      .optional()
      .trim()
      .isLength({ max: 500 }).withMessage('Note must not exceed 500 characters')
  ],

  // Common ID validation
  mongoId: [
    param('id')
      .isMongoId().withMessage('Invalid ID format')
  ],

  tournamentId: [
    param('tournamentId')
      .isMongoId().withMessage('Invalid tournament ID')
  ],

  categoryId: [
    param('categoryId')
      .isMongoId().withMessage('Invalid category ID')
  ],

  playerId: [
    param('playerId')
      .isMongoId().withMessage('Invalid player ID')
  ]
};

module.exports = {
  validate,
  validationRules
};
