import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    trim: true,
  },
  organizer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: Date,
    required: true,
  },
  endTime: {
    type: Date,
    required: true,
  },
  joinedUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

eventSchema.virtual('status').get(function() {
  const now = new Date();
  if (now < this.startTime) {
    return 'upcoming';
  } else if (now > this.endTime) {
    return 'ended';
  } else {
    return 'ongoing';
  }
});

eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

const Event = mongoose.model('Event', eventSchema);

export default Event;
