const express = require('express');
const router = express.Router();
const {
  createRegistration,
  getMyTournaments,
  getCategoryRegistrations,
  deleteRegistration
} = require('../controllers/registrationController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes - player only
router.post('/', auth, roleCheck('player'), createRegistration);
router.get('/my-tournaments', auth, roleCheck('player'), getMyTournaments);

// Protected routes - organiser only
router.delete('/:id', auth, roleCheck('organiser'), deleteRegistration);

module.exports = router;
