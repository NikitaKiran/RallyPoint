const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
  matchId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Match',
    required: [true, 'Match ID is required']
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player ID is required']
  },
  type: {
    type: String,
    required: [true, 'Request type is required'],
    enum: {
      values: ['reschedule', 'walkover'],
      message: 'Request type must be reschedule or walkover'
    }
  },
  status: {
    type: String,
    required: [true, 'Request status is required'],
    enum: {
      values: ['pending', 'accepted', 'rejected'],
      message: 'Request status must be pending, accepted, or rejected'
    },
    default: 'pending'
  },
  note: {
    type: String,
    trim: true,
    default: null
  }
}, {
  timestamps: true
});

// Create indexes for efficient queries
requestSchema.index({ matchId: 1 });
requestSchema.index({ status: 1 });
requestSchema.index({ playerId: 1 });

// Instance method to accept request
requestSchema.methods.accept = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be accepted');
  }
  this.status = 'accepted';
  return this;
};

// Instance method to reject request
requestSchema.methods.reject = function() {
  if (this.status !== 'pending') {
    throw new Error('Only pending requests can be rejected');
  }
  this.status = 'rejected';
  return this;
};

// Static method to get requests for a tournament
requestSchema.statics.getTournamentRequests = async function(tournamentId) {
  return await this.find()
    .populate({
      path: 'matchId',
      match: { tournamentId: tournamentId },
      populate: [
        { path: 'tournamentId', select: 'name code' },
        { path: 'categoryId', select: 'name' }
      ]
    })
    .populate('playerId', 'name email')
    .sort({ createdAt: -1 });
};

// Static method to get pending requests for a tournament
requestSchema.statics.getPendingTournamentRequests = async function(tournamentId) {
  const requests = await this.getTournamentRequests(tournamentId);
  return requests.filter(req => req.matchId && req.status === 'pending');
};

const Request = mongoose.model('Request', requestSchema);

module.exports = Request;
