const express = require('express');
const router = express.Router();
const {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament
} = require('../controllers/tournamentController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// Public routes
router.get('/', getAllTournaments);
router.get('/:id', getTournamentById);

// Protected routes - organiser only
router.post('/', auth, roleCheck('organiser'), createTournament);
router.put('/:id', auth, roleCheck('organiser'), updateTournament);

module.exports = router;
