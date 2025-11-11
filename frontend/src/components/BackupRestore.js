import React, { useState } from 'react';
import { exportBackup, restoreBackup, downloadBackupFile } from '../services/backupService';

const BackupRestore = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [clearExisting, setClearExisting] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const backupData = await exportBackup();
      
      // Generate filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      const filename = `rallypoint-backup-${timestamp}.json`;
      
      // Download the file
      downloadBackupFile(backupData, filename);
      
      setMessage(`Backup exported successfully: ${filename}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to export backup');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      // Read file content
      const fileContent = await file.text();
      const backupData = JSON.parse(fileContent);

      // Restore backup
      const result = await restoreBackup(backupData, clearExisting);
      
      const restoredCounts = Object.entries(result.result.restored)
        .map(([key, count]) => `${key}: ${count}`)
        .join(', ');
      
      let successMessage = `Backup restored successfully! Records restored: ${restoredCounts}`;
      
      if (result.result.errors && result.result.errors.length > 0) {
        successMessage += `\nWarnings: ${result.result.errors.join(', ')}`;
      }
      
      setMessage(successMessage);
      
      // Clear file input
      event.target.value = '';
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid backup file format');
      } else {
        setError(err.response?.data?.error || 'Failed to restore backup');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Database Backup & Restore</h3>
      
      {message && (
        <div className="mb-4 p-4 bg-green-100 dark:bg-green-900 border border-green-400 dark:border-green-600 text-green-700 dark:text-green-200 rounded whitespace-pre-line">
          {message}
        </div>
      )}
      
      {error && (
        <div className="mb-4 p-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-600 text-red-700 dark:text-red-200 rounded">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Export Section */}
        <div className="border-b dark:border-gray-700 pb-6">
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Export Backup</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Download a complete backup of all tournament data including users, tournaments, 
            categories, registrations, matches, and requests.
          </p>
          <button
            onClick={handleExport}
            disabled={loading}
            className="bg-blue-600 dark:bg-blue-500 text-white px-6 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Exporting...' : 'Export Backup'}
          </button>
        </div>

        {/* Restore Section */}
        <div>
          <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">Restore Backup</h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload a backup file to restore tournament data. You can choose to merge with 
            existing data or clear all existing data first.
          </p>
          
          <div className="mb-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={clearExisting}
                onChange={(e) => setClearExisting(e.target.checked)}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-gray-700 dark:text-gray-300">
                Clear existing data before restore (Warning: This will delete all current data)
              </span>
            </label>
          </div>

          <div className="flex items-center space-x-4">
            <label className="bg-green-600 dark:bg-green-500 text-white px-6 py-2 rounded-md hover:bg-green-700 dark:hover:bg-green-600 cursor-pointer disabled:bg-gray-400">
              {loading ? 'Restoring...' : 'Select Backup File'}
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
              />
            </label>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Only .json backup files are supported
            </span>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900 border border-yellow-200 dark:border-yellow-700 rounded">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          <strong>Important:</strong> Always keep backup files in a safe location. 
          Restoring a backup will modify your database. Make sure to export a current 
          backup before restoring an old one.
        </p>
      </div>
    </div>
  );
};

export default BackupRestore;
