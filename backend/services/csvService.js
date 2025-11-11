const Papa = require('papaparse');
const User = require('../models/User');

/**
 * Validate player data from CSV row
 * @param {Object} row - CSV row data
 * @param {number} rowIndex - Row index for error reporting
 * @returns {Object} - { valid: boolean, errors: string[], data: Object }
 */
const validatePlayerData = (row, rowIndex) => {
  const errors = [];
  const data = {};

  // Validate name
  if (!row.name || row.name.trim().length < 2) {
    errors.push(`Row ${rowIndex}: Name is required and must be at least 2 characters`);
  } else {
    data.name = row.name.trim();
  }

  // Validate email
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!row.email || !emailRegex.test(row.email)) {
    errors.push(`Row ${rowIndex}: Valid email is required`);
  } else {
    data.email = row.email.trim().toLowerCase();
  }

  // Validate password (if provided, otherwise generate default)
  if (row.password && row.password.length < 6) {
    errors.push(`Row ${rowIndex}: Password must be at least 6 characters`);
  } else {
    data.password = row.password || 'player123'; // Default password
  }

  // Validate role (default to 'player' if not specified)
  const role = row.role ? row.role.trim().toLowerCase() : 'player';
  if (!['organiser', 'player'].includes(role)) {
    errors.push(`Row ${rowIndex}: Role must be either 'organiser' or 'player'`);
  } else {
    data.role = role;
  }

  return {
    valid: errors.length === 0,
    errors,
    data
  };
};

/**
 * Process CSV file and create/update users
 * @param {string} csvContent - CSV file content as string
 * @returns {Promise<Object>} - { created: number, updated: number, failed: number, errors: Array }
 */
const processPlayerCSV = async (csvContent) => {
  return new Promise((resolve, reject) => {
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const summary = {
          created: 0,
          updated: 0,
          failed: 0,
          errors: []
        };

        // Process each row
        for (let i = 0; i < results.data.length; i++) {
          const row = results.data[i];
          const rowNumber = i + 2; // +2 because of header row and 0-based index

          // Validate row data
          const validation = validatePlayerData(row, rowNumber);
          
          if (!validation.valid) {
            summary.failed++;
            summary.errors.push(...validation.errors);
            continue;
          }

          try {
            // Check if user already exists
            const existingUser = await User.findOne({ email: validation.data.email });

            if (existingUser) {
              // Update existing user (except password if not provided in CSV)
              existingUser.name = validation.data.name;
              existingUser.role = validation.data.role;
              
              // Only update password if explicitly provided in CSV
              if (row.password) {
                existingUser.password = validation.data.password;
              }

              await existingUser.save();
              summary.updated++;
            } else {
              // Create new user
              const newUser = new User(validation.data);
              await newUser.save();
              summary.created++;
            }
          } catch (error) {
            summary.failed++;
            summary.errors.push(`Row ${rowNumber}: ${error.message}`);
          }
        }

        resolve(summary);
      },
      error: (error) => {
        reject(new Error(`CSV parsing error: ${error.message}`));
      }
    });
  });
};

/**
 * Generate sample CSV template
 * @returns {string} - CSV template string
 */
const generateCSVTemplate = () => {
  const headers = ['name', 'email', 'password', 'role'];
  const sampleData = [
    ['John Doe', 'john.doe@example.com', 'password123', 'player'],
    ['Jane Smith', 'jane.smith@example.com', 'password123', 'player'],
    ['Admin User', 'admin@example.com', 'admin123', 'organiser']
  ];

  return Papa.unparse({
    fields: headers,
    data: sampleData
  });
};

/**
 * Export tournament data to CSV format
 * @param {Object} tournament - Tournament document
 * @param {Array} categories - Array of category documents
 * @param {Array} registrations - Array of registration documents
 * @param {Array} matches - Array of match documents
 * @returns {string} - CSV formatted string
 */
