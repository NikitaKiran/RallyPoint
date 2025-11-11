const mongoose = require('mongoose');

// Stage subdocument schema
const stageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Stage name is required'],
    trim: true
  },
  format: {
    type: String,
    required: [true, 'Stage format is required'],
    enum: {
      values: ['knockout', 'round_robin', 'custom'],
      message: 'Format must be knockout, round_robin, or custom'
    }
  },
  groupCount: {
    type: Number,
    min: [1, 'Group count must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Group count must be an integer'
    },
    default: 1
  },
  advancementRules: {
    type: String,
    trim: true,
    default: ''
  },
  advanceCount: {
    type: Number,
    min: [1, 'Advance count must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Advance count must be an integer'
    },
    default: null // null means all players advance or it's the final stage
  }
}, { _id: true });

const categorySchema = new mongoose.Schema({
  tournamentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tournament',
    required: [true, 'Tournament ID is required']
  },
  name: {
    type: String,
    required: [true, 'Category name is required'],
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters long']
  },
  isTeamEvent: {
    type: Boolean,
    default: false
  },
  eligibilityCriteria: {
    type: String,
    trim: true,
    default: ''
  },
  registrationLimit: {
    type: Number,
    min: [1, 'Registration limit must be at least 1'],
    validate: {
      validator: Number.isInteger,
      message: 'Registration limit must be an integer'
    },
    default: null
  },
  cashPrize: {
    type: Number,
    min: [0, 'Cash prize cannot be negative'],
    default: 0
  },
  stages: {
    type: [stageSchema],
    default: []
  }
}, {
  timestamps: true
});

// Create compound index for efficient queries
categorySchema.index({ tournamentId: 1 });

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
