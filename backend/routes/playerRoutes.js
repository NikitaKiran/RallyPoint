const express = require('express');
const router = express.Router();
const { uploadCSV, downloadTemplate } = require('../controllers/playerController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All player routes require authentication and organiser role
router.use(auth);
router.use(roleCheck('organiser'));

// POST /api/players/upload-csv - Upload and process CSV file
router.post('/upload-csv', uploadCSV);

// GET /api/players/csv-template - Download CSV template
router.get('/csv-template', downloadTemplate);

module.exports = router;
