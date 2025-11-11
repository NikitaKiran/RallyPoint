const Match = require('../models/Match');
const User = require('../models/User');

/**
 * Calculate player statistics from completed matches
 * @param {String} playerId - Player's user ID
 * @param {Object} filters - Optional filters (tournamentId, categoryId)
 * @returns {Object} Player statistics
 */
async function calculatePlayerStats(playerId, filters = {}) {
  try {
    // Build match query
    const matchQuery = {
      'players.playerId': playerId,
      status: { $in: ['completed', 'walkover'] }
    };
    
    // Apply filters
    if (filters.tournamentId) {
      matchQuery.tournamentId = filters.tournamentId;
    }
    if (filters.categoryId) {
      matchQuery.categoryId = filters.categoryId;
    }
    
    // Get all completed matches for the player
    const matches = await Match.find(matchQuery)
      .populate('tournamentId', 'name code')
      .populate('categoryId', 'name')
      .populate('players.playerId', 'name')
      .sort({ 'schedule.date': -1 });
    
    // Initialize statistics
    const stats = {
      playerId,
      totalMatches: matches.length,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      winRate: 0,
      matchHistory: []
    };
    
    // Calculate statistics from each match
    matches.forEach(match => {
      const isWinner = match.winnerId && match.winnerId.toString() === playerId.toString();
      
      // Count wins and losses
      if (isWinner) {
        stats.wins++;
      } else {
        stats.losses++;
      }
      
      // Calculate sets and points
      let playerSets = 0;
      let opponentSets = 0;
      let playerPoints = 0;
      let opponentPoints = 0;
      
      // Determine which player index the current player is
      const playerIndex = match.players.findIndex(
        p => p.playerId._id.toString() === playerId.toString()
      );
      
      // Calculate from scores
      match.scores.forEach(score => {
        if (playerIndex === 0) {
          // Player is player1
          playerPoints += score.player1Score;
          opponentPoints += score.player2Score;
          
          if (score.player1Score > score.player2Score) {
            playerSets++;
          } else if (score.player2Score > score.player1Score) {
            opponentSets++;
          }
        } else {
          // Player is player2
          playerPoints += score.player2Score;
          opponentPoints += score.player1Score;
          
          if (score.player2Score > score.player1Score) {
            playerSets++;
          } else if (score.player1Score > score.player2Score) {
            opponentSets++;
          }
        }
      });
      
      stats.setsWon += playerSets;
      stats.setsLost += opponentSets;
      stats.pointsWon += playerPoints;
      stats.pointsLost += opponentPoints;
      
      // Find opponent
      const opponent = match.players.find(
        p => p.playerId._id.toString() !== playerId.toString()
      );
      
      // Add to match history
      stats.matchHistory.push({
        matchId: match._id,
        tournament: match.tournamentId ? {
          id: match.tournamentId._id,
          name: match.tournamentId.name,
          code: match.tournamentId.code
        } : null,
        category: match.categoryId ? {
          id: match.categoryId._id,
          name: match.categoryId.name
        } : null,
        opponent: opponent ? {
          id: opponent.playerId._id,
          name: opponent.name,
          isTeam: opponent.isTeam,
          teamName: opponent.teamName
        } : null,
        date: match.schedule.date,
        result: isWinner ? 'win' : 'loss',
        scores: match.scores,
        playerSets,
        opponentSets,
        playerPoints,
        opponentPoints,
        status: match.status
      });
    });
    
    // Calculate win rate
    if (stats.totalMatches > 0) {
      stats.winRate = (stats.wins / stats.totalMatches * 100).toFixed(2);
    }
    
    return stats;
  } catch (error) {
    console.error('Error calculating player stats:', error);
    throw error;
  }
}

/**
 * Generate leaderboard for a tournament or category
 * @param {String} tournamentId - Tournament ID
 * @param {String} categoryId - Optional category ID for category-specific leaderboard
 * @returns {Array} Sorted leaderboard with player rankings
 */
