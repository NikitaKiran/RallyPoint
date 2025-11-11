const mongoose = require('mongoose');

const tournamentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tournament name is required'],
    trim: true,
    minlength: [3, 'Tournament name must be at least 3 characters long']
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    length: 6,
    match: [/^[A-Z0-9]{6}$/, 'Tournament code must be 6 alphanumeric characters']
  },
  organiserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Organiser ID is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required']
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required'],
    validate: {
      validator: function(value) {
        return value >= this.startDate;
      },
      message: 'End date must be on or after start date'
    }
  },
  numberOfCourts: {
    type: Number,
    required: [true, 'Number of courts is required'],
    min: [1, 'Must have at least 1 court'],
    validate: {
      validator: Number.isInteger,
      message: 'Number of courts must be an integer'
    }
  },
  status: {
    type: String,
    enum: {
      values: ['upcoming', 'ongoing', 'completed'],
      message: 'Status must be upcoming, ongoing, or completed'
    },
    default: 'upcoming'
  }
}, {
  timestamps: true
});

// Create indexes
tournamentSchema.index({ code: 1 });
tournamentSchema.index({ organiserId: 1 });

// Static method to generate unique tournament code
tournamentSchema.statics.generateUniqueCode = async function() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code;
  let isUnique = false;
  
  while (!isUnique) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    
    // Check if code already exists
    const existingTournament = await this.findOne({ code });
    if (!existingTournament) {
      isUnique = true;
    }
  }
  
  return code;
};

const Tournament = mongoose.model('Tournament', tournamentSchema);

module.exports = Tournament;
