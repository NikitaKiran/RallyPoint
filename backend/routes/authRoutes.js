const express = require('express');
const router = express.Router();
const { register, login, getCurrentUser } = require('../controllers/authController');
const auth = require('../middleware/auth');
const { validationRules, validate } = require('../middleware/validation');

// Public routes
router.post('/register', validationRules.register, validate, register);
router.post('/login', validationRules.login, validate, login);

// Protected routes
router.get('/me', auth, getCurrentUser);

module.exports = router;
