import api from './api';

/**
 * Create a new registration
 * @param {Object} registrationData - { categoryId, teamName, teamMembers }
 * @returns {Promise<Object>} Response with registration data
 */
export const createRegistration = async (registrationData) => {
  const response = await api.post('/registrations', registrationData);
  return response.data;
};

/**
 * Get player's tournament registrations
 * @returns {Promise<Object>} Response with registrations array
 */
export const getMyTournaments = async () => {
  const response = await api.get('/registrations/my-tournaments');
  return response.data;
};

/**
 * Get registrations for a category
 * @param {String} categoryId
 * @returns {Promise<Object>} Response with registrations array
 */
export const getCategoryRegistrations = async (categoryId) => {
  const response = await api.get(`/categories/${categoryId}/registrations`);
  return response.data;
};

/**
 * Delete a registration (organiser only)
 * @param {String} registrationId
 * @returns {Promise<Object>} Response with success message
 */
export const deleteRegistration = async (registrationId) => {
  const response = await api.delete(`/registrations/${registrationId}`);
  return response.data;
};

/**
 * Get tournament by code
 * @param {String} code - Tournament code
 * @returns {Promise<Object>} Response with tournament and categories
 */
export const getTournamentByCode = async (code) => {
  const response = await api.get('/tournaments');
  const tournaments = response.data.data.tournaments;
  const tournament = tournaments.find(t => t.code === code.toUpperCase());
  
  if (!tournament) {
    throw new Error('Tournament not found with this code');
  }
  
  // Get full tournament details with categories
  const detailsResponse = await api.get(`/tournaments/${tournament._id}`);
  return detailsResponse.data;
};
