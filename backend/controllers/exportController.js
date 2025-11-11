const Tournament = require('../models/Tournament');
const Category = require('../models/Category');
const Registration = require('../models/Registration');
const Match = require('../models/Match');
const { exportTournamentData, exportMatchResults, exportRegistrations } = require('../services/csvService');
const { generateTournamentPDF, generateBracketPDF } = require('../services/pdfService');

/**
 * Export tournament data as CSV
 * GET /api/export/tournament/:tournamentId/csv
 */
const exportTournamentCSV = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Fetch tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify user is the organiser
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to export this tournament' });
    }

    // Fetch categories
    const Category = require('../models/Category');
    const categories = await Category.find({ tournamentId });

    // Fetch registrations with populated player data
    const registrations = await Registration.find({ tournamentId })
      .populate('playerId', 'name email')
      .populate('categoryId', 'name');

    // Fetch matches with populated data
    const matches = await Match.find({ tournamentId })
      .populate('categoryId', 'name')
      .sort({ 'schedule.date': 1 });

    // Generate CSV
    const csvData = await exportTournamentData(tournament, categories, registrations, matches);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${tournament.code}_tournament_data.csv"`);
    
    res.send(csvData);
  } catch (error) {
    console.error('Export CSV error:', error);
    res.status(500).json({ message: 'Failed to export tournament data', error: error.message });
  }
};

/**
 * Export tournament results as PDF
 * GET /api/export/tournament/:tournamentId/pdf
 */
const exportTournamentPDF = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { type = 'results' } = req.query; // 'results' or 'bracket'

    // Fetch tournament
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify user is the organiser
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to export this tournament' });
    }

    // Fetch categories
    const Category = require('../models/Category');
    const categories = await Category.find({ tournamentId });

    // Fetch matches with populated data
    const matches = await Match.find({ tournamentId })
      .populate('categoryId', 'name')
      .sort({ 'schedule.date': 1 });

    // Generate PDF based on type
    let doc;
    let filename;

    if (type === 'bracket' && req.query.categoryId) {
      // Generate bracket PDF for specific category
      const category = categories.find(c => c._id.toString() === req.query.categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      
      const categoryMatches = matches.filter(m => 
        m.categoryId._id.toString() === req.query.categoryId
      );
      
      doc = generateBracketPDF(tournament, category, categoryMatches);
      filename = `${tournament.code}_${category.name}_bracket.pdf`;
    } else {
      // Generate full results PDF
      doc = generateTournamentPDF(tournament, categories, matches);
      filename = `${tournament.code}_tournament_results.pdf`;
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe the PDF to response
    doc.pipe(res);
    doc.end();
  } catch (error) {
    console.error('Export PDF error:', error);
    res.status(500).json({ message: 'Failed to export tournament PDF', error: error.message });
  }
};

/**
 * Export category registrations as CSV
 * GET /api/export/category/:categoryId/registrations
 */
const exportCategoryRegistrations = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Fetch category
    const Category = require('../models/Category');
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Fetch tournament to verify organiser
    const tournament = await Tournament.findById(category.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify user is the organiser
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to export this data' });
    }

    // Fetch registrations with populated player data
    const registrations = await Registration.find({ categoryId })
      .populate('playerId', 'name email')
      .populate('categoryId', 'name');

    // Generate CSV
    const csvData = exportRegistrations(registrations);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${category.name}_registrations.csv"`);
    
    res.send(csvData);
  } catch (error) {
    console.error('Export registrations error:', error);
    res.status(500).json({ message: 'Failed to export registrations', error: error.message });
  }
};

/**
 * Export category matches as CSV
 * GET /api/export/category/:categoryId/matches
 */
const exportCategoryMatches = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Fetch category
    const Category = require('../models/Category');
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    // Fetch tournament to verify organiser
    const tournament = await Tournament.findById(category.tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    // Verify user is the organiser
    if (tournament.organiserId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to export this data' });
    }

    // Fetch matches
    const matches = await Match.find({ categoryId })
      .populate('categoryId', 'name')
      .sort({ 'schedule.date': 1 });

    // Generate CSV
    const csvData = exportMatchResults(matches, category.name);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${category.name}_matches.csv"`);
    
    res.send(csvData);
  } catch (error) {
    console.error('Export matches error:', error);
    res.status(500).json({ message: 'Failed to export matches', error: error.message });
  }
};

module.exports = {
  exportTournamentCSV,
  exportTournamentPDF,
  exportCategoryRegistrations,
  exportCategoryMatches
};
