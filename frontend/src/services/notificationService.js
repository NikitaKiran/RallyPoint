import api from './api';

/**
 * Send custom email notification
 * @param {Object} data - Email data (recipients, subject, message, tournamentId)
 * @returns {Promise} - API response
 */
export const sendEmailNotification = async (data) => {
  const response = await api.post('/notifications/email', data);
  return response.data;
};

/**
 * Send match reminder email for a single match
 * @param {string} matchId - Match ID
 * @returns {Promise} - API response
 */
export const sendMatchReminder = async (matchId) => {
  const response = await api.post('/notifications/match-reminder', { matchId });
  return response.data;
};

/**
 * Send match reminder emails for multiple matches
 * @param {Array<string>} matchIds - Array of match IDs
 * @param {string} tournamentId - Tournament ID (optional)
 * @returns {Promise} - API response
 */
export const sendBatchMatchReminders = async (matchIds, tournamentId = null) => {
  const response = await api.post('/notifications/batch-match-reminder', {
    matchIds,
    tournamentId
  });
  return response.data;
};
