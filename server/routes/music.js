const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/music/search
// @desc    Search for music
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    
    if (!q || q.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    const results = await musicService.searchMusic(q.trim(), parseInt(limit));
    
    // Get video details for duration
    if (results.length > 0) {
      const videoIds = results.map(item => item.id);
      const videoDetails = await musicService.getVideoDetails(videoIds);
      
      // Merge duration data
      results.forEach(result => {
        const details = videoDetails.find(detail => detail.id === result.id);
        if (details) {
          result.duration = details.duration;
          result.durationFormatted = musicService.formatDuration(details.duration);
          result.viewCount = details.viewCount;
          result.likeCount = details.likeCount;
        }
      });
    }

    res.json({
      success: true,
      data: {
        query: q,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Music search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search music'
    });
  }
});

// @route   GET /api/music/trending
// @desc    Get trending music
// @access  Public
router.get('/trending', optionalAuth, async (req, res) => {
  try {
    console.log('Trending music route hit with limit:', req.query.limit);
    const { limit = 20 } = req.query;

    const results = await musicService.getTrendingMusic(parseInt(limit));
    console.log('Got results from musicService:', results.length);

    res.json({
      success: true,
      data: {
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Trending music route error:', error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get trending music'
    });
  }
});

// @route   GET /api/music/artist/:name
// @desc    Search music by artist
// @access  Public
router.get('/artist/:name', optionalAuth, async (req, res) => {
  try {
    const { name } = req.params;
    const { limit = 20 } = req.query;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Artist name is required'
      });
    }

    const results = await musicService.searchByArtist(name.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: {
        artist: name,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Artist search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search artist music'
    });
  }
});

// @route   GET /api/music/genre/:genre
// @desc    Search music by genre
// @access  Public
router.get('/genre/:genre', optionalAuth, async (req, res) => {
  try {
    const { genre } = req.params;
    const { limit = 20 } = req.query;
    
    if (!genre || genre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Genre is required'
      });
    }

    const results = await musicService.searchByGenre(genre.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: {
        genre: genre,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Genre search error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search genre music'
    });
  }
});

// @route   GET /api/music/recommendations/:videoId
// @desc    Get music recommendations based on a video
// @access  Public
router.get('/recommendations/:videoId', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;
    
    if (!videoId || videoId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    const results = await musicService.getRecommendations(videoId.trim(), parseInt(limit));
    
    res.json({
      success: true,
      data: {
        videoId: videoId,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('Recommendations error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

// @route   GET /api/music/video/:videoId
// @desc    Get detailed information about a specific video
// @access  Public
router.get('/video/:videoId', optionalAuth, async (req, res) => {
  try {
    const { videoId } = req.params;
    
    if (!videoId || videoId.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Video ID is required'
      });
    }

    const details = await musicService.getVideoDetails(videoId.trim());
    
    if (!details.length) {
      return res.status(404).json({
        success: false,
        message: 'Video not found'
      });
    }

    const videoDetail = details[0];
    videoDetail.durationFormatted = musicService.formatDuration(videoDetail.duration);

    res.json({
      success: true,
      data: videoDetail
    });

  } catch (error) {
    console.error('Video details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get video details'
    });
  }
});

module.exports = router;
