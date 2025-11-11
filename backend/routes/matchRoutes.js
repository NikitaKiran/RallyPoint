const express = require('express');
const router = express.Router();
const {
  scheduleMatches,
  getTournamentMatches,
  getCategoryMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  updateLiveScore,
  enterResult,
  getMyMatches,
  advanceToNextStage
} = require('../controllers/matchController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/tournament/:tournamentId', getTournamentMatches);
router.get('/category/:categoryId', getCategoryMatches);

// Protected routes - player
router.get('/my-matches', auth, getMyMatches);

// Protected routes - organiser only
router.post('/schedule', auth, roleCheck('organiser'), scheduleMatches);
router.post('/advance-stage', auth, roleCheck('organiser'), advanceToNextStage);
router.post('/', auth, roleCheck('organiser'), createMatch);
router.put('/:id', auth, roleCheck('organiser'), updateMatch);
router.put('/:id/live-score', auth, roleCheck('organiser'), updateLiveScore);
router.put('/:id/result', auth, roleCheck('organiser'), enterResult);
router.delete('/:id', auth, roleCheck('organiser'), deleteMatch);

module.exports = router;
