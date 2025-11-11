import api from './api';

/**
 * Export tournament data as CSV
 * @param {string} tournamentId - Tournament ID
 * @returns {Promise} - Blob response
 */
export const exportTournamentCSV = async (tournamentId) => {
  const response = await api.get(`/export/tournament/${tournamentId}/csv`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Export tournament results as PDF
 * @param {string} tournamentId - Tournament ID
 * @param {string} type - Export type ('results' or 'bracket')
 * @param {string} categoryId - Category ID (required for bracket type)
 * @returns {Promise} - Blob response
 */
export const exportTournamentPDF = async (tournamentId, type = 'results', categoryId = null) => {
  let url = `/export/tournament/${tournamentId}/pdf?type=${type}`;
  if (categoryId) {
    url += `&categoryId=${categoryId}`;
  }
  
  const response = await api.get(url, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Export category registrations as CSV
 * @param {string} categoryId - Category ID
 * @returns {Promise} - Blob response
 */
export const exportCategoryRegistrations = async (categoryId) => {
  const response = await api.get(`/export/category/${categoryId}/registrations`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Export category matches as CSV
 * @param {string} categoryId - Category ID
 * @returns {Promise} - Blob response
 */
export const exportCategoryMatches = async (categoryId) => {
  const response = await api.get(`/export/category/${categoryId}/matches`, {
    responseType: 'blob'
  });
  return response.data;
};

/**
 * Helper function to trigger file download
 * @param {Blob} blob - File blob
 * @param {string} filename - Filename for download
 */
export const downloadFile = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
