const Match = require('../models/Match');
const Category = require('../models/Category');
const Tournament = require('../models/Tournament');
const Registration = require('../models/Registration');
const bracketService = require('../services/bracketService');
const schedulingService = require('../services/schedulingService');

/**
 * Assign courts and time slots to matches
 * @param {Array} matches - Array of match objects
 * @param {number} numberOfCourts - Number of available courts
 * @param {Date} startDate - Tournament start date
 * @param {Date} endDate - Tournament end date
 * @returns {Array} Matches with assigned courts and times
 */
function assignCourtsAndTimes(matches, numberOfCourts, startDate, endDate) {
  if (numberOfCourts < 1) {
    throw new Error('Number of courts must be at least 1');
  }
  
  // Calculate available days
  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
  
  // Time slots per day (assuming 8 AM to 8 PM, 1 hour per match)
  const slotsPerDay = 12;
  const totalSlots = daysDiff * slotsPerDay * numberOfCourts;
  
  if (matches.length > totalSlots) {
    throw new Error(`Not enough time slots. Need ${matches.length} slots but only ${totalSlots} available`);
  }
  
  // Assign courts and times
  let currentDay = 0;
  let currentSlot = 0;
  let currentCourt = 1;
  
  const timeSlots = [];
  for (let hour = 8; hour < 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, '0')}:00`);
  }
  
  matches.forEach(match => {
    // Calculate date
    const matchDate = new Date(start);
    matchDate.setDate(matchDate.getDate() + currentDay);
    
    // Assign schedule
    match.schedule = {
      date: matchDate,
      time: timeSlots[currentSlot],
      courtNumber: currentCourt
    };
    
    // Move to next court
    currentCourt++;
    
    // If all courts used, move to next time slot
    if (currentCourt > numberOfCourts) {
      currentCourt = 1;
      currentSlot++;
      
      // If all time slots used, move to next day
      if (currentSlot >= timeSlots.length) {
        currentSlot = 0;
        currentDay++;
      }
    }
  });
  
  return matches;
}

/**
 * Generate automatic schedule for a category stage
 * POST /api/matches/schedule
 */
const scheduleMatches = async (req, res) => {
  try {
    const { categoryId, stageName } = req.body;
    
    // Validate required fields
    if (!categoryId || !stageName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide categoryId and stageName'
      });
    }
    
    // Get category and verify it exists
    const category = await Category.findById(categoryId).populate('tournamentId');
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    // Get tournament
    const tournament = await Tournament.findById(category.tournamentId);
    
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
        message: 'Access denied. Only the tournament organiser can schedule matches'
      });
    }
    
    // Find the stage in the category
    const stage = category.stages.find(s => s.name === stageName);
    
    if (!stage) {
      return res.status(404).json({
        success: false,
        message: 'Stage not found in category'
      });
    }
    
    // Get all registrations for this category
    const registrations = await Registration.find({
      categoryId: category._id,
      status: 'approved'
    }).populate('playerId', 'name email');
    
    if (registrations.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'At least 2 registered players are required to schedule matches'
      });
    }
    
    // Convert registrations to player objects
    const players = registrations.map(reg => ({
      playerId: reg.playerId._id,
      name: reg.isTeam ? reg.teamName : reg.playerId.name,
      isTeam: reg.isTeam,
      teamName: reg.teamName
    }));
    
    let matches = [];
    
    // Generate matches based on stage format
    if (stage.format === 'knockout') {
      // Generate knockout bracket
      matches = await bracketService.generateKnockoutBracket({
        tournamentId: tournament._id,
        categoryId: category._id,
        stageName: stage.name,
        players,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        numberOfCourts: tournament.numberOfCourts
      });
      
      // Assign courts and times
      matches = assignCourtsAndTimes(
        matches,
        tournament.numberOfCourts,
        tournament.startDate,
        tournament.endDate
      );
      
      // Save matches with proper linking
      const savedMatches = await bracketService.saveBracketMatches(matches);
      
      return res.status(201).json({
        success: true,
        message: 'Knockout bracket generated successfully',
        data: {
          matches: savedMatches,
          count: savedMatches.length,
          format: 'knockout'
        }
      });
      
    } else if (stage.format === 'round_robin') {
      // Generate round robin schedule
      matches = schedulingService.generateRoundRobinSchedule({
        tournamentId: tournament._id,
        categoryId: category._id,
        stageName: stage.name,
        players,
        groupCount: stage.groupCount || 1,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        numberOfCourts: tournament.numberOfCourts
      });
      
      // Assign courts and times
      matches = assignCourtsAndTimes(
        matches,
        tournament.numberOfCourts,
        tournament.startDate,
        tournament.endDate
      );
      
      // Save matches
      const savedMatches = await schedulingService.saveRoundRobinMatches(matches);
      
      return res.status(201).json({
        success: true,
        message: 'Round robin schedule generated successfully',
        data: {
          matches: savedMatches,
          count: savedMatches.length,
          format: 'round_robin',
          groups: stage.groupCount || 1
        }
      });
      
    } else {
      return res.status(400).json({
        success: false,
        message: 'Custom format scheduling not yet implemented. Please create matches manually.'
      });
    }
    
  } catch (error) {
    console.error('Error scheduling matches:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error scheduling matches',
      error: error.message
    });
  }
};

/**
 * Get all matches for a tournament
 * GET /api/matches/tournament/:tournamentId
 */
const getTournamentMatches = async (req, res) => {
  try {
    const matches = await Match.find({ tournamentId: req.params.tournamentId })
      .populate('categoryId', 'name')
      .sort({ 'schedule.date': 1, 'schedule.courtNumber': 1 });
    
    res.status(200).json({
      success: true,
      data: {
        matches,
        count: matches.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching matches',
      error: error.message
    });
  }
};

/**
 * Get all matches for a category
 * GET /api/matches/category/:categoryId
 */
const getCategoryMatches = async (req, res) => {
  try {
    const matches = await Match.getCategoryMatches(req.params.categoryId);
    
    res.status(200).json({
      success: true,
      data: {
        matches,
        count: matches.length
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error fetching category matches',
      error: error.message
    });
  }
};

/**
 * Create a manual match
 * POST /api/matches
 */
const createMatch = async (req, res) => {
  try {
    const {
      tournamentId,
      categoryId,
      stageName,
      roundName,
      players,
      schedule,
      matchFormat
    } = req.body;
    
    // Validate required fields
    if (!tournamentId || !categoryId || !stageName || !players || !schedule) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }
    
    // Verify tournament exists and user is organiser
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
        message: 'Access denied. Only the tournament organiser can create matches'
      });
    }
    
    // Create match
    const match = new Match({
      tournamentId,
      categoryId,
      stageName,
      roundName,
      players,
      schedule,
      matchFormat: matchFormat || 'Best of 3',
      status: 'scheduled'
    });
    
    await match.save();
    
    res.status(201).json({
      success: true,
      message: 'Match created successfully',
      data: {
        match
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
      message: 'Server error creating match',
      error: error.message
    });
  }
};

/**
 * Update match details
 * PUT /api/matches/:id
 */
const updateMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is tournament organiser
    const tournament = await Tournament.findById(match.tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can update matches'
      });
    }
    
    // Update allowed fields
    const { schedule, matchFormat, roundName } = req.body;
    
    if (schedule) {
      if (schedule.date) match.schedule.date = schedule.date;
      if (schedule.time !== undefined) match.schedule.time = schedule.time;
      if (schedule.courtNumber !== undefined) match.schedule.courtNumber = schedule.courtNumber;
    }
    if (matchFormat) match.matchFormat = matchFormat;
    if (roundName !== undefined) match.roundName = roundName;
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Match updated successfully',
      data: {
        match
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error updating match',
      error: error.message
    });
  }
};

/**
 * Delete a match
 * DELETE /api/matches/:id
 */
const deleteMatch = async (req, res) => {
  try {
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is tournament organiser
    const tournament = await Tournament.findById(match.tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can delete matches'
      });
    }
    
    await Match.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error deleting match',
      error: error.message
    });
  }
};

/**
 * Update live score for a match
 * PUT /api/matches/:id/live-score
 */
const updateLiveScore = async (req, res) => {
  try {
    const { scores } = req.body;
    
    // Validate scores array
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scores array with at least one set'
      });
    }
    
    // Find match
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is tournament organiser
    const tournament = await Tournament.findById(match.tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can update scores'
      });
    }
    
    // Validate score format
    for (const score of scores) {
      if (!score.setNumber || score.player1Score === undefined || score.player2Score === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each score must have setNumber, player1Score, and player2Score'
        });
      }
      
      // Validate score values (badminton: 21 points to win, must win by 2, max 30)
      if (score.player1Score < 0 || score.player2Score < 0) {
        return res.status(400).json({
          success: false,
          message: 'Scores cannot be negative'
        });
      }
      
      if (score.player1Score > 30 || score.player2Score > 30) {
        return res.status(400).json({
          success: false,
          message: 'Scores cannot exceed 30 points'
        });
      }
    }
    
    // Update scores
    scores.forEach(score => {
      match.addScore(score.setNumber, score.player1Score, score.player2Score);
    });
    
    // Transition to ongoing if currently scheduled
    if (match.status === 'scheduled') {
      match.updateStatus('ongoing');
    }
    
    // Check if match is complete (best of 3: first to 2 sets wins)
    let player1Sets = 0;
    let player2Sets = 0;
    
    match.scores.forEach(score => {
      if (score.player1Score > score.player2Score) {
        player1Sets++;
      } else if (score.player2Score > score.player1Score) {
        player2Sets++;
      }
    });
    
    // If either player has won 2 sets, match is complete
    if (player1Sets >= 2 || player2Sets >= 2) {
      const winnerId = match.determineWinnerFromScores();
      if (winnerId) {
        match.setWinner(winnerId);
        match.updateStatus('completed');
        
        // Advance winner in knockout bracket if applicable
        if (match.nextMatchId) {
          await bracketService.advanceWinner(match);
        }
      }
    }
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Live score updated successfully',
      data: {
        match,
        player1Sets,
        player2Sets,
        isComplete: match.status === 'completed'
      }
    });
  } catch (error) {
    console.error('Error updating live score:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error updating live score',
      error: error.message
    });
  }
};

/**
 * Get all matches for a player
 * GET /api/matches/my-matches
 */
const getMyMatches = async (req, res) => {
  try {
    const playerId = req.user._id;
    
    // Find all matches where the user is a participant
    const matches = await Match.find({
      'players.playerId': playerId
    })
    .populate('tournamentId', 'name code startDate endDate')
    .populate('categoryId', 'name')
    .populate('players.playerId', 'name email')
    .sort({ 'schedule.date': 1, status: 1 });
    
    // Enhance matches with opponent information
    const enhancedMatches = matches.map(match => {
      const matchObj = match.toObject();
      
      // Find opponent (the other player in the match)
      const opponent = matchObj.players.find(
        p => p.playerId._id.toString() !== playerId.toString()
      );
      
      // Find current player
      const currentPlayer = matchObj.players.find(
        p => p.playerId._id.toString() === playerId.toString()
      );
      
      // Determine if current player won
      let didWin = null;
      if (matchObj.winnerId) {
        didWin = matchObj.winnerId.toString() === playerId.toString();
      }
      
      return {
        ...matchObj,
        opponent,
        currentPlayer,
        didWin
      };
    });
    
    res.status(200).json({
      success: true,
      data: {
        matches: enhancedMatches,
        count: enhancedMatches.length
      }
    });
  } catch (error) {
    console.error('Error fetching player matches:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error fetching player matches',
      error: error.message
    });
  }
};

/**
 * Enter final result for a match
 * PUT /api/matches/:id/result
 */
const enterResult = async (req, res) => {
  try {
    const { scores, winnerId, isWalkover } = req.body;
    
    // Find match
    const match = await Match.findById(req.params.id);
    
    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }
    
    // Verify user is tournament organiser
    const tournament = await Tournament.findById(match.tournamentId);
    
    if (!tournament) {
      return res.status(404).json({
        success: false,
        message: 'Tournament not found'
      });
    }
    
    if (tournament.organiserId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Only the tournament organiser can enter results'
      });
    }
    
    // Handle walkover
    if (isWalkover) {
      if (!winnerId) {
        return res.status(400).json({
          success: false,
          message: 'Winner ID is required for walkover'
        });
      }
      
      // Verify winner is a participant
      const isParticipant = match.players.some(
        p => p.playerId.toString() === winnerId.toString()
      );
      
      if (!isParticipant) {
        return res.status(400).json({
          success: false,
          message: 'Winner must be one of the match participants'
        });
      }
      
      match.setWinner(winnerId);
      match.updateStatus('walkover');
      
      // Advance winner in knockout bracket if applicable
      if (match.nextMatchId) {
        await bracketService.advanceWinner(match);
      }
      
      await match.save();
      
      return res.status(200).json({
        success: true,
        message: 'Walkover result recorded successfully',
        data: {
          match
        }
      });
    }
    
    // Handle normal result with scores
    if (!scores || !Array.isArray(scores) || scores.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide scores array or set isWalkover to true'
      });
    }
    
    // Validate score format
    for (const score of scores) {
      if (!score.setNumber || score.player1Score === undefined || score.player2Score === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Each score must have setNumber, player1Score, and player2Score'
        });
      }
      
      if (score.player1Score < 0 || score.player2Score < 0) {
        return res.status(400).json({
          success: false,
          message: 'Scores cannot be negative'
        });
      }
      
      if (score.player1Score > 30 || score.player2Score > 30) {
        return res.status(400).json({
          success: false,
          message: 'Scores cannot exceed 30 points'
        });
      }
    }
    
    // Update scores
    scores.forEach(score => {
      match.addScore(score.setNumber, score.player1Score, score.player2Score);
    });
    
    // Determine winner from scores
    const determinedWinnerId = match.determineWinnerFromScores();
    
    if (!determinedWinnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot determine winner from provided scores. Ensure one player has won more sets.'
      });
    }
    
    // If winnerId provided, verify it matches the determined winner
    if (winnerId && winnerId.toString() !== determinedWinnerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Provided winner ID does not match the winner determined from scores'
      });
    }
    
    match.setWinner(determinedWinnerId);
    match.updateStatus('completed');
    
    // Advance winner in knockout bracket if applicable
    if (match.nextMatchId) {
      await bracketService.advanceWinner(match);
    }
    
    await match.save();
    
    res.status(200).json({
      success: true,
      message: 'Match result recorded successfully',
      data: {
        match
      }
    });
  } catch (error) {
    console.error('Error entering result:', error);
    
    res.status(500).json({
      success: false,
      message: 'Server error entering result',
      error: error.message
    });
  }
};

/**
 * Advance players from one stage to the next (e.g., Round Robin to Knockout)
 * POST /api/matches/advance-stage
 */
const advanceToNextStage = async (req, res) => {
  try {
    const { categoryId, fromStage, toStage, advanceCount } = req.body;

    // Validate required fields
    if (!categoryId || !fromStage || !toStage) {
      return res.status(400).json({
        success: false,
        message: 'Category ID, from stage, and to stage are required'
      });
    }

    if (!advanceCount || advanceCount < 1) {
      return res.status(400).json({
        success: false,
        message: 'Advance count must be at least 1'
      });
    }

    // Get category and verify it exists
    const category = await Category.findById(categoryId).populate('tournamentId');

    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    // Get tournament
    const tournament = await Tournament.findById(category.tournamentId);

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
        message: 'Access denied. Only the tournament organiser can advance stages'
      });
    }

    // Verify both stages exist in the category
    const fromStageExists = category.stages.some(s => s.name === fromStage);
    const toStageExists = category.stages.some(s => s.name === toStage);

    if (!fromStageExists) {
      return res.status(404).json({
        success: false,
        message: `Stage "${fromStage}" not found in category`
      });
    }

    if (!toStageExists) {
      return res.status(404).json({
        success: false,
        message: `Stage "${toStage}" not found in category`
      });
    }

    // Check if all matches in the from stage are completed
    const fromStageMatches = await Match.find({
      categoryId,
      stageName: fromStage
    });

    if (fromStageMatches.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No matches found for stage "${fromStage}". Please schedule matches first.`
      });
    }

    const incompleteMatches = fromStageMatches.filter(
      m => m.status !== 'completed' && m.status !== 'walkover'
    );

    if (incompleteMatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot advance to next stage. ${incompleteMatches.length} match(es) in "${fromStage}" are not yet completed.`
      });
    }

    // Check if matches already exist for the to stage
    const existingToStageMatches = await Match.find({
      categoryId,
      stageName: toStage
    });

    if (existingToStageMatches.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Matches already exist for stage "${toStage}". Delete them first if you want to regenerate.`
      });
    }

    // Get advancing players from the from stage
    const advancingPlayers = await schedulingService.getAdvancingPlayers({
      categoryId,
      stageName: fromStage,
      advanceCount
    });

    if (advancingPlayers.length < 2) {
      return res.status(400).json({
        success: false,
        message: `Not enough players to advance. Need at least 2 players, but only ${advancingPlayers.length} qualified.`
      });
    }

    // Get the to stage configuration
    const toStageConfig = category.stages.find(s => s.name === toStage);

    // Generate matches for the next stage based on its format
    let newMatches = [];

    if (toStageConfig.format === 'knockout') {
      // Generate knockout bracket with advancing players
      const bracketMatches = await bracketService.generateKnockoutBracket({
        tournamentId: tournament._id,
        categoryId: category._id,
        stageName: toStage,
        players: advancingPlayers,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        numberOfCourts: tournament.numberOfCourts
      });

      // Save matches and link them
      const savedMatches = [];
      const matchIdMap = new Map();

      // First pass: save all matches
      for (let i = 0; i < bracketMatches.length; i++) {
        const matchData = bracketMatches[i];
        const match = new Match(matchData);
        const saved = await match.save();
        savedMatches.push(saved);
        matchIdMap.set(i, saved._id);
      }

      // Second pass: update nextMatchId references
      for (let i = 0; i < bracketMatches.length; i++) {
        const matchData = bracketMatches[i];
        if (matchData.nextMatchId !== null && matchData.nextMatchId !== undefined) {
          const actualNextMatchId = matchIdMap.get(matchData.nextMatchId);
          if (actualNextMatchId) {
            savedMatches[i].nextMatchId = actualNextMatchId;
            await savedMatches[i].save();
          }
        }
      }

      newMatches = savedMatches;
    } else if (toStageConfig.format === 'round_robin') {
      // Generate round robin with advancing players
      const roundRobinMatches = await schedulingService.generateRoundRobinSchedule({
        tournamentId: tournament._id,
        categoryId: category._id,
        stageName: toStage,
        players: advancingPlayers,
        numberOfGroups: toStageConfig.groupCount || 1,
        startDate: tournament.startDate,
        endDate: tournament.endDate,
        numberOfCourts: tournament.numberOfCourts
      });

      newMatches = await schedulingService.saveRoundRobinMatches(roundRobinMatches);
    } else {
      return res.status(400).json({
        success: false,
        message: `Unsupported stage format: ${toStageConfig.format}`
      });
    }

    res.status(201).json({
      success: true,
      message: `Successfully advanced ${advancingPlayers.length} player(s) from "${fromStage}" to "${toStage}"`,
      data: {
        advancingPlayers,
        matches: newMatches,
        matchCount: newMatches.length
      }
    });
  } catch (error) {
    console.error('Error advancing to next stage:', error);

    res.status(500).json({
      success: false,
      message: 'Server error advancing to next stage',
      error: error.message
    });
  }
};

module.exports = {
  scheduleMatches,
  getTournamentMatches,
  getCategoryMatches,
  createMatch,
  updateMatch,
  deleteMatch,
  updateLiveScore,
  enterResult,
  getMyMatches,
  advanceToNextStage
};
