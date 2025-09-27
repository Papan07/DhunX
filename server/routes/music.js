const express = require('express');
const router = express.Router();
const musicService = require('../services/musicService');
const { optionalAuth } = require('../middleware/auth');

// @route   GET /api/music/search
// @desc    Search for music
// @access  Public
router.get('/search', optionalAuth, async (req, res) => {
  const axios = require('axios');
  const { q, limit = 20 } = req.query;
  
  if (!q || q.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Search query is required'
    });
  }

  try {
    if (!process.env.YOUTUBE_API_KEY || process.env.YOUTUBE_API_KEY === 'YOUR_VALID_YOUTUBE_API_KEY_HERE') {
      return res.status(500).json({
        success: false,
        message: 'YouTube API key is not configured. Please set a valid YOUTUBE_API_KEY in the .env file.'
      });
    }

    console.log('DIRECT YouTube API call for:', q);
    const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
      params: {
        part: 'snippet',
        q: q.trim(),
        type: 'video',
        maxResults: parseInt(limit),
        key: process.env.YOUTUBE_API_KEY
      }
    });

    const results = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt
    }));

    console.log('YouTube results:', results.length, 'First:', results[0]?.title);

    res.json({
      success: true,
      data: {
        query: q,
        results: results,
        total: results.length
      }
    });

  } catch (error) {
    console.error('YouTube API error:', error.response?.data || error.message);
    
    // If quota exceeded, return mock data
    if (error.response?.status === 403 && error.response?.data?.error?.message?.includes('quota')) {
      const mockResults = [
        {
          id: 'mock1',
          title: `${q} - Song 1`,
          artist: 'Artist 1',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          description: 'Mock result - API quota exceeded',
          publishedAt: new Date().toISOString()
        },
        {
          id: 'mock2', 
          title: `${q} - Song 2`,
          artist: 'Artist 2',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          description: 'Mock result - API quota exceeded',
          publishedAt: new Date().toISOString()
        }
      ];
      
      return res.json({
        success: true,
        data: {
          query: q,
          results: mockResults,
          total: mockResults.length,
          note: 'Using mock data - YouTube API quota exceeded'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'YouTube API failed: ' + (error.response?.data?.error?.message || error.message)
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

// @route   GET /api/music/recommendations
// @desc    Get 70-80 recommended songs that change on refresh
// @access  Public
router.get('/recommendations', optionalAuth, async (req, res) => {
  const axios = require('axios');
  
  try {
    console.log('Fetching recommendations using multiple searches...');
    
    const queries = [
      'bollywood hits', 'english songs', 'punjabi songs', 'hindi songs',
      'trending music', 'popular songs', 'top charts', 'viral songs',
      'love songs', 'party songs', 'sad songs', 'dance music',
      'rock music', 'pop songs', 'hip hop', 'classical music'
    ];
    
    const selectedQueries = queries.sort(() => Math.random() - 0.5).slice(0, 8);
    const allResults = [];
    
    for (const query of selectedQueries) {
      try {
        console.log(`Fetching: ${query}`);
        const response = await axios.get('https://www.googleapis.com/youtube/v3/search', {
          params: {
            part: 'snippet',
            q: query,
            type: 'video',
            maxResults: 12,
            key: process.env.YOUTUBE_API_KEY
          }
        });
        
        const results = response.data.items.map(item => ({
          id: item.id.videoId,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          thumbnail: item.snippet.thumbnails.medium.url,
          description: item.snippet.description,
          publishedAt: item.snippet.publishedAt
        }));
        
        allResults.push(...results);
        console.log(`Added ${results.length} songs from ${query}`);
      } catch (error) {
        console.error(`Error with ${query}:`, error.message);
      }
    }
    
    const uniqueResults = allResults.filter((item, index, self) => 
      index === self.findIndex(t => t.id === item.id)
    );
    
    const finalResults = uniqueResults.sort(() => Math.random() - 0.5);
    
    console.log(`Returning ${finalResults.length} recommendations`);
    
    res.json({
      success: true,
      data: {
        results: finalResults,
        total: finalResults.length
      }
    });
    
  } catch (error) {
    console.error('Recommendations error:', error);
    
    // If quota exceeded, return mock data
    if (error.response?.status === 403) {
      console.log('YouTube API quota exceeded, returning mock recommendations');
      const mockRecommendations = [
        { id: 'rec1', title: 'Trending Song 1', artist: 'Popular Artist 1', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', description: 'Mock recommendation', publishedAt: new Date().toISOString() },
        { id: 'rec2', title: 'Trending Song 2', artist: 'Popular Artist 2', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', description: 'Mock recommendation', publishedAt: new Date().toISOString() },
        { id: 'rec3', title: 'Trending Song 3', artist: 'Popular Artist 3', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg', description: 'Mock recommendation', publishedAt: new Date().toISOString() }
      ];
      
      return res.json({
        success: true,
        data: {
          results: mockRecommendations,
          total: mockRecommendations.length,
          note: 'Using mock data - YouTube API quota exceeded'
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to get recommendations'
    });
  }
});

module.exports = router;