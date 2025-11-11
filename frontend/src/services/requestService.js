import api from './api';

/**
 * Create a reschedule request
 * @param {string} matchId - Match ID
 * @param {string} note - Optional note explaining the request
 * @returns {Promise} Response with created request
 */
export const createRescheduleRequest = async (matchId, note = '') => {
  const response = await api.post('/requests/reschedule', {
    matchId,
    note
  });
  return response.data;
};

/**
 * Create a walkover request
 * @param {string} matchId - Match ID
 * @param {string} note - Optional note explaining the request
 * @returns {Promise} Response with created request
 */
export const createWalkoverRequest = async (matchId, note = '') => {
  const response = await api.post('/requests/walkover', {
    matchId,
    note
  });
  return response.data;
};

/**
 * Get all requests for a tournament (organiser only)
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise} Response with requests array
 */
export const getTournamentRequests = async (tournamentId) => {
  const response = await api.get(`/requests/tournament/${tournamentId}`);
  return response.data;
};

/**
 * Accept a request (organiser only)
 * @param {string} requestId - Request ID
 * @returns {Promise} Response with updated request
 */
export const acceptRequest = async (requestId) => {
  const response = await api.put(`/requests/${requestId}/accept`);
  return response.data;
};

/**
 * Reject a request (organiser only)
 * @param {string} requestId - Request ID
 * @returns {Promise} Response with updated request
 */
export const rejectRequest = async (requestId) => {
  const response = await api.put(`/requests/${requestId}/reject`);
  return response.data;
};

const requestService = {
  createRescheduleRequest,
  createWalkoverRequest,
  getTournamentRequests,
  acceptRequest,
  rejectRequest
};

export default requestService;
