const mongoose = require('mongoose');
const User = require('../models/User');
const Tournament = require('../models/Tournament');
const Category = require('../models/Category');
const Registration = require('../models/Registration');
const Match = require('../models/Match');
const Request = require('../models/Request');

/**
 * Create a backup of all MongoDB collections
 * @returns {Object} Backup data with timestamp and collections
 */
const createBackup = async () => {
  try {
    // Fetch all data from collections
    const users = await User.find({}).lean();
    const tournaments = await Tournament.find({}).lean();
    const categories = await Category.find({}).lean();
    const registrations = await Registration.find({}).lean();
    const matches = await Match.find({}).lean();
    const requests = await Request.find({}).lean();

    // Create backup object with timestamp
    const backup = {
      timestamp: new Date().toISOString(),
      version: '1.0',
      collections: {
        users,
        tournaments,
        categories,
        registrations,
        matches,
        requests,
      },
      metadata: {
        totalRecords: users.length + tournaments.length + categories.length + 
                     registrations.length + matches.length + requests.length,
        collectionCounts: {
          users: users.length,
          tournaments: tournaments.length,
          categories: categories.length,
          registrations: registrations.length,
          matches: matches.length,
          requests: requests.length,
        },
      },
    };

    return backup;
  } catch (error) {
    throw new Error(`Backup creation failed: ${error.message}`);
  }
};

/**
 * Generate a filename for the backup with timestamp
 * @returns {string} Formatted filename
 */
const generateBackupFilename = () => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[:.]/g, '-').split('.')[0];
  return `rallypoint-backup-${timestamp}.json`;
};

module.exports = {
  createBackup,
  generateBackupFilename,
};

/**
 * Validate backup file structure
 * @param {Object} backupData - Parsed backup data
 * @returns {Object} Validation result with isValid flag and errors
 */
const validateBackup = (backupData) => {
  const errors = [];

  // Check required top-level fields
  if (!backupData.timestamp) {
    errors.push('Missing timestamp field');
  }

  if (!backupData.version) {
    errors.push('Missing version field');
  }

  if (!backupData.collections) {
    errors.push('Missing collections field');
    return { isValid: false, errors };
  }

  // Check required collections
  const requiredCollections = ['users', 'tournaments', 'categories', 'registrations', 'matches', 'requests'];
  for (const collection of requiredCollections) {
    if (!Array.isArray(backupData.collections[collection])) {
      errors.push(`Missing or invalid collection: ${collection}`);
    }
  }

  // Check metadata if present
  if (backupData.metadata && !backupData.metadata.collectionCounts) {
    errors.push('Invalid metadata structure');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Restore database from backup data
 * @param {Object} backupData - Validated backup data
 * @param {boolean} clearExisting - Whether to clear existing data before restore
 * @returns {Object} Restore result with counts
 */
const restoreBackup = async (backupData, clearExisting = false) => {
  try {
    // Validate backup data
    const validation = validateBackup(backupData);
    if (!validation.isValid) {
      throw new Error(`Invalid backup file: ${validation.errors.join(', ')}`);
    }

    const result = {
      restored: {},
      errors: [],
    };

    // Clear existing data if requested
    if (clearExisting) {
      await User.deleteMany({});
      await Tournament.deleteMany({});
      await Category.deleteMany({});
      await Registration.deleteMany({});
      await Match.deleteMany({});
      await Request.deleteMany({});
    }

    // Restore collections
    const { collections } = backupData;

    // Restore users
    if (collections.users.length > 0) {
      try {
        await User.insertMany(collections.users, { ordered: false });
        result.restored.users = collections.users.length;
      } catch (error) {
        // Handle duplicate key errors
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.users = inserted;
        if (inserted < collections.users.length) {
          result.errors.push(`Users: ${collections.users.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.users = 0;
    }

    // Restore tournaments
    if (collections.tournaments.length > 0) {
      try {
        await Tournament.insertMany(collections.tournaments, { ordered: false });
        result.restored.tournaments = collections.tournaments.length;
      } catch (error) {
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.tournaments = inserted;
        if (inserted < collections.tournaments.length) {
          result.errors.push(`Tournaments: ${collections.tournaments.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.tournaments = 0;
    }

    // Restore categories
    if (collections.categories.length > 0) {
      try {
        await Category.insertMany(collections.categories, { ordered: false });
        result.restored.categories = collections.categories.length;
      } catch (error) {
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.categories = inserted;
        if (inserted < collections.categories.length) {
          result.errors.push(`Categories: ${collections.categories.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.categories = 0;
    }

    // Restore registrations
    if (collections.registrations.length > 0) {
      try {
        await Registration.insertMany(collections.registrations, { ordered: false });
        result.restored.registrations = collections.registrations.length;
      } catch (error) {
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.registrations = inserted;
        if (inserted < collections.registrations.length) {
          result.errors.push(`Registrations: ${collections.registrations.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.registrations = 0;
    }

    // Restore matches
    if (collections.matches.length > 0) {
      try {
        await Match.insertMany(collections.matches, { ordered: false });
        result.restored.matches = collections.matches.length;
      } catch (error) {
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.matches = inserted;
        if (inserted < collections.matches.length) {
          result.errors.push(`Matches: ${collections.matches.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.matches = 0;
    }

    // Restore requests
    if (collections.requests.length > 0) {
      try {
        await Request.insertMany(collections.requests, { ordered: false });
        result.restored.requests = collections.requests.length;
      } catch (error) {
        const inserted = error.insertedDocs ? error.insertedDocs.length : 0;
        result.restored.requests = inserted;
        if (inserted < collections.requests.length) {
          result.errors.push(`Requests: ${collections.requests.length - inserted} duplicates skipped`);
        }
      }
    } else {
      result.restored.requests = 0;
    }

    return result;
  } catch (error) {
    throw new Error(`Restore failed: ${error.message}`);
  }
};

module.exports = {
  createBackup,
  generateBackupFilename,
  validateBackup,
  restoreBackup,
};
