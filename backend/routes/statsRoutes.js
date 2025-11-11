const express = require('express');
const router = express.Router();
const {
  getPlayerStats,
  getTournamentLeaderboard,
  getPlayerMatchHistory,
  getMyStats
} = require('../controllers/statsController');
const auth = require('../middleware/auth');

// Public routes - anyone can view statistics and leaderboards
router.get('/player/:playerId', getPlayerStats);
router.get('/player/:playerId/history', getPlayerMatchHistory);
router.get('/tournament/:tournamentId/leaderboard', getTournamentLeaderboard);

// Protected routes - authenticated users can view their own stats
router.get('/my-stats', auth, getMyStats);

module.exports = router;
