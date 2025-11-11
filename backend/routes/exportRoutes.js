const express = require('express');
const router = express.Router();
const {
  exportTournamentCSV,
  exportTournamentPDF,
  exportCategoryRegistrations,
  exportCategoryMatches
} = require('../controllers/exportController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All export routes require authentication and organiser role
router.use(auth);
router.use(roleCheck('organiser'));

// Tournament exports
router.get('/tournament/:tournamentId/csv', exportTournamentCSV);
router.get('/tournament/:tournamentId/pdf', exportTournamentPDF);

// Category exports
router.get('/category/:categoryId/registrations', exportCategoryRegistrations);
router.get('/category/:categoryId/matches', exportCategoryMatches);

module.exports = router;
