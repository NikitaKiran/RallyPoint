const Request = require('../models/Request');
const Match = require('../models/Match');
const Tournament = require('../models/Tournament');
const emailService = require('../services/emailService');

/**
 * Create a reschedule request
 * POST /api/requests/reschedule
 */
const createRescheduleRequest = async (req, res) => {
  try {
    const { matchId, note } = req.body;
    const playerId = req.user._id;
    
    // Validate required fields
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }
    
    // Verify match exists
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is a participant in the match
    const isParticipant = match.players.some(
      p => p.playerId.toString() === playerId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match'
      });
    }
    
    // Check if match is already completed or walkover
    if (match.status === 'completed' || match.status === 'walkover') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request reschedule for completed or walkover matches'
      });
    }
    
    // Check if there's already a pending request for this match by this player
    const existingRequest = await Request.findOne({
      matchId,
      playerId,
      type: 'reschedule',
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending reschedule request for this match'
      });
    }
    
    // Create reschedule request
    const request = new Request({
      matchId,
      playerId,
      type: 'reschedule',
      status: 'pending',
      note: note || null
    });
    
    await request.save();
    
    // Populate request details for response
    await request.populate([
      { path: 'matchId', populate: [
        { path: 'tournamentId', select: 'name code' },
        { path: 'categoryId', select: 'name' }
      ]},
      { path: 'playerId', select: 'name email' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Reschedule request created successfully',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error creating reschedule request:', error);
    
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
      message: 'Server error creating reschedule request',
      error: error.message
    });
  }
};

/**
 * Create a walkover request
 * POST /api/requests/walkover
 */
const createWalkoverRequest = async (req, res) => {
  try {
    const { matchId, note } = req.body;
    const playerId = req.user._id;
    
    // Validate required fields
    if (!matchId) {
      return res.status(400).json({
        success: false,
        message: 'Match ID is required'
      });
    }
    
    // Verify match exists
    const match = await Match.findById(matchId);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is a participant in the match
    const isParticipant = match.players.some(
      p => p.playerId.toString() === playerId.toString()
    );
    
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You are not a participant in this match'
      });
    }
    
    // Check if match is already completed or walkover
    if (match.status === 'completed' || match.status === 'walkover') {
      return res.status(400).json({
        success: false,
        message: 'Cannot request walkover for completed or walkover matches'
      });
    }
    
    // Check if there's already a pending walkover request for this match by this player
    const existingRequest = await Request.findOne({
      matchId,
      playerId,
      type: 'walkover',
      status: 'pending'
    });
    
    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending walkover request for this match'
      });
    }
    
    // Create walkover request
    const request = new Request({
      matchId,
      playerId,
      type: 'walkover',
      status: 'pending',
      note: note || null
    });
    
    await request.save();
    
    // Populate request details for response
    await request.populate([
      { path: 'matchId', populate: [
        { path: 'tournamentId', select: 'name code' },
        { path: 'categoryId', select: 'name' }
      ]},
      { path: 'playerId', select: 'name email' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'Walkover request created successfully',
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error creating walkover request:', error);
    
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
      message: 'Server error creating walkover request',
      error: error.message
    });
  }
};

/**
 * Get all requests for a tournament (organiser only)
 * GET /api/requests/tournament/:tournamentId
 */
const getTournamentRequests = async (req, res) => {
  try {
    const { tournamentId } = req.params;
    
    // Verify tournament exists
    const tournament = await Tournament.findById(tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    // Verify user is the tournament organiser
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can view requests'
      });
    }
    
    // Get all requests for this tournament
    const allRequests = await Request.find()
      .populate({
        path: 'matchId',
        populate: [
          { path: 'tournamentId', select: 'name code' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('playerId', 'name email')
      .sort({ createdAt: -1 });
    
    // Filter requests that belong to this tournament
    const tournamentRequests = allRequests.filter(
      req => req.matchId && req.matchId.tournamentId && 
             req.matchId.tournamentId._id.toString() === tournamentId.toString()
    );
    
    res.status(200).json({
      success: true,
      data: {
        requests: tournamentRequests,
        count: tournamentRequests.length
      }
    });
  } catch (error) {
    console.error('Error fetching tournament requests:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching tournament requests',
      error: error.message
    });
  }
};

/**
 * Accept a request
 * PUT /api/requests/:id/accept
 */
const acceptRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find request
    const request = await Request.findById(id)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'tournamentId', select: 'name code organiserId' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('playerId', 'name email');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Verify match exists
    if (!request.matchId) {
      return res.status(404).json({
        success: false,
        message: 'Associated match not found'
      });
    }
    
    // Verify user is the tournament organiser
    const tournament = request.matchId.tournamentId;
    
    if (!tournament || tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can accept requests'
      });
    }
    
    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot accept request with status: ${request.status}`
      });
    }
    
    // Accept the request
    request.accept();
    await request.save();
    
    // If it's a walkover request, update the match
    if (request.type === 'walkover') {
      const match = await Match.findById(request.matchId._id);
      
      if (match) {
        // Determine the winner (the opponent of the player who requested walkover)
        const opponent = match.players.find(
          p => p.playerId.toString() !== request.playerId._id.toString()
        );
        
        if (opponent) {
          match.setWinner(opponent.playerId);
          match.updateStatus('walkover');
          
          // Advance winner in knockout bracket if applicable
          if (match.nextMatchId) {
            const bracketService = require('../services/bracketService');
            await bracketService.advanceWinner(match);
          }
          
          await match.save();
        }
      }
    }
    
    // Send email notification to player
    try {
      await emailService.sendRequestAcceptedEmail(request);
    } catch (emailError) {
      console.error('Failed to send acceptance email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: `${request.type === 'reschedule' ? 'Reschedule' : 'Walkover'} request accepted successfully`,
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error accepting request',
      error: error.message
    });
  }
};

/**
 * Reject a request
 * PUT /api/requests/:id/reject
 */
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find request
    const request = await Request.findById(id)
      .populate({
        path: 'matchId',
        populate: [
          { path: 'tournamentId', select: 'name code organiserId' },
          { path: 'categoryId', select: 'name' }
        ]
      })
      .populate('playerId', 'name email');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }
    
    // Verify match exists
    if (!request.matchId) {
      return res.status(404).json({
        success: false,
        message: 'Associated match not found'
      });
    }
    
    // Verify user is the tournament organiser
    const tournament = request.matchId.tournamentId;
    
    if (!tournament || tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can reject requests'
      });
    }
    
    // Check if request is pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Cannot reject request with status: ${request.status}`
      });
    }
    
    // Reject the request
    request.reject();
    await request.save();
    
    // Send email notification to player
    try {
      await emailService.sendRequestRejectedEmail(request);
    } catch (emailError) {
      console.error('Failed to send rejection email:', emailError);
      // Don't fail the request if email fails
    }
    
    res.status(200).json({
      success: true,
      message: `${request.type === 'reschedule' ? 'Reschedule' : 'Walkover'} request rejected successfully`,
      data: {
        request
      }
    });
  } catch (error) {
    console.error('Error rejecting request:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error rejecting request',
      error: error.message
    });
  }
};

module.exports = {
  createRescheduleRequest,
  createWalkoverRequest,
  getTournamentRequests,
  acceptRequest,
  rejectRequest
};
