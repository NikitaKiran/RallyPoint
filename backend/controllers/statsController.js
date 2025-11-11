const statsService = require('../services/statsService');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Category = require('../models/Category');

/**
 * Get player statistics
 * GET /api/stats/player/:playerId
 */
const getPlayerStats = async (req, res) => {
  try {
    const { playerId } = req.params;
    const { tournamentId, categoryId } = req.query;
    
    // Verify player exists
    const player = await User.findById(playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Build filters
    const filters = {};
    if (tournamentId) {
      filters.tournamentId = tournamentId;
    }
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    // Calculate statistics
    const stats = await statsService.calculatePlayerStats(playerId, filters);
    
    // Add player information
    const response = {
      player: {
        id: player._id,
        name: player.name,
        email: player.email,
        role: player.role
      },
      statistics: stats,
      filters: {
        tournamentId: tournamentId || null,
        categoryId: categoryId || null
      }
    };
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching player stats:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching player statistics',
      error: error.message
    });
  }
};

/**
 * Get tournament leaderboard
 * GET /api/stats/tournament/:tournamentId/leaderboard
 */
const getTournamentLeaderboard = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    const { categoryId } = req.query;
    
    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // If categoryId provided, verify it belongs to this tournament
    if (categoryId) {
      const category = await Category.findById(categoryId);
      
      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found'
        });
      }
      
      if (category.tournamentId.toString() !== tournamentId) {
        return res.status(400).json({
          success: false,
          message: 'Category does not belong to this tournament'
        });
      }
    }
    
    // Generate leaderboard
    const leaderboard = await statsService.generateLeaderboard(tournamentId, categoryId);
    
    // Build response
    const response = {
      tournament: {
        id: tournament._id,
        name: tournament.name,
        code: tournament.code,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        status: tournament.status
      },
      leaderboard,
      totalPlayers: leaderboard.length,
      filters: {
        categoryId: categoryId || null
      }
    };
    
    // If category filter applied, include category info
    if (categoryId) {
      const category = await Category.findById(categoryId);
      response.category = {
        id: category._id,
        name: category.name,
        isTeamEvent: category.isTeamEvent
      };
    }
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching tournament leaderboard:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching tournament leaderboard',
      error: error.message
    });
  }
};

/**
 * Get match history for a player
 * GET /api/stats/player/:playerId/history
 */
const getPlayerMatchHistory = async (req, res) => {
  try {
    const { playerId } = req.params;
    const {
      page = 1,
      limit = 10,
      tournamentId,
      categoryId,
      status
    } = req.query;
    
    // Verify player exists
    const player = await User.findById(playerId);
    
    if (!player) {
      return res.status(404).json({
        success: false,
        message: 'Player not found'
      });
    }
    
    // Build options
    const options = {
      page: parseInt(page),
      limit: parseInt(limit)
    };
    
    if (tournamentId) {
      options.tournamentId = tournamentId;
    }
    if (categoryId) {
      options.categoryId = categoryId;
    }
    if (status) {
      options.status = Array.isArray(status) ? status : [status];
    }
    
    // Get match history
    const result = await statsService.getMatchHistory(playerId, options);
    
    res.status(200).json({
      success: true,
      data: {
        player: {
          id: player._id,
          name: player.name,
          email: player.email
        },
        ...result
      }
    });
  } catch (error) {
    console.error('Error fetching match history:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching match history',
      error: error.message
    });
  }
};

/**
 * Get current user's statistics
 * GET /api/stats/my-stats
 */
const getMyStats = async (req, res) => {
  try {
    const playerId = req.user._id;
    const { tournamentId, categoryId } = req.query;
    
    // Build filters
    const filters = {};
    if (tournamentId) {
      filters.tournamentId = tournamentId;
    }
    if (categoryId) {
      filters.categoryId = categoryId;
    }
    
    // Calculate statistics
    const stats = await statsService.calculatePlayerStats(playerId, filters);
    
    res.status(200).json({
      success: true,
      data: {
        statistics: stats,
        filters: {
          tournamentId: tournamentId || null,
          categoryId: categoryId || null
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user stats:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching your statistics',
      error: error.message
    });
  }
};

module.exports = {
  getPlayerStats,
  getTournamentLeaderboard,
  getPlayerMatchHistory,
  getMyStats
};
