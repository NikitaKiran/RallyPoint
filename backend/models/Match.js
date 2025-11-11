const mongoose = require('mongoose');

// Player subdocument schema for match participants
const matchPlayerSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player ID is required']
  },
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true
  },
  isTeam: {
    type: Boolean,
    default: false
  },
  teamName: {
    type: String,
    trim: true,
    default: null
  }
}, { _id: false });

// Score subdocument schema for set-by-set scoring
const scoreSchema = new mongoose.Schema({
  setNumber: {
    type: Number,
    required: [true, 'Set number is required'],
    min: [1, 'Set number must be at least 1']
  },
  player1Score: {
    type: Number,
    required: [true, 'Player 1 score is required'],
    min: [0, 'Score cannot be negative']
  },
  player2Score: {
    type: Number,
    required: [true, 'Player 2 score is required'],
    min: [0, 'Score cannot be negative']
  }
}, { _id: false });

// Schedule subdocument schema
const scheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: [true, 'Match date is required']
  },
  time: {
    type: String,
    trim: true,
    default: null
  },
  courtNumber: {
    type: Number,
    min: [1, 'Court number must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Court number must be an integer'
    },
    default: null
  }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: [true, 'Tournament ID is required']
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  stageName: {
    type: String,
    required: [true, 'Stage name is required'],
    trim: true
  },
  roundName: {
    type: String,
    trim: true,
    default: null
  },
  matchNumber: {
    type: Number,
    min: [1, 'Match number must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Match number must be an integer'
    },
    default: null
  },
  players: {
    type: [matchPlayerSchema],
    validate: {
      validator: function(players) {
        return players.length === 2;
      },
      message: 'Match must have exactly 2 players or teams'
    },
    required: [true, 'Players are required']
  },
  schedule: {
    type: scheduleSchema,
    required: [true, 'Schedule is required']
  },
  matchFormat: {
    type: String,
    trim: true,
    default: 'Best of 3'
  },
  scores: {
    type: [scoreSchema],
    default: []
  },
  winnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  status: {
    type: String,
    enum: {
      values: ['scheduled', 'ongoing', 'completed', 'walkover', 'cancelled'],
      message: 'Status must be scheduled, ongoing, completed, walkover, or cancelled'
    },
    default: 'scheduled'
  },
  // For knockout brackets - link to next match
  nextMatchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    default: null
  },
  // For knockout brackets - position in next match (1 or 2)
  nextMatchPosition: {
    type: Number,
    min: [1, 'Next match position must be 1 or 2'],
    max: [2, 'Next match position must be 1 or 2'],
    default: null
  },
  // For round robin - group identifier
  groupId: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
matchSchema.index({ categoryId: 1 });
matchSchema.index({ tournamentId: 1 });
matchSchema.index({ 'players.playerId': 1 });
matchSchema.index({ 'schedule.date': 1 });
matchSchema.index({ status: 1 });

// Instance method to update match status
matchSchema.methods.updateStatus = function(newStatus) {
  const validTransitions = {
    scheduled: ['ongoing', 'walkover', 'cancelled'],
    ongoing: ['completed', 'walkover', 'cancelled'],
    completed: [],
    walkover: [],
    cancelled: []
  };
  
  const allowedStatuses = validTransitions[this.status] || [];
  
  if (!allowedStatuses.includes(newStatus)) {
    throw new Error(`Cannot transition from ${this.status} to ${newStatus}`);
  }
  
  this.status = newStatus;
  return this;
};

// Instance method to set winner
matchSchema.methods.setWinner = function(playerId) {
  // Verify the playerId is one of the match participants
  const isParticipant = this.players.some(
    player => player.playerId.toString() === playerId.toString()
  );
  
  if (!isParticipant) {
    throw new Error('Winner must be one of the match participants');
  }
  
  this.winnerId = playerId;
  return this;
};

// Instance method to add score
matchSchema.methods.addScore = function(setNumber, player1Score, player2Score) {
  // Check if score for this set already exists
  const existingScoreIndex = this.scores.findIndex(s => s.setNumber === setNumber);
  
  if (existingScoreIndex >= 0) {
    // Update existing score
    this.scores[existingScoreIndex].player1Score = player1Score;
    this.scores[existingScoreIndex].player2Score = player2Score;
  } else {
    // Add new score
    this.scores.push({
      setNumber,
      player1Score,
      player2Score
    });
  }
  
  // Sort scores by set number
  this.scores.sort((a, b) => a.setNumber - b.setNumber);
  
  return this;
};

// Instance method to determine winner from scores
matchSchema.methods.determineWinnerFromScores = function() {
  if (this.scores.length === 0) {
    return null;
  }
  
  let player1Sets = 0;
  let player2Sets = 0;
  
  this.scores.forEach(score => {
    if (score.player1Score > score.player2Score) {
      player1Sets++;
    } else if (score.player2Score > score.player1Score) {
      player2Sets++;
    }
  });
  
  // Determine winner based on sets won
  if (player1Sets > player2Sets) {
    return this.players[0].playerId;
  } else if (player2Sets > player1Sets) {
    return this.players[1].playerId;
  }
  
  return null; // Draw or incomplete
};

// Static method to get matches for a player
matchSchema.statics.getPlayerMatches = async function(playerId) {
  return await this.find({
    'players.playerId': playerId
  })
  .populate('tournamentId', 'name code')
  .populate('categoryId', 'name')
  .sort({ 'schedule.date': 1 });
};

// Static method to get matches for a category
matchSchema.statics.getCategoryMatches = async function(categoryId) {
  return await this.find({ categoryId })
    .sort({ 'schedule.date': 1, 'schedule.courtNumber': 1 });
};

const Match = mongoose.model('Match', matchSchema);

module.exports = Match;
