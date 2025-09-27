const axios = require('axios');

class MusicService {
  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3';
    
    if (!this.youtubeApiKey || this.youtubeApiKey === 'YOUR_VALID_YOUTUBE_API_KEY_HERE') {
      console.error('YouTube API key is missing or invalid. Please set YOUTUBE_API_KEY in .env file');
    }
  }

  // Search for music on YouTube - ONLY REAL API
  async searchMusic(query, maxResults = 20) {
    console.log('=== YOUTUBE API SEARCH ===');
    console.log('Query:', query);
    console.log('Max Results:', maxResults);
    
    if (!this.youtubeApiKey) {
      throw new Error('YouTube API key not found');
    }

    const response = await axios.get(`${this.youtubeBaseUrl}/search`, {
      params: {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults,
        key: this.youtubeApiKey
      }
    });

    console.log('YouTube API Response:', response.status);
    console.log('Results Count:', response.data.items?.length || 0);
    
    if (response.data.items && response.data.items.length > 0) {
      console.log('First result:', response.data.items[0].snippet.title);
    }

    return response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      thumbnail: item.snippet.thumbnails.medium.url,
      description: item.snippet.description,
      publishedAt: item.snippet.publishedAt,
      duration: null
    }));
  }

  // Get video details including duration
  async getVideoDetails(videoIds) {
    try {
      const ids = Array.isArray(videoIds) ? videoIds.join(',') : videoIds;
      
      const response = await axios.get(`${this.youtubeBaseUrl}/videos`, {
        params: {
          part: 'contentDetails,statistics',
          id: ids,
          key: this.youtubeApiKey
        }
      });

      return response.data.items.map(item => ({
        id: item.id,
        duration: this.parseDuration(item.contentDetails.duration),
        viewCount: item.statistics.viewCount,
        likeCount: item.statistics.likeCount
      }));
    } catch (error) {
      console.error('YouTube video details error:', error.response?.data || error.message);
      return [];
    }
  }

  // Parse YouTube duration format (PT4M13S) to seconds
  parseDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = (match[1] || '').replace('H', '') || 0;
    const minutes = (match[2] || '').replace('M', '') || 0;
    const seconds = (match[3] || '').replace('S', '') || 0;
    
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds);
  }

  // Format seconds to MM:SS or HH:MM:SS
  formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  // Search by artist
  async searchByArtist(artistName, maxResults = 20) {
    return this.searchMusic(`${artistName} songs`, maxResults);
  }

  // Search by genre
  async searchByGenre(genre, maxResults = 20) {
    return this.searchMusic(`${genre} music playlist`, maxResults);
  }

  // Get trending music
  async getTrendingMusic(maxResults = 20) {
    try {
      const response = await axios.get(`${this.youtubeBaseUrl}/videos`, {
        params: {
          part: 'snippet',
          chart: 'mostPopular',
          videoCategoryId: '10',
          regionCode: 'US',
          maxResults: maxResults,
          key: this.youtubeApiKey
        }
      });

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      console.error('YouTube trending error:', error.response?.data || error.message);
      
      // If quota exceeded, return mock data
      if (error.response?.status === 403) {
        console.log('YouTube API quota exceeded, returning mock trending data');
        return this.getMockTrendingData(maxResults);
      }
      
      throw error;
    }
  }

  // Mock trending data for when API quota is exceeded
  getMockTrendingData(maxResults = 20) {
    const mockSongs = [
      { title: 'Blinding Lights', artist: 'The Weeknd', id: 'mock1' },
      { title: 'Shape of You', artist: 'Ed Sheeran', id: 'mock2' },
      { title: 'Bad Habits', artist: 'Ed Sheeran', id: 'mock3' },
      { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', id: 'mock4' },
      { title: 'Good 4 U', artist: 'Olivia Rodrigo', id: 'mock5' },
      { title: 'Levitating', artist: 'Dua Lipa', id: 'mock6' },
      { title: 'Watermelon Sugar', artist: 'Harry Styles', id: 'mock7' },
      { title: 'Peaches', artist: 'Justin Bieber ft. Daniel Caesar & Giveon', id: 'mock8' },
      { title: 'Deja Vu', artist: 'Olivia Rodrigo', id: 'mock9' },
      { title: 'Montero', artist: 'Lil Nas X', id: 'mock10' },
      { title: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', id: 'mock11' },
      { title: 'Heat Waves', artist: 'Glass Animals', id: 'mock12' }
    ];

    return mockSongs.slice(0, maxResults).map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
      description: 'Mock trending song - API quota exceeded',
      publishedAt: new Date().toISOString()
    }));
  }

  // Get music recommendations based on a video
  async getRecommendations(videoId, maxResults = 10) {
    try {
      const videoResponse = await axios.get(`${this.youtubeBaseUrl}/videos`, {
        params: {
          part: 'snippet',
          id: videoId,
          key: this.youtubeApiKey
        }
      });

      if (!videoResponse.data.items.length) {
        throw new Error('Video not found');
      }

      const video = videoResponse.data.items[0];
      const searchQuery = `${video.snippet.title} ${video.snippet.channelTitle}`;
      
      return this.searchMusic(searchQuery, maxResults);
    } catch (error) {
      console.error('YouTube recommendations error:', error.response?.data || error.message);
      throw new Error('Failed to get recommendations');
    }
  }
}

module.exports = new MusicService();