const exportTournamentData = async (tournament, categories, registrations, matches) => {
  const data = [];

  // Add tournament header information
  data.push({
    'Data Type': 'Tournament Info',
    'Tournament Name': tournament.name,
    'Tournament Code': tournament.code,
    'Start Date': tournament.startDate.toISOString().split('T')[0],
    'End Date': tournament.endDate.toISOString().split('T')[0],
    'Number of Courts': tournament.numberOfCourts,
    'Status': tournament.status
  });

  // Add empty row for separation
  data.push({});

  // Add registrations section
  data.push({
    'Data Type': 'Registrations',
    'Category': 'Category Name',
    'Player Name': 'Player Name',
    'Player Email': 'Player Email',
    'Team Name': 'Team Name',
    'Team Members': 'Team Members',
    'Registration Date': 'Registration Date'
  });

  for (const reg of registrations) {
    const category = categories.find(c => c._id.toString() === reg.categoryId.toString());
    const teamMembers = reg.isTeam ? reg.teamMembers.map(m => m.name).join('; ') : '';
    
    data.push({
      'Data Type': 'Registration',
      'Category': category?.name || 'Unknown',
      'Player Name': reg.playerId?.name || 'Unknown',
      'Player Email': reg.playerId?.email || 'Unknown',
      'Team Name': reg.teamName || '',
      'Team Members': teamMembers,
      'Registration Date': reg.createdAt ? new Date(reg.createdAt).toISOString().split('T')[0] : ''
    });
  }

  // Add empty row for separation
  data.push({});

  // Add matches section
  data.push({
    'Data Type': 'Matches',
    'Category': 'Category Name',
    'Stage': 'Stage Name',
    'Round': 'Round Name',
    'Match Number': 'Match #',
    'Player 1': 'Player 1',
    'Player 2': 'Player 2',
    'Date': 'Date',
    'Time': 'Time',
    'Court': 'Court',
    'Status': 'Status',
    'Score': 'Score',
    'Winner': 'Winner'
  });

  for (const match of matches) {
    const category = categories.find(c => c._id.toString() === match.categoryId.toString());
    const player1 = match.players[0]?.teamName || match.players[0]?.name || 'TBD';
    const player2 = match.players[1]?.teamName || match.players[1]?.name || 'TBD';
    
    // Format scores
    let scoreStr = '';
    if (match.scores && match.scores.length > 0) {
      scoreStr = match.scores.map(s => `${s.player1Score}-${s.player2Score}`).join(', ');
    }

    // Determine winner name
    let winnerName = '';
    if (match.winnerId) {
      const winnerPlayer = match.players.find(p => p.playerId.toString() === match.winnerId.toString());
      winnerName = winnerPlayer?.teamName || winnerPlayer?.name || 'Unknown';
    }

    data.push({
      'Data Type': 'Match',
      'Category': category?.name || 'Unknown',
      'Stage': match.stageName || '',
      'Round': match.roundName || '',
      'Match Number': match.matchNumber || '',
      'Player 1': player1,
      'Player 2': player2,
      'Date': match.schedule?.date ? new Date(match.schedule.date).toISOString().split('T')[0] : '',
      'Time': match.schedule?.time || '',
      'Court': match.schedule?.courtNumber || '',
      'Status': match.status,
      'Score': scoreStr,
      'Winner': winnerName
    });
  }

  return Papa.unparse(data);
};

/**
 * Export match results to CSV format
 * @param {Array} matches - Array of match documents with populated fields
 * @param {String} categoryName - Optional category name for filtering
 * @returns {string} - CSV formatted string
 */
const exportMatchResults = (matches, categoryName = null) => {
  const headers = [
    'Category',
    'Stage',
    'Round',
    'Match Number',
    'Player 1',
    'Player 2',
    'Date',
    'Time',
    'Court',
    'Status',
    'Set 1',
    'Set 2',
    'Set 3',
    'Winner'
  ];

  const data = matches.map(match => {
    const player1 = match.players[0]?.teamName || match.players[0]?.name || 'TBD';
    const player2 = match.players[1]?.teamName || match.players[1]?.name || 'TBD';
    
    // Extract individual set scores
    const set1 = match.scores[0] ? `${match.scores[0].player1Score}-${match.scores[0].player2Score}` : '';
    const set2 = match.scores[1] ? `${match.scores[1].player1Score}-${match.scores[1].player2Score}` : '';
    const set3 = match.scores[2] ? `${match.scores[2].player1Score}-${match.scores[2].player2Score}` : '';

    // Determine winner name
    let winnerName = '';
    if (match.winnerId) {
      const winnerPlayer = match.players.find(p => p.playerId.toString() === match.winnerId.toString());
      winnerName = winnerPlayer?.teamName || winnerPlayer?.name || 'Unknown';
    }

    return {
      'Category': match.categoryId?.name || categoryName || 'Unknown',
      'Stage': match.stageName || '',
      'Round': match.roundName || '',
      'Match Number': match.matchNumber || '',
      'Player 1': player1,
      'Player 2': player2,
      'Date': match.schedule?.date ? new Date(match.schedule.date).toISOString().split('T')[0] : '',
      'Time': match.schedule?.time || '',
      'Court': match.schedule?.courtNumber || '',
      'Status': match.status,
      'Set 1': set1,
      'Set 2': set2,
      'Set 3': set3,
      'Winner': winnerName
    };
  });

  return Papa.unparse({
    fields: headers,
    data
  });
};

/**
 * Export registrations to CSV format
 * @param {Array} registrations - Array of registration documents with populated fields
 * @returns {string} - CSV formatted string
 */
const exportRegistrations = (registrations) => {
  const headers = [
    'Category',
    'Player Name',
    'Player Email',
    'Is Team',
    'Team Name',
    'Team Members',
    'Status',
    'Registration Date'
  ];

  const data = registrations.map(reg => {
    const teamMembers = reg.isTeam && reg.teamMembers 
      ? reg.teamMembers.map(m => m.name).join('; ') 
      : '';

    return {
      'Category': reg.categoryId?.name || 'Unknown',
      'Player Name': reg.playerId?.name || 'Unknown',
      'Player Email': reg.playerId?.email || 'Unknown',
      'Is Team': reg.isTeam ? 'Yes' : 'No',
      'Team Name': reg.teamName || '',
      'Team Members': teamMembers,
      'Status': reg.status,
      'Registration Date': reg.createdAt ? new Date(reg.createdAt).toISOString().split('T')[0] : ''
    };
  });

  return Papa.unparse({
    fields: headers,
    data
  });
};

module.exports = {
  processPlayerCSV,
  validatePlayerData,
  generateCSVTemplate,
  exportTournamentData,
  exportMatchResults,
  exportRegistrations
};
