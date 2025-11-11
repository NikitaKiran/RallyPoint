const express = require('express');
const router = express.Router();
const {
  createRescheduleRequest,
  createWalkoverRequest,
  getTournamentRequests,
  acceptRequest,
  rejectRequest
} = require('../controllers/requestController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Protected routes - player
router.post('/reschedule', auth, createRescheduleRequest);
router.post('/walkover', auth, createWalkoverRequest);

// Protected routes - organiser only
router.get('/tournament/:tournamentId', auth, roleCheck('organiser'), getTournamentRequests);
router.put('/:id/accept', auth, roleCheck('organiser'), acceptRequest);
router.put('/:id/reject', auth, roleCheck('organiser'), rejectRequest);

module.exports = router;
