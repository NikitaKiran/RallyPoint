const { createBackup, generateBackupFilename, restoreBackup } = require('../services/backupService');

/**
 * Export database backup
 * GET /api/backup/export
 * @access Private (Organiser only)
 */
const exportBackup = async (req, res) => {
  try {
    // Create backup
    const backup = await createBackup();
    const filename = generateBackupFilename();

    // Set headers for file download
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Send backup data
    res.json(backup);
  } catch (error) {
    console.error('Backup export error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to create backup',
    });
  }
};

/**
 * Restore database from backup
 * POST /api/backup/restore
 * @access Private (Organiser only)
 */
const restoreFromBackup = async (req, res) => {
  try {
    const { backupData, clearExisting } = req.body;

    if (!backupData) {
      return res.status(400).json({
        success: false,
        error: 'Backup data is required',
      });
    }

    // Restore backup
    const result = await restoreBackup(backupData, clearExisting || false);

    res.json({
      success: true,
      message: 'Backup restored successfully',
      result,
    });
  } catch (error) {
    console.error('Backup restore error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to restore backup',
    });
  }
};

module.exports = {
  exportBackup,
  restoreFromBackup,
};
