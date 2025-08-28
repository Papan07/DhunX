const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  songs: [{
    videoId: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    artist: {
      type: String,
      required: true
    },
    thumbnail: {
      type: String,
      required: true
    },
    duration: {
      type: Number // in seconds
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  coverImage: {
    type: String,
    default: ''
  },
  tags: [{
    type: String,
    trim: true
  }],
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  totalDuration: {
    type: Number,
    default: 0 // in seconds
  }
}, {
  timestamps: true
});

// Index for better query performance
playlistSchema.index({ owner: 1 });
playlistSchema.index({ name: 1, owner: 1 });
playlistSchema.index({ isPublic: 1 });

// Calculate total duration before saving
playlistSchema.pre('save', function(next) {
  if (this.isModified('songs')) {
    this.totalDuration = this.songs.reduce((total, song) => {
      return total + (song.duration || 0);
    }, 0);
  }
  next();
});

// Virtual for formatted duration
playlistSchema.virtual('formattedDuration').get(function() {
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
});

// Virtual for song count
playlistSchema.virtual('songCount').get(function() {
  return this.songs.length;
});

// Ensure virtuals are included in JSON output
playlistSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Playlist', playlistSchema);
