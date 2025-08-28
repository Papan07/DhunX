const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Playlist = require('../models/Playlist');
const Song = require('../models/Song');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/library/liked-songs
// @desc    Get user's liked songs
// @access  Private
router.get('/liked-songs', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('likedSongs');
    
    res.json({
      success: true,
      data: {
        songs: user.likedSongs,
        total: user.likedSongs.length
      }
    });

  } catch (error) {
    console.error('Get liked songs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get liked songs'
    });
  }
});

// @route   POST /api/library/liked-songs
// @desc    Add song to liked songs
// @access  Private
router.post('/liked-songs', authenticateToken, async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration } = req.body;

    if (!videoId || !title || !artist) {
      return res.status(400).json({
        success: false,
        message: 'Video ID, title, and artist are required'
      });
    }

    // Find or create the song
    const song = await Song.findOrCreate({
      videoId,
      title,
      artist,
      thumbnail,
      duration
    });

    // Check if already liked
    const user = await User.findById(req.user._id);
    if (user.likedSongs.includes(song._id)) {
      return res.status(400).json({
        success: false,
        message: 'Song already in liked songs'
      });
    }

    // Add to user's liked songs
    user.likedSongs.push(song._id);
    await user.save();

    // Increment song's like count
    await song.incrementLikeCount();

    res.json({
      success: true,
      message: 'Song added to liked songs',
      data: { song }
    });

  } catch (error) {
    console.error('Add liked song error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add song to liked songs'
    });
  }
});

// @route   DELETE /api/library/liked-songs/:videoId
// @desc    Remove song from liked songs
// @access  Private
router.delete('/liked-songs/:videoId', authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;

    const song = await Song.findOne({ videoId });
    if (!song) {
      return res.status(404).json({
        success: false,
        message: 'Song not found'
      });
    }

    const user = await User.findById(req.user._id);
    const songIndex = user.likedSongs.indexOf(song._id);
    
    if (songIndex === -1) {
      return res.status(400).json({
        success: false,
        message: 'Song not in liked songs'
      });
    }

    // Remove from user's liked songs
    user.likedSongs.splice(songIndex, 1);
    await user.save();

    // Decrement song's like count
    await song.decrementLikeCount();

    res.json({
      success: true,
      message: 'Song removed from liked songs'
    });

  } catch (error) {
    console.error('Remove liked song error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove song from liked songs'
    });
  }
});

// @route   GET /api/library/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/playlists', authenticateToken, async (req, res) => {
  try {
    const playlists = await Playlist.find({ owner: req.user._id })
      .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: {
        playlists,
        total: playlists.length
      }
    });

  } catch (error) {
    console.error('Get playlists error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get playlists'
    });
  }
});

// @route   POST /api/library/playlists
// @desc    Create new playlist
// @access  Private
router.post('/playlists', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPublic = false } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Playlist name is required'
      });
    }

    const playlist = new Playlist({
      name: name.trim(),
      description: description?.trim() || '',
      owner: req.user._id,
      isPublic
    });

    await playlist.save();

    // Add playlist to user's playlists
    const user = await User.findById(req.user._id);
    user.playlists.push(playlist._id);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'Playlist created successfully',
      data: { playlist }
    });

  } catch (error) {
    console.error('Create playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create playlist'
    });
  }
});

// @route   GET /api/library/playlists/:id
// @desc    Get specific playlist
// @access  Private
router.get('/playlists/:id', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    res.json({
      success: true,
      data: { playlist }
    });

  } catch (error) {
    console.error('Get playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get playlist'
    });
  }
});

// @route   PUT /api/library/playlists/:id
// @desc    Update playlist
// @access  Private
router.put('/playlists/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, isPublic } = req.body;

    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    if (name) playlist.name = name.trim();
    if (description !== undefined) playlist.description = description.trim();
    if (isPublic !== undefined) playlist.isPublic = isPublic;

    await playlist.save();

    res.json({
      success: true,
      message: 'Playlist updated successfully',
      data: { playlist }
    });

  } catch (error) {
    console.error('Update playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update playlist'
    });
  }
});

// @route   DELETE /api/library/playlists/:id
// @desc    Delete playlist
// @access  Private
router.delete('/playlists/:id', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    await Playlist.findByIdAndDelete(req.params.id);

    // Remove from user's playlists
    const user = await User.findById(req.user._id);
    user.playlists.pull(req.params.id);
    await user.save();

    res.json({
      success: true,
      message: 'Playlist deleted successfully'
    });

  } catch (error) {
    console.error('Delete playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete playlist'
    });
  }
});

// @route   POST /api/library/playlists/:id/songs
// @desc    Add song to playlist
// @access  Private
router.post('/playlists/:id/songs', authenticateToken, async (req, res) => {
  try {
    const { videoId, title, artist, thumbnail, duration } = req.body;

    if (!videoId || !title || !artist) {
      return res.status(400).json({
        success: false,
        message: 'Video ID, title, and artist are required'
      });
    }

    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    // Check if song already exists in playlist
    const existingSong = playlist.songs.find(song => song.videoId === videoId);
    if (existingSong) {
      return res.status(400).json({
        success: false,
        message: 'Song already in playlist'
      });
    }

    // Add song to playlist
    playlist.songs.push({
      videoId,
      title,
      artist,
      thumbnail,
      duration
    });

    await playlist.save();

    res.json({
      success: true,
      message: 'Song added to playlist',
      data: { playlist }
    });

  } catch (error) {
    console.error('Add song to playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add song to playlist'
    });
  }
});

// @route   DELETE /api/library/playlists/:id/songs/:videoId
// @desc    Remove song from playlist
// @access  Private
router.delete('/playlists/:id/songs/:videoId', authenticateToken, async (req, res) => {
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!playlist) {
      return res.status(404).json({
        success: false,
        message: 'Playlist not found'
      });
    }

    const songIndex = playlist.songs.findIndex(song => song.videoId === req.params.videoId);
    if (songIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Song not found in playlist'
      });
    }

    playlist.songs.splice(songIndex, 1);
    await playlist.save();

    res.json({
      success: true,
      message: 'Song removed from playlist',
      data: { playlist }
    });

  } catch (error) {
    console.error('Remove song from playlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove song from playlist'
    });
  }
});

module.exports = router;
