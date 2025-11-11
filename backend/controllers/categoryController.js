const Category = require('../models/Category');
const Tournament = require('../models/Tournament');

/**
 * Create a new category for a tournament
 * POST /api/categories/tournament/:tournamentId
 */
const createCategory = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { name, isTeamEvent, eligibilityCriteria, registrationLimit, cashPrize, stages } = req.body;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is the organiser of this tournament
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only add categories to your own tournaments'
      });
    }

    // Create category
    const category = new Category({
      tournamentId,
      name,
      isTeamEvent: isTeamEvent || false,
      eligibilityCriteria: eligibilityCriteria || '',
      registrationLimit: registrationLimit !== undefined && registrationLimit !== null && registrationLimit !== '' ? registrationLimit : null,
      cashPrize: cashPrize || 0,
      stages: stages || []
    });

    await category.save();

    res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: {
        category
      }
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error creating category',
      error: error.message
    });
  }
};

module.exports = {
  createCategory
};
