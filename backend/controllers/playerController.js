const { processPlayerCSV, generateCSVTemplate } = require('../services/csvService');

/**
 * Upload and process CSV file with player data
 * POST /api/players/upload-csv
 */
const uploadCSV = async (req, res) => {
  try {
    const { csvContent } = req.body;

    if (!csvContent) {
      return res.status(400).json({
        success: false,
        message: 'CSV content is required'
      });
    }

    // Process the CSV file
    const summary = await processPlayerCSV(csvContent);

    res.status(200).json({
      success: true,
      message: 'CSV processing completed',
      data: summary
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to process CSV file',
      error: error.message
    });
  }
};

/**
 * Download CSV template
 * GET /api/players/csv-template
 */
const downloadTemplate = async (req, res) => {
  try {
    const template = generateCSVTemplate();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=player-import-template.csv');
    res.status(200).send(template);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to generate CSV template',
      error: error.message
    });
  }
};

module.exports = {
  uploadCSV,
  downloadTemplate
};