async function generateLeaderboard(tournamentId, categoryId = null) {
  try {
    // Build match query
    const matchQuery = {
      tournamentId,
      status: { $in: ['completed', 'walkover'] }
    };
    
    if (categoryId) {
      matchQuery.categoryId = categoryId;
    }
    
    // Get all completed matches
    const matches = await Match.find(matchQuery)
      .populate('players.playerId', 'name email');
    
    // Collect all unique players
    const playerStatsMap = new Map();
    
    matches.forEach(match => {
      match.players.forEach(player => {
        const playerId = player.playerId._id.toString();
        
        if (!playerStatsMap.has(playerId)) {
          playerStatsMap.set(playerId, {
            playerId: player.playerId._id,
            playerName: player.name,
            isTeam: player.isTeam,
            teamName: player.teamName,
            matchesPlayed: 0,
            wins: 0,
            losses: 0,
            setsWon: 0,
            setsLost: 0,
            pointsWon: 0,
            pointsLost: 0,
            winRate: 0,
            setDifference: 0,
            pointDifference: 0
          });
        }
      });
    });
    
    // Calculate statistics for each player
    matches.forEach(match => {
      const player1Id = match.players[0].playerId._id.toString();
      const player2Id = match.players[1].playerId._id.toString();
      
      const player1Stats = playerStatsMap.get(player1Id);
      const player2Stats = playerStatsMap.get(player2Id);
      
      // Increment matches played
      player1Stats.matchesPlayed++;
      player2Stats.matchesPlayed++;
      
      // Determine winner
      const winnerId = match.winnerId ? match.winnerId.toString() : null;
      
      if (winnerId === player1Id) {
        player1Stats.wins++;
        player2Stats.losses++;
      } else if (winnerId === player2Id) {
        player2Stats.wins++;
        player1Stats.losses++;
      }
      
      // Calculate sets and points from scores
      let player1Sets = 0;
      let player2Sets = 0;
      let player1Points = 0;
      let player2Points = 0;
      
      match.scores.forEach(score => {
        player1Points += score.player1Score;
        player2Points += score.player2Score;
        
        if (score.player1Score > score.player2Score) {
          player1Sets++;
        } else if (score.player2Score > score.player1Score) {
          player2Sets++;
        }
      });
      
      player1Stats.setsWon += player1Sets;
      player1Stats.setsLost += player2Sets;
      player1Stats.pointsWon += player1Points;
      player1Stats.pointsLost += player2Points;
      
      player2Stats.setsWon += player2Sets;
      player2Stats.setsLost += player1Sets;
      player2Stats.pointsWon += player2Points;
      player2Stats.pointsLost += player1Points;
    });
    
    // Calculate derived statistics and convert to array
    const leaderboard = Array.from(playerStatsMap.values()).map(stats => {
      if (stats.matchesPlayed > 0) {
        stats.winRate = (stats.wins / stats.matchesPlayed * 100).toFixed(2);
      }
      stats.setDifference = stats.setsWon - stats.setsLost;
      stats.pointDifference = stats.pointsWon - stats.pointsLost;
      
      return stats;
    });
    
    // Sort leaderboard by ranking algorithm
    // Primary: wins (descending)
    // Secondary: win rate (descending)
    // Tertiary: set difference (descending)
    // Quaternary: point difference (descending)
    leaderboard.sort((a, b) => {
      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }
      if (b.winRate !== a.winRate) {
        return parseFloat(b.winRate) - parseFloat(a.winRate);
      }
      if (b.setDifference !== a.setDifference) {
        return b.setDifference - a.setDifference;
      }
      return b.pointDifference - a.pointDifference;
    });
    
    // Add rank to each entry
    leaderboard.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    return leaderboard;
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    throw error;
  }
}

/**
 * Get match history for a player with pagination
 * @param {String} playerId - Player's user ID
 * @param {Object} options - Pagination and filter options
 * @returns {Object} Paginated match history
 */
async function getMatchHistory(playerId, options = {}) {
  try {
    const {
      page = 1,
      limit = 10,
      tournamentId = null,
      categoryId = null,
      status = ['completed', 'walkover']
    } = options;
    
    // Build query
    const query = {
      'players.playerId': playerId,
      status: { $in: status }
    };
    
    if (tournamentId) {
      query.tournamentId = tournamentId;
    }
    if (categoryId) {
      query.categoryId = categoryId;
    }
    
    // Calculate pagination
    const skip = (page - 1) * limit;
    
    // Get total count
    const total = await Match.countDocuments(query);
    
    // Get matches
    const matches = await Match.find(query)
      .populate('tournamentId', 'name code')
      .populate('categoryId', 'name')
      .populate('players.playerId', 'name')
      .sort({ 'schedule.date': -1 })
      .skip(skip)
      .limit(limit);
    
    // Format match history
    const history = matches.map(match => {
      const playerIndex = match.players.findIndex(
        p => p.playerId._id.toString() === playerId.toString()
      );
      
      const opponent = match.players.find(
        p => p.playerId._id.toString() !== playerId.toString()
      );
      
      const isWinner = match.winnerId && match.winnerId.toString() === playerId.toString();
      
      // Calculate player's sets and points
      let playerSets = 0;
      let opponentSets = 0;
      let playerPoints = 0;
      let opponentPoints = 0;
      
      match.scores.forEach(score => {
        if (playerIndex === 0) {
          playerPoints += score.player1Score;
          opponentPoints += score.player2Score;
          if (score.player1Score > score.player2Score) playerSets++;
          else if (score.player2Score > score.player1Score) opponentSets++;
        } else {
          playerPoints += score.player2Score;
          opponentPoints += score.player1Score;
          if (score.player2Score > score.player1Score) playerSets++;
          else if (score.player1Score > score.player2Score) opponentSets++;
        }
      });
      
      return {
        matchId: match._id,
        tournament: match.tournamentId ? {
          id: match.tournamentId._id,
          name: match.tournamentId.name,
          code: match.tournamentId.code
        } : null,
        category: match.categoryId ? {
          id: match.categoryId._id,
          name: match.categoryId.name
        } : null,
        opponent: opponent ? {
          id: opponent.playerId._id,
          name: opponent.name,
          isTeam: opponent.isTeam,
          teamName: opponent.teamName
        } : null,
        date: match.schedule.date,
        result: isWinner ? 'win' : 'loss',
        scores: match.scores,
        playerSets,
        opponentSets,
        playerPoints,
        opponentPoints,
        status: match.status
      };
    });
    
    return {
      history,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    console.error('Error getting match history:', error);
    throw error;
  }
}

module.exports = {
  calculatePlayerStats,
  generateLeaderboard,
  getMatchHistory
};
