const Registration = require('../models/Registration');
const Category = require('../models/Category');
const Tournament = require('../models/Tournament');
const User = require('../models/User');

/**
 * Create a new registration
 * POST /api/registrations
 */
const createRegistration = async (req, res) => {
  try {
    const { categoryId, teamName, teamMembers } = req.body;
    const playerId = req.user._id;

    // Validate required fields
    if (!categoryId) {
      return res.status(400).json({
        success: false,
        message: 'Category ID is required'
      });
    }

    // Check if category exists
    const category = await Category.findById(categoryId).populate('tournamentId');
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Check registration limit
    const limitCheck = await Registration.checkRegistrationLimit(categoryId);
    if (!limitCheck.allowed) {
      return res.status(400).json({
        success: false,
        message: `Registration limit reached. Current: ${limitCheck.current}, Limit: ${limitCheck.limit}`
      });
    }

    // Check if player is already registered for this category
    const existingRegistration = await Registration.findOne({
      categoryId,
      playerId
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this category'
      });
    }

    // Validate team event requirements
    if (category.isTeamEvent) {
      if (!teamName || !teamMembers || teamMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Team name and team members are required for team events'
        });
      }
    }

    // Clean up team members - filter out invalid entries and ensure proper format
    let cleanedTeamMembers = [];
    if (category.isTeamEvent && teamMembers) {
      cleanedTeamMembers = teamMembers
        .filter(member => member && member.name && member.name.trim()) // Filter out empty members
        .map(member => ({
          playerId: member.playerId && member.playerId.trim() ? member.playerId : null,
          name: member.name.trim()
        }));
      
      // Validate we still have team members after cleaning
      if (cleanedTeamMembers.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one valid team member is required for team events'
        });
      }
    }

    // Create registration
    const registration = new Registration({
      categoryId,
      playerId,
      tournamentId: category.tournamentId._id,
      isTeam: category.isTeamEvent,
      teamName: category.isTeamEvent ? teamName : null,
      teamMembers: category.isTeamEvent ? cleanedTeamMembers : [],
      status: 'approved'
    });

    await registration.save();

    // Populate the registration with details
    await registration.populate([
      { path: 'playerId', select: 'name email' },
      { path: 'categoryId', select: 'name isTeamEvent' },
      { path: 'tournamentId', select: 'name code' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Registration created successfully',
      data: {
        registration
      }
    });
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'You are already registered for this category'
      });
    }

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
      message: 'Server error creating registration',
      error: error.message
    });
  }
};

/**
 * Get player's tournament registrations
 * GET /api/registrations/my-tournaments
 */
const getMyTournaments = async (req, res) => {
  try {
    const playerId = req.user._id;

    const registrations = await Registration.find({ playerId })
      .populate('tournamentId', 'name code startDate endDate status')
      .populate('categoryId', 'name isTeamEvent cashPrize')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: {
        registrations,
        count: registrations.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching registrations',
      error: error.message
    });
  }
};

/**
 * Get registrations for a category
 * GET /api/categories/:id/registrations
 */
const getCategoryRegistrations = async (req, res) => {
  try {
    const { id: categoryId } = req.params;

    // Check if category exists
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const registrations = await Registration.find({ categoryId })
      .populate('playerId', 'name email')
      .sort({ createdAt: 1 });

    // Get registration count
    const count = await Registration.getRegistrationCount(categoryId);

    res.status(200).json({
      success: true,
      data: {
        registrations,
        count,
        limit: category.registrationLimit
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching category registrations',
      error: error.message
    });
  }
};

/**
 * Delete a registration (organiser only)
 * DELETE /api/registrations/:id
 */
const deleteRegistration = async (req, res) => {
  try {
    const { id } = req.params;

    const registration = await Registration.findById(id)
      .populate('categoryId')
      .populate('tournamentId');

    if (!registration) {
      return res.status(404).json({
        success: false,
        message: 'Registration not found'
      });
    }

    // Check if user is the organiser of the tournament
    if (registration.tournamentId.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete registrations from your own tournaments'
      });
    }

    await Registration.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Registration deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting registration',
      error: error.message
    });
  }
};

/**
 * Get all registrations for a tournament (organiser only)
 * GET /api/registrations/tournament/:tournamentId
 */
const getTournamentRegistrations = async (req, res) => {
  try {
    const { tournamentId } = req.params;

    // Check if tournament exists
    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }

    // Check if user is the organiser
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view registrations for your own tournaments'
      });
    }

    // Get all registrations for this tournament
    const registrations = await Registration.find({ tournamentId })
      .populate('playerId', 'name email')
      .populate('categoryId', 'name isTeamEvent')
      .sort({ createdAt: -1 });

    // Group registrations by category
    const registrationsByCategory = {};
    registrations.forEach(reg => {
      const categoryId = reg.categoryId._id.toString();
      const categoryName = reg.categoryId.name;
      
      if (!registrationsByCategory[categoryId]) {
        registrationsByCategory[categoryId] = {
          categoryId,
          categoryName,
          isTeamEvent: reg.categoryId.isTeamEvent,
          registrations: [],
          count: 0
        };
      }
      
      registrationsByCategory[categoryId].registrations.push(reg);
      registrationsByCategory[categoryId].count++;
    });

    res.status(200).json({
      success: true,
      data: {
        tournament: {
          _id: tournament._id,
          name: tournament.name,
          code: tournament.code
        },
        totalRegistrations: registrations.length,
        byCategory: Object.values(registrationsByCategory),
        allRegistrations: registrations
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching tournament registrations',
      error: error.message
    });
  }
};

module.exports = {
  createRegistration,
  getMyTournaments,
  getCategoryRegistrations,
  getTournamentRegistrations,
  deleteRegistration
};
