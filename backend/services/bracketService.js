const Match = require('../models/Match');

/**
 * Bracket Service for Knockout Tournament Format
 * Handles bracket generation, seeding, and winner advancement
 */

/**
 * Calculate the number of rounds needed for a knockout bracket
 * @param {number} playerCount - Number of players/teams
 * @returns {number} Number of rounds
 */
function calculateRounds(playerCount) {
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Calculate the next power of 2 greater than or equal to playerCount
 * @param {number} playerCount - Number of players/teams
 * @returns {number} Next power of 2
 */
function nextPowerOfTwo(playerCount) {
  return Math.pow(2, Math.ceil(Math.log2(playerCount)));
}

/**
 * Generate seeding order for a knockout bracket
 * Uses standard tournament seeding (1 vs lowest, 2 vs second-lowest, etc.)
 * @param {Array} players - Array of player objects with playerId and name
 * @returns {Array} Seeded pairs of players
 */
function generateSeeding(players) {
  const playerCount = players.length;
  const bracketSize = nextPowerOfTwo(playerCount);
  const byeCount = bracketSize - playerCount;
  
  // Create seeding order
  const seeds = [];
  for (let i = 0; i < playerCount; i++) {
    seeds.push(i + 1);
  }
  
  // Add byes if needed
  for (let i = 0; i < byeCount; i++) {
    seeds.push(null); // null represents a bye
  }
  
  // Generate pairings using standard bracket seeding
  const pairs = [];
  const totalSlots = bracketSize;
  
  for (let i = 0; i < totalSlots / 2; i++) {
    const seed1 = i + 1;
    const seed2 = totalSlots - i;
    
    const player1 = seed1 <= playerCount ? players[seed1 - 1] : null;
    const player2 = seed2 <= playerCount ? players[seed2 - 1] : null;
    
    pairs.push({
      player1,
      player2,
      matchNumber: i + 1
    });
  }
  
  return pairs;
}

/**
 * Generate knockout bracket structure with match linking
 * @param {Object} params - Bracket parameters
 * @param {string} params.tournamentId - Tournament ID
 * @param {string} params.categoryId - Category ID
 * @param {string} params.stageName - Stage name
 * @param {Array} params.players - Array of player objects
 * @param {Date} params.startDate - Tournament start date
 * @param {Date} params.endDate - Tournament end date
 * @param {number} params.numberOfCourts - Number of available courts
 * @returns {Array} Array of match objects ready to be saved
 */
async function generateKnockoutBracket({
  tournamentId,
  categoryId,
  stageName,
  players,
  startDate,
  endDate,
  numberOfCourts
}) {
  if (!players || players.length < 2) {
    throw new Error('At least 2 players are required for a knockout bracket');
  }
  
  const rounds = calculateRounds(players.length);
  const seededPairs = generateSeeding(players);
  
  // Generate all matches for all rounds
  const allMatches = [];
  const roundNames = generateRoundNames(rounds);
  
  // Track matches by round for linking
  const matchesByRound = [];
  
  // Generate matches for each round
  for (let round = 0; round < rounds; round++) {
    const matchesInRound = Math.pow(2, rounds - round - 1);
    const roundMatches = [];
    
    for (let matchIndex = 0; matchIndex < matchesInRound; matchIndex++) {
      const match = {
        tournamentId,
        categoryId,
        stageName,
        roundName: roundNames[round],
        matchNumber: matchIndex + 1,
        players: [],
        schedule: {
          date: startDate,
          time: null,
          courtNumber: null
        },
        matchFormat: 'Best of 3',
        scores: [],
        status: 'scheduled',
        nextMatchId: null,
        nextMatchPosition: null
      };
      
      // For first round, assign players from seeding
      if (round === 0) {
        const pair = seededPairs[matchIndex];
        
        if (pair.player1) {
          match.players.push({
            playerId: pair.player1.playerId,
            name: pair.player1.name,
            isTeam: pair.player1.isTeam || false,
            teamName: pair.player1.teamName || null
          });
        }
        
        if (pair.player2) {
          match.players.push({
            playerId: pair.player2.playerId,
            name: pair.player2.name,
            isTeam: pair.player2.isTeam || false,
            teamName: pair.player2.teamName || null
          });
        }
        
        // Handle byes - if only one player, they advance automatically
        if (match.players.length === 1) {
          match.status = 'completed';
          match.winnerId = match.players[0].playerId;
        }
      }
      
      roundMatches.push(match);
      allMatches.push(match);
    }
    
    matchesByRound.push(roundMatches);
  }
  
  // Link matches - set nextMatchId and nextMatchPosition
  for (let round = 0; round < rounds - 1; round++) {
    const currentRoundMatches = matchesByRound[round];
    const nextRoundMatches = matchesByRound[round + 1];
    
    for (let i = 0; i < currentRoundMatches.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const position = (i % 2) + 1; // 1 or 2
      
      currentRoundMatches[i].nextMatchId = nextMatchIndex; // Will be replaced with actual ID after saving
      currentRoundMatches[i].nextMatchPosition = position;
    }
  }
  
  return allMatches;
}

/**
 * Generate round names for knockout bracket
 * @param {number} totalRounds - Total number of rounds
 * @returns {Array} Array of round names
 */
function generateRoundNames(totalRounds) {
  const names = [];
  
  for (let i = 0; i < totalRounds; i++) {
    const matchesInRound = Math.pow(2, totalRounds - i - 1);
    
    if (matchesInRound === 1) {
      names.push('Final');
    } else if (matchesInRound === 2) {
      names.push('Semi-Final');
    } else if (matchesInRound === 4) {
      names.push('Quarter-Final');
    } else {
      names.push(`Round of ${matchesInRound * 2}`);
    }
  }
  
  return names;
}

/**
 * Advance winner to next match in knockout bracket
 * @param {Object} match - Completed match object
 * @returns {Object} Updated next match or null
 */
async function advanceWinner(match) {
  if (!match.winnerId || !match.nextMatchId) {
    return null;
  }
  
  // Find the next match
  const nextMatch = await Match.findById(match.nextMatchId);
  
  if (!nextMatch) {
    throw new Error('Next match not found');
  }
  
  // Get winner details from current match
  const winner = match.players.find(
    p => p.playerId.toString() === match.winnerId.toString()
  );
  
  if (!winner) {
    throw new Error('Winner not found in match players');
  }
  
  // Add winner to next match at the specified position
  const position = match.nextMatchPosition - 1; // Convert to 0-based index
  
  // Ensure players array has the right structure
  if (!nextMatch.players) {
    nextMatch.players = [];
  }
  
  // Set or update the player at the specified position
  if (nextMatch.players.length <= position) {
    // Extend array if needed
    while (nextMatch.players.length <= position) {
      nextMatch.players.push(null);
    }
  }
  
  nextMatch.players[position] = {
    playerId: winner.playerId,
    name: winner.name,
    isTeam: winner.isTeam,
    teamName: winner.teamName
  };
  
  // Remove null entries and check if match is ready
  nextMatch.players = nextMatch.players.filter(p => p !== null);
  
  await nextMatch.save();
  
  return nextMatch;
}

/**
 * Save bracket matches to database with proper linking
 * @param {Array} matches - Array of match objects
 * @returns {Array} Saved match documents
 */
async function saveBracketMatches(matches) {
  const savedMatches = [];
  
  // Save all matches first
  for (const matchData of matches) {
    const match = new Match(matchData);
    const saved = await match.save();
    savedMatches.push(saved);
  }
  
  // Update nextMatchId references with actual MongoDB IDs
  const matchesByRound = {};
  
  savedMatches.forEach(match => {
    if (!matchesByRound[match.roundName]) {
      matchesByRound[match.roundName] = [];
    }
    matchesByRound[match.roundName].push(match);
  });
  
  // Get round order
  const roundOrder = Object.keys(matchesByRound);
  
  // Link matches
  for (let i = 0; i < roundOrder.length - 1; i++) {
    const currentRound = matchesByRound[roundOrder[i]];
    const nextRound = matchesByRound[roundOrder[i + 1]];
    
    for (let j = 0; j < currentRound.length; j++) {
      const match = currentRound[j];
      const nextMatchIndex = Math.floor(j / 2);
      
      if (nextRound[nextMatchIndex]) {
        match.nextMatchId = nextRound[nextMatchIndex]._id;
        await match.save();
      }
    }
  }
  
  return savedMatches;
}

module.exports = {
  generateKnockoutBracket,
  advanceWinner,
  saveBracketMatches,
  generateSeeding,
  calculateRounds,
  generateRoundNames
};
