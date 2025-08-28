const mongoose = require('mongoose');

const songSchema = new mongoose.Schema({
  videoId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  artist: {
    type: String,
    required: true,
    trim: true
  },
  thumbnail: {
    type: String,
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  duration: {
    type: Number // in seconds
  },
  viewCount: {
    type: Number,
    default: 0
  },
  likeCount: {
    type: Number,
    default: 0
  },
  publishedAt: {
    type: Date
  },
  genre: {
    type: String,
    trim: true
  },
  // Track how many users have liked this song
  totalLikes: {
    type: Number,
    default: 0
  },
  // Track how many times this song has been played
  totalPlays: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
songSchema.index({ videoId: 1 });
songSchema.index({ title: 1 });
songSchema.index({ artist: 1 });
songSchema.index({ genre: 1 });
songSchema.index({ totalLikes: -1 });
songSchema.index({ totalPlays: -1 });

// Virtual for formatted duration
songSchema.virtual('formattedDuration').get(function() {
  if (!this.duration) return '0:00';
  
  const minutes = Math.floor(this.duration / 60);
  const seconds = this.duration % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
});

// Static method to find or create song
songSchema.statics.findOrCreate = async function(songData) {
  let song = await this.findOne({ videoId: songData.videoId });
  
  if (!song) {
    song = new this(songData);
    await song.save();
  } else {
    // Update song data if it exists
    Object.assign(song, songData);
    await song.save();
  }
  
  return song;
};

// Method to increment play count
songSchema.methods.incrementPlayCount = async function() {
  this.totalPlays += 1;
  return this.save();
};

// Method to increment like count
songSchema.methods.incrementLikeCount = async function() {
  this.totalLikes += 1;
  return this.save();
};

// Method to decrement like count
songSchema.methods.decrementLikeCount = async function() {
  if (this.totalLikes > 0) {
    this.totalLikes -= 1;
  }
  return this.save();
};

// Ensure virtuals are included in JSON output
songSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Song', songSchema);
