const Match = require('../models/Match');

/**
 * Scheduling Service for Round Robin Tournament Format
 * Handles round robin pairing, group distribution, and match generation
 */

/**
 * Distribute players into groups for round robin
 * @param {Array} players - Array of player objects
 * @param {number} groupCount - Number of groups to create
 * @returns {Array} Array of groups, each containing player objects
 */
function distributePlayersIntoGroups(players, groupCount = 1) {
  if (groupCount < 1) {
    throw new Error('Group count must be at least 1');
  }
  
  if (players.length < groupCount) {
    throw new Error('Cannot have more groups than players');
  }
  
  const groups = [];
  
  // Initialize groups
  for (let i = 0; i < groupCount; i++) {
    groups.push([]);
  }
  
  // Distribute players evenly across groups using snake draft
  // This ensures balanced group sizes
  players.forEach((player, index) => {
    const groupIndex = index % groupCount;
    groups[groupIndex].push(player);
  });
  
  return groups;
}

/**
 * Generate all possible pairings for round robin within a group
 * Uses round-robin algorithm to ensure each player plays every other player once
 * @param {Array} players - Array of player objects in the group
 * @returns {Array} Array of match pairings
 */
function generateRoundRobinPairings(players) {
  if (players.length < 2) {
    throw new Error('At least 2 players are required for round robin');
  }
  
  const pairings = [];
  
  // Generate all unique pairings
  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      pairings.push({
        player1: players[i],
        player2: players[j]
      });
    }
  }
  
  return pairings;
}

/**
 * Generate group identifier
 * @param {number} groupIndex - Zero-based group index
 * @returns {string} Group identifier (e.g., "Group A", "Group B")
 */
function generateGroupId(groupIndex) {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  return `Group ${letters[groupIndex % letters.length]}`;
}

/**
 * Generate complete round robin schedule for a category
 * @param {Object} params - Scheduling parameters
 * @param {string} params.tournamentId - Tournament ID
 * @param {string} params.categoryId - Category ID
 * @param {string} params.stageName - Stage name
 * @param {Array} params.players - Array of player objects
 * @param {number} params.groupCount - Number of groups (default: 1)
 * @param {Date} params.startDate - Tournament start date
 * @param {Date} params.endDate - Tournament end date
 * @param {number} params.numberOfCourts - Number of available courts
 * @returns {Array} Array of match objects ready to be saved
 */
function generateRoundRobinSchedule({
  tournamentId,
  categoryId,
  stageName,
  players,
  groupCount = 1,
  startDate,
  endDate,
  numberOfCourts
}) {
  if (!players || players.length < 2) {
    throw new Error('At least 2 players are required for round robin');
  }
  
  // Distribute players into groups
  const groups = distributePlayersIntoGroups(players, groupCount);
  
  const allMatches = [];
  let matchCounter = 1;
  
  // Generate matches for each group
  groups.forEach((groupPlayers, groupIndex) => {
    const groupId = generateGroupId(groupIndex);
    const pairings = generateRoundRobinPairings(groupPlayers);
    
    // Create match objects for each pairing
    pairings.forEach(pairing => {
      const match = {
        tournamentId,
        categoryId,
        stageName,
        roundName: groupId,
        matchNumber: matchCounter++,
        players: [
          {
            playerId: pairing.player1.playerId,
            name: pairing.player1.name,
            isTeam: pairing.player1.isTeam || false,
            teamName: pairing.player1.teamName || null
          },
          {
            playerId: pairing.player2.playerId,
            name: pairing.player2.name,
            isTeam: pairing.player2.isTeam || false,
            teamName: pairing.player2.teamName || null
          }
        ],
        schedule: {
          date: startDate,
          time: null,
          courtNumber: null
        },
        matchFormat: 'Best of 3',
        scores: [],
        status: 'scheduled',
        groupId: groupId,
        nextMatchId: null,
        nextMatchPosition: null
      };
      
      allMatches.push(match);
    });
  });
  
  return allMatches;
}

/**
 * Calculate round robin standings for a group
 * @param {Array} matches - Array of completed matches in the group
 * @param {Array} players - Array of all players in the group
 * @returns {Array} Sorted standings with wins, losses, and points
 */
