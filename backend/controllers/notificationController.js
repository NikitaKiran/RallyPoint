const emailService = require('../services/emailService');
const Match = require('../models/Match');
const User = require('../models/User');
const Tournament = require('../models/Tournament');

/**
 * Send custom email notification
 * POST /api/notifications/email
 */
const sendEmailNotification = async (req, res) => {
  try {
    const { recipients, subject, message, tournamentId } = req.body;
    
    // Validate required fields
    if (!recipients || !Array.isArray(recipients) || recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Recipients array is required and must not be empty'
      });
    }
    
    if (!subject || !subject.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email subject is required'
      });
    }
    
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Email message is required'
      });
    }
    
    // If tournamentId is provided, verify user is the organiser
    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      if (tournament.organiserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the tournament organiser can send notifications'
        });
      }
    }
    
    // Validate email addresses
    const emailRegex = /^\S+@\S+\.\S+$/;
    const invalidEmails = recipients.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email addresses found',
        invalidEmails
      });
    }
    
    // Send emails
    const result = await emailService.sendCustomEmail(recipients, subject, message);
    
    if (result.success) {
      res.status(200).json({
        success: true,
        message: 'Emails sent successfully',
        data: {
          sentCount: recipients.length,
          results: result.results
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
        data: {
          results: result.results
        }
      });
    }
  } catch (error) {
    console.error('Error sending email notification:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error sending email notification',
      error: error.message
    });
  }
};

/**
 * Send match reminder emails
 * POST /api/notifications/match-reminder
 */
const sendMatchReminder = async (req, res) => {
  try {
    const { matchId } = req.body;
    
    // Validate required fields
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }
    
    // Find match with populated fields
    const match = await Match.findById(matchId)
      .populate('tournamentId', 'name code organiserId')
      .populate('categoryId', 'name');
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is the tournament organiser
    if (match.tournamentId.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can send match reminders'
      });
    }
    
    // Get player details
    const playerIds = match.players.map(p => p.playerId);
    const players = await User.find({ _id: { $in: playerIds } });
    
    if (players.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No players found for this match'
      });
    }
    
    // Send reminder emails to all players
    const results = [];
    
    for (const player of players) {
      try {
        const result = await emailService.sendMatchReminderEmail(match, player);
        results.push({
          player: player.name,
          email: player.email,
          ...result
        });
      } catch (error) {
        results.push({
          player: player.name,
          email: player.email,
          success: false,
          error: error.message
        });
      }
    }
    
    const allSuccessful = results.every(r => r.success);
    
    res.status(allSuccessful ? 200 : 500).json({
      success: allSuccessful,
      message: allSuccessful ? 'Match reminders sent successfully' : 'Some reminders failed to send',
      data: {
        results
      }
    });
  } catch (error) {
    console.error('Error sending match reminder:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error sending match reminder',
      error: error.message
    });
  }
};

/**
 * Send match reminders for multiple matches
 * POST /api/notifications/batch-match-reminder
 */
const sendBatchMatchReminders = async (req, res) => {
  try {
    const { matchIds, tournamentId } = req.body;
    
    // Validate required fields
    if (!matchIds || !Array.isArray(matchIds) || matchIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Match IDs array is required and must not be empty'
      });
    }
    
    // If tournamentId is provided, verify user is the organiser
    if (tournamentId) {
      const tournament = await Tournament.findById(tournamentId);
      
      if (!tournament) {
        return res.status(404).json({
          success: false,
          message: 'Tournament not found'
        });
      }
      
      if (tournament.organiserId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Only the tournament organiser can send reminders'
        });
      }
    }
    
    const allResults = [];
    
    for (const matchId of matchIds) {
      try {
        // Find match with populated fields
        const match = await Match.findById(matchId)
          .populate('tournamentId', 'name code organiserId')
          .populate('categoryId', 'name');
        
        if (!match) {
          allResults.push({
            matchId,
            success: false,
            message: 'Match not found'
          });
          continue;
        }
        
        // Verify user is the tournament organiser
        if (match.tournamentId.organiserId.toString() !== req.user._id.toString()) {
          allResults.push({
            matchId,
            success: false,
            message: 'Access denied for this match'
          });
          continue;
        }
        
        // Get player details
        const playerIds = match.players.map(p => p.playerId);
        const players = await User.find({ _id: { $in: playerIds } });
        
        // Send reminder emails to all players
        for (const player of players) {
          const result = await emailService.sendMatchReminderEmail(match, player);
          allResults.push({
            matchId,
            player: player.name,
            email: player.email,
            ...result
          });
        }
      } catch (error) {
        allResults.push({
          matchId,
          success: false,
          error: error.message
        });
      }
    }
    
    const allSuccessful = allResults.every(r => r.success);
    
    res.status(allSuccessful ? 200 : 500).json({
      success: allSuccessful,
      message: allSuccessful ? 'All match reminders sent successfully' : 'Some reminders failed to send',
      data: {
        totalSent: allResults.filter(r => r.success).length,
        totalFailed: allResults.filter(r => !r.success).length,
        results: allResults
      }
    });
  } catch (error) {
    console.error('Error sending batch match reminders:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error sending batch match reminders',
      error: error.message
    });
  }
};

module.exports = {
  sendEmailNotification,
  sendMatchReminder,
  sendBatchMatchReminders
};
