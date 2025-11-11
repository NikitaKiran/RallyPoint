const express = require('express');
const router = express.Router();
const {
  sendEmailNotification,
  sendMatchReminder,
  sendBatchMatchReminders
} = require('../controllers/notificationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

/**
 * @route   POST /api/notifications/email
 * @desc    Send custom email notification
 * @access  Private (Organiser only)
 */
router.post('/email', auth, roleCheck('organiser'), sendEmailNotification);

/**
 * @route   POST /api/notifications/match-reminder
 * @desc    Send match reminder email for a single match
 * @access  Private (Organiser only)
 */
router.post('/match-reminder', auth, roleCheck('organiser'), sendMatchReminder);

/**
 * @route   POST /api/notifications/batch-match-reminder
 * @desc    Send match reminder emails for multiple matches
 * @access  Private (Organiser only)
 */
router.post('/batch-match-reminder', auth, roleCheck('organiser'), sendBatchMatchReminders);

module.exports = router;
