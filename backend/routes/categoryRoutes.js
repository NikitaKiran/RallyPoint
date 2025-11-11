const express = require('express');
const router = express.Router();
const { createCategory } = require('../controllers/categoryController');
const { getCategoryRegistrations } = require('../controllers/registrationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes - organiser only
router.post('/tournament/:tournamentId', auth, roleCheck('organiser'), createCategory);

// Protected routes - authenticated users
router.get('/:id/registrations', auth, getCategoryRegistrations);

module.exports = router;
