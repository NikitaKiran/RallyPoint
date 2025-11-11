const express = require('express');
const router = express.Router();
const { exportBackup, restoreFromBackup } = require('../controllers/backupController');
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');

// All backup routes require authentication and organiser role
router.use(auth);
router.use(roleCheck('organiser'));

// GET /api/backup/export - Export database backup
router.get('/export', exportBackup);

// POST /api/backup/restore - Restore database from backup
router.post('/restore', restoreFromBackup);

module.exports = router;
