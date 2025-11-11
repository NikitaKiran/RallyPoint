const Tournament = require('../models/Tournament');
const Category = require('../models/Category');

/**
 * Create a new tournament
 * POST /api/tournaments
 */
const createTournament = async (req, res) => {
  try {
    const { name, description, startDate, endDate, numberOfCourts } = req.body;

    // Validate required fields
    if (!name || !startDate || !endDate || !numberOfCourts) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields: name, startDate, endDate, numberOfCourts'
      });
    }

    // Generate unique tournament code
    const code = await Tournament.generateUniqueCode();

    // Create tournament
    const tournament = new Tournament({
      name,
      description,
      code,
      organiserId: req.user._id,
      startDate,
      endDate,
      numberOfCourts,
      status: 'upcoming'
    });

    await tournament.save();

    res.status(201).json({
      success: true,
      message: 'Tournament created successfully',
      data: {
        tournament
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
      message: 'Server error creating tournament',
      error: error.message
    });
  }
};

/**
 * Get all tournaments (public access)
 * GET /api/tournaments
 */
const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await Tournament.find()
      .populate('organiserId', 'name email')
      .sort({ startDate: -1 });

    res.status(200).json({
      success: true,
      data: {
        tournaments,
        count: tournaments.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching tournaments',
      error: error.message
    });
  }
};

/**
 * Get tournament by ID (public access)
 * GET /api/tournaments/:id
 */
const getTournamentById = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id)
      .populate('organiserId', 'name email');

    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Get categories for this tournament
    const categories = await Category.find({ tournamentId: tournament._id });

    res.status(200).json({
      success: true,
      data: {
        tournament,
        categories
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching tournament',
      error: error.message
    });
  }
};

/**
 * Update tournament
 * PUT /api/tournaments/:id
 */
const updateTournament = async (req, res) => {
  try {
    const tournament = await Tournament.findById(req.params.id);

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
        message: 'Access denied. You can only update your own tournaments'
      });
    }

    // Update allowed fields (code should not be updated)
    const { name, description, startDate, endDate, numberOfCourts, status } = req.body;
    
    if (name) tournament.name = name;
    if (description !== undefined) tournament.description = description;
    if (startDate) tournament.startDate = startDate;
    if (endDate) tournament.endDate = endDate;
    if (numberOfCourts) tournament.numberOfCourts = numberOfCourts;
    if (status) tournament.status = status;

    await tournament.save();

    res.status(200).json({
      success: true,
      message: 'Tournament updated successfully',
      data: {
        tournament
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
      message: 'Server error updating tournament',
      error: error.message
    });
  }
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournament
};
