import api from './api';

/**
 * Get player statistics
 * @param {String} playerId
 * @param {Object} filters - { tournamentId, categoryId }
 * @returns {Promise<Object>} Response with player statistics
 */
export const getPlayerStats = async (playerId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tournamentId) params.append('tournamentId', filters.tournamentId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  
  const queryString = params.toString();
  const url = `/stats/player/${playerId}${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get tournament leaderboard
 * @param {String} tournamentId
 * @param {String} categoryId - Optional category filter
 * @returns {Promise<Object>} Response with leaderboard data
 */
export const getTournamentLeaderboard = async (tournamentId, categoryId = null) => {
  const params = new URLSearchParams();
  if (categoryId) params.append('categoryId', categoryId);
  
  const queryString = params.toString();
  const url = `/stats/tournament/${tournamentId}/leaderboard${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get match history for a player
 * @param {String} playerId
 * @param {Object} options - { page, limit, tournamentId, categoryId, status }
 * @returns {Promise<Object>} Response with paginated match history
 */
export const getPlayerMatchHistory = async (playerId, options = {}) => {
  const params = new URLSearchParams();
  if (options.page) params.append('page', options.page);
  if (options.limit) params.append('limit', options.limit);
  if (options.tournamentId) params.append('tournamentId', options.tournamentId);
  if (options.categoryId) params.append('categoryId', options.categoryId);
  if (options.status) params.append('status', options.status);
  
  const queryString = params.toString();
  const url = `/stats/player/${playerId}/history${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};

/**
 * Get current user's statistics
 * @param {Object} filters - { tournamentId, categoryId }
 * @returns {Promise<Object>} Response with user statistics
 */
export const getMyStats = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.tournamentId) params.append('tournamentId', filters.tournamentId);
  if (filters.categoryId) params.append('categoryId', filters.categoryId);
  
  const queryString = params.toString();
  const url = `/stats/my-stats${queryString ? `?${queryString}` : ''}`;
  
  const response = await api.get(url);
  return response.data;
};
