import api from './api';

/**
 * Create a new tournament
 * @param {Object} tournamentData - { name, description, startDate, endDate, numberOfCourts }
 * @returns {Promise<Object>} Response with tournament data
 */
export const createTournament = async (tournamentData) => {
  const response = await api.post('/tournaments', tournamentData);
  return response.data;
};

/**
 * Get all tournaments
 * @returns {Promise<Object>} Response with tournaments array
 */
export const getAllTournaments = async () => {
  const response = await api.get('/tournaments');
  return response.data;
};

/**
 * Get tournament by ID
 * @param {String} tournamentId
 * @returns {Promise<Object>} Response with tournament and categories
 */
export const getTournamentById = async (tournamentId) => {
  const response = await api.get(`/tournaments/${tournamentId}`);
  return response.data;
};

/**
 * Update tournament
 * @param {String} tournamentId
 * @param {Object} updateData - Fields to update
 * @returns {Promise<Object>} Response with updated tournament
 */
export const updateTournament = async (tournamentId, updateData) => {
  const response = await api.put(`/tournaments/${tournamentId}`, updateData);
  return response.data;
};

/**
 * Create a category for a tournament
 * @param {String} tournamentId
 * @param {Object} categoryData - { name, isTeamEvent, eligibilityCriteria, registrationLimit, cashPrize, stages }
 * @returns {Promise<Object>} Response with category data
 */
export const createCategory = async (tournamentId, categoryData) => {
  const response = await api.post(`/categories/tournament/${tournamentId}`, categoryData);
  return response.data;
};
