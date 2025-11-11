const mongoose = require('mongoose');

// Team member subdocument schema
const teamMemberSchema = new mongoose.Schema({
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Make optional - team members might not have accounts
    default: null
  },
  name: {
    type: String,
    required: [true, 'Player name is required'],
    trim: true
  }
}, { _id: false });

const registrationSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category ID is required']
  },
  playerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Player ID is required']
  },
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: [true, 'Tournament ID is required']
  },
  // Team event fields
  isTeam: {
    type: Boolean,
    default: false
  },
  teamName: {
    type: String,
    trim: true,
    default: null
  },
  teamMembers: {
    type: [teamMemberSchema],
    default: []
  },
  status: {
    type: String,
    enum: {
      values: ['pending', 'approved', 'rejected'],
      message: 'Status must be pending, approved, or rejected'
    },
    default: 'approved'
  }
}, {
  timestamps: true
});

// Create compound unique index to prevent duplicate registrations
registrationSchema.index({ categoryId: 1, playerId: 1 }, { unique: true });

// Create additional indexes for efficient queries
registrationSchema.index({ tournamentId: 1 });
registrationSchema.index({ playerId: 1 });

// Static method to check if registration limit is reached for a category
registrationSchema.statics.checkRegistrationLimit = async function(categoryId) {
  const Category = mongoose.model('Category');
  
  // Get the category to check the limit
  const category = await Category.findById(categoryId);
  
  if (!category) {
    throw new Error('Category not found');
  }
  
  // If no limit is set, registration is allowed
  if (!category.registrationLimit) {
    return { allowed: true, current: 0, limit: null };
  }
  
  // Count current registrations
  const currentCount = await this.countDocuments({ categoryId });
  
  // Check if limit is reached
  const allowed = currentCount < category.registrationLimit;
  
  return {
    allowed,
    current: currentCount,
    limit: category.registrationLimit
  };
};

// Instance method to check if this registration is for a team event
registrationSchema.methods.isTeamRegistration = function() {
  return this.isTeam && this.teamName && this.teamMembers.length > 0;
};

// Static method to get registration count for a category
registrationSchema.statics.getRegistrationCount = async function(categoryId) {
  return await this.countDocuments({ categoryId });
};

const Registration = mongoose.model('Registration', registrationSchema);

module.exports = Registration;