function calculateRoundRobinStandings(matches, players) {
  const standings = {};
  
  // Initialize standings for all players
  players.forEach(player => {
    standings[player.playerId.toString()] = {
      playerId: player.playerId,
      name: player.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      setsWon: 0,
      setsLost: 0,
      pointsWon: 0,
      pointsLost: 0,
      points: 0 // Tournament points (typically 2 for win, 1 for loss, 0 for no-show)
    };
  });
  
  // Process completed matches
  matches.forEach(match => {
    if (match.status !== 'completed' && match.status !== 'walkover') {
      return;
    }
    
    const player1Id = match.players[0].playerId.toString();
    const player2Id = match.players[1].playerId.toString();
    
    if (!standings[player1Id] || !standings[player2Id]) {
      return;
    }
    
    standings[player1Id].matchesPlayed++;
    standings[player2Id].matchesPlayed++;
    
    // Calculate sets and points from scores
    let player1Sets = 0;
    let player2Sets = 0;
    
    match.scores.forEach(score => {
      standings[player1Id].pointsWon += score.player1Score;
      standings[player1Id].pointsLost += score.player2Score;
      standings[player2Id].pointsWon += score.player2Score;
      standings[player2Id].pointsLost += score.player1Score;
      
      if (score.player1Score > score.player2Score) {
        player1Sets++;
      } else if (score.player2Score > score.player1Score) {
        player2Sets++;
      }
    });
    
    standings[player1Id].setsWon += player1Sets;
    standings[player1Id].setsLost += player2Sets;
    standings[player2Id].setsWon += player2Sets;
    standings[player2Id].setsLost += player1Sets;
    
    // Determine winner and update wins/losses
    const winnerId = match.winnerId?.toString();
    
    if (winnerId === player1Id) {
      standings[player1Id].wins++;
      standings[player1Id].points += 2;
      standings[player2Id].losses++;
      standings[player2Id].points += 1;
    } else if (winnerId === player2Id) {
      standings[player2Id].wins++;
      standings[player2Id].points += 2;
      standings[player1Id].losses++;
      standings[player1Id].points += 1;
    }
  });
  
  // Convert to array and sort
  const standingsArray = Object.values(standings);
  
  // Sort by: points (desc), wins (desc), set difference (desc), point difference (desc)
  standingsArray.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.wins !== a.wins) return b.wins - a.wins;
    
    const aSetDiff = a.setsWon - a.setsLost;
    const bSetDiff = b.setsWon - b.setsLost;
    if (bSetDiff !== aSetDiff) return bSetDiff - aSetDiff;
    
    const aPointDiff = a.pointsWon - a.pointsLost;
    const bPointDiff = b.pointsWon - b.pointsLost;
    return bPointDiff - aPointDiff;
  });
  
  return standingsArray;
}

/**
 * Get top players from round robin groups for advancement
 * @param {Object} params - Parameters
 * @param {string} params.categoryId - Category ID
 * @param {string} params.stageName - Stage name
 * @param {number} params.advanceCount - Number of players to advance from each group
 * @returns {Array} Array of advancing players
 */
async function getAdvancingPlayers({ categoryId, stageName, advanceCount = 1 }) {
  // Get all matches for this stage
  const matches = await Match.find({
    categoryId,
    stageName,
    status: { $in: ['completed', 'walkover'] }
  });
  
  // Group matches by groupId
  const matchesByGroup = {};
  matches.forEach(match => {
    if (!match.groupId) return;
    
    if (!matchesByGroup[match.groupId]) {
      matchesByGroup[match.groupId] = [];
    }
    matchesByGroup[match.groupId].push(match);
  });
  
  const advancingPlayers = [];
  
  // Get top players from each group
  Object.keys(matchesByGroup).forEach(groupId => {
    const groupMatches = matchesByGroup[groupId];
    
    // Get unique players in this group
    const playerSet = new Set();
    groupMatches.forEach(match => {
      match.players.forEach(player => {
        playerSet.add(JSON.stringify({
          playerId: player.playerId,
          name: player.name,
          isTeam: player.isTeam,
          teamName: player.teamName
        }));
      });
    });
    
    const players = Array.from(playerSet).map(p => JSON.parse(p));
    
    // Calculate standings
    const standings = calculateRoundRobinStandings(groupMatches, players);
    
    // Take top N players
    const topPlayers = standings.slice(0, advanceCount);
    advancingPlayers.push(...topPlayers.map(s => ({
      playerId: s.playerId,
      name: s.name
    })));
  });
  
  return advancingPlayers;
}

/**
 * Save round robin matches to database
 * @param {Array} matches - Array of match objects
 * @returns {Array} Saved match documents
 */
async function saveRoundRobinMatches(matches) {
  const savedMatches = [];
  
  for (const matchData of matches) {
    const match = new Match(matchData);
    const saved = await match.save();
    savedMatches.push(saved);
  }
  
  return savedMatches;
}

module.exports = {
  generateRoundRobinSchedule,
  distributePlayersIntoGroups,
  generateRoundRobinPairings,
  calculateRoundRobinStandings,
  getAdvancingPlayers,
  saveRoundRobinMatches,
  generateGroupId
};
