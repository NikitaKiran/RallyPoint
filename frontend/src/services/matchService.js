import api from './api';

/**
 * Generate automatic schedule for a category stage
 * @param {Object} scheduleData - { categoryId, stageName }
 * @returns {Promise<Object>} Response with generated matches
 */
export const scheduleMatches = async (scheduleData) => {
  const response = await api.post('/matches/schedule', scheduleData);
  return response.data;
};

/**
 * Get all matches for a tournament
 * @param {String} tournamentId
 * @returns {Promise<Object>} Response with matches array
 */
export const getTournamentMatches = async (tournamentId) => {
  const response = await api.get(`/matches/tournament/${tournamentId}`);
  return response.data;
};

/**
 * Get all matches for a category
 * @param {String} categoryId
 * @returns {Promise<Object>} Response with matches array
 */
export const getCategoryMatches = async (categoryId) => {
  const response = await api.get(`/matches/category/${categoryId}`);
  return response.data;
};

/**
 * Create a manual match
 * @param {Object} matchData - { tournamentId, categoryId, stageName, roundName, players, schedule, matchFormat }
 * @returns {Promise<Object>} Response with match data
 */
export const createMatch = async (matchData) => {
  const response = await api.post('/matches', matchData);
  return response.data;
};

/**
 * Update match details
 * @param {String} matchId
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Response with updated match
 */
export const updateMatch = async (matchId, updateData) => {
  const response = await api.put(`/matches/${matchId}`, updateData);
  return response.data;
};

/**
 * Delete a match
 * @param {String} matchId
 * @returns {Promise<Object>} Response confirming deletion
 */
export const deleteMatch = async (matchId) => {
  const response = await api.delete(`/matches/${matchId}`);
  return response.data;
};

/**
 * Update live score for a match
 * @param {String} matchId
 * @param {Array} scores - Array of { setNumber, player1Score, player2Score }
 * @returns {Promise<Object>} Response with updated match
 */
export const updateLiveScore = async (matchId, scores) => {
  const response = await api.put(`/matches/${matchId}/live-score`, { scores });
  return response.data;
};

/**
 * Enter final result for a match
 * @param {String} matchId
 * @param {Object} resultData - { scores, winnerId, isWalkover }
 * @returns {Promise<Object>} Response with updated match
 */
export const enterResult = async (matchId, resultData) => {
  const response = await api.put(`/matches/${matchId}/result`, resultData);
  return response.data;
};

/**
 * Get all matches for the authenticated player
 * @returns {Promise<Object>} Response with player's matches array
 */
export const getMyMatches = async () => {
  const response = await api.get('/matches/my-matches');
  return response.data;
};
