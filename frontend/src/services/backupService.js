import api from './api';

/**
 * Export database backup
 * @returns {Promise} Backup data
 */
export const exportBackup = async () => {
  const response = await api.get('/backup/export');
  return response.data;
};

/**
 * Restore database from backup
 * @param {Object} backupData - Backup data to restore
 * @param {boolean} clearExisting - Whether to clear existing data
 * @returns {Promise} Restore result
 */
export const restoreBackup = async (backupData, clearExisting = false) => {
  const response = await api.post('/backup/restore', {
    backupData,
    clearExisting,
  });
  return response.data;
};

/**
 * Download backup file
 * @param {Object} backupData - Backup data
 * @param {string} filename - Filename for download
 */
export const downloadBackupFile = (backupData, filename) => {
  const dataStr = JSON.stringify(backupData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};
