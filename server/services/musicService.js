const axios = require('axios');

class MusicService {
  constructor() {
    this.youtubeApiKey = process.env.YOUTUBE_API_KEY;
    this.youtubeBaseUrl = 'https://www.googleapis.com/youtube/v3';
  }

  // Search for music on YouTube
  async searchMusic(query, maxResults = 20) {
    try {
      // Fallback to mock data if API key is restricted or missing
      if (!this.youtubeApiKey || process.env.USE_MOCK_DATA === 'true') {
        console.log('Using mock search data for query:', query);
        return this.getMockSearchData(query, maxResults);
      }

      const response = await axios.get(`${this.youtubeBaseUrl}/search`, {
        params: {
          part: 'snippet',
          q: query + ' music',
          type: 'video',
          videoCategoryId: '10', // Music category
          maxResults: maxResults,
          key: this.youtubeApiKey,
          order: 'relevance'
        },
        headers: {
          'Referer': process.env.FRONTEND_URL || 'http://localhost:5175'
        }
      });

      return response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        duration: null // Will be fetched separately if needed
      }));
    } catch (error) {
      console.error('YouTube search error:', error.response?.data || error.message);
      console.log('Falling back to mock search data for query:', query);
      return this.getMockSearchData(query, maxResults);
    }
  }

  // Mock search data for development/fallback
  getMockSearchData(query, maxResults = 20) {
    const mockSearchResults = [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        artist: 'Rick Astley',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        description: 'The official video for "Never Gonna Give You Up" by Rick Astley',
        publishedAt: '2009-10-25T06:57:33Z',
        duration: null
      },
      {
        id: '9bZkp7q19f0',
        title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        artist: 'officialpsy',
        thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
        description: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        publishedAt: '2012-07-15T08:34:21Z',
        duration: null
      },
      {
        id: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        artist: 'LuisFonsiVEVO',
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
        description: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        publishedAt: '2017-01-12T19:06:32Z',
        duration: null
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
        artist: 'Queen Official',
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
        description: 'Bohemian Rhapsody by Queen',
        publishedAt: '2008-08-01T15:53:05Z',
        duration: null
      },
      {
        id: 'YQHsXMglC9A',
        title: 'Adele - Hello (Official Music Video)',
        artist: 'Adele',
        thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg',
        description: 'Adele - Hello (Official Music Video)',
        publishedAt: '2015-10-22T15:00:07Z',
        duration: null
      },
      {
        id: 'JGwWNGJdvx8',
        title: 'Ed Sheeran - Shape of You (Official Video)',
        artist: 'Ed Sheeran',
        thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
        description: 'Ed Sheeran - Shape of You (Official Video)',
        publishedAt: '2017-01-30T10:00:07Z',
        duration: null
      },
      {
        id: 'RgKAFK5djSk',
        title: 'Wiz Khalifa - See You Again ft. Charlie Puth [Official Video]',
        artist: 'Wiz Khalifa',
        thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg',
        description: 'Wiz Khalifa - See You Again ft. Charlie Puth',
        publishedAt: '2015-04-06T20:07:40Z',
        duration: null
      },
      {
        id: 'CevxZvSJLk8',
        title: 'Katy Perry - Roar (Official)',
        artist: 'Katy Perry',
        thumbnail: 'https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg',
        description: 'Katy Perry - Roar (Official)',
        publishedAt: '2013-09-05T15:00:07Z',
        duration: null
      }
    ];

    // Filter results based on query (simple contains check)
    const filtered = mockSearchResults.filter(item =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.artist.toLowerCase().includes(query.toLowerCase())
    );

    // If no matches, return all results (simulating broad search)
    const results = filtered.length > 0 ? filtered : mockSearchResults;

    return results.slice(0, Math.min(maxResults, results.length));
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
        },
        headers: {
          'Referer': process.env.FRONTEND_URL || 'http://localhost:5175'
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
      throw new Error('Failed to get video details');
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
      console.log('Fetching trending music with API key:', this.youtubeApiKey ? 'Present' : 'Missing');

      // Temporary fallback to mock data due to API key restrictions
      if (!this.youtubeApiKey || process.env.USE_MOCK_DATA === 'true') {
        console.log('Using mock trending data');
        return this.getMockTrendingData(maxResults);
      }

      const response = await axios.get(`${this.youtubeBaseUrl}/videos`, {
        params: {
          part: 'snippet',
          chart: 'mostPopular',
          videoCategoryId: '10', // Music category
          regionCode: 'US',
          maxResults: maxResults,
          key: this.youtubeApiKey
        },
        headers: {
          'Referer': process.env.FRONTEND_URL || 'http://localhost:5175'
        }
      });

      console.log('YouTube API response received, items count:', response.data.items?.length || 0);

      return response.data.items.map(item => ({
        id: item.id,
        title: item.snippet.title,
        artist: item.snippet.channelTitle,
        thumbnail: item.snippet.thumbnails.medium.url,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt
      }));
    } catch (error) {
      console.error('YouTube trending error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        params: error.config?.params
      });

      // Fallback to mock data if API fails
      console.log('Falling back to mock trending data due to API error');
      return this.getMockTrendingData(maxResults);
    }
  }

  // Mock trending data for development/fallback
  getMockTrendingData(maxResults = 20) {
    const mockData = [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Rick Astley - Never Gonna Give You Up (Official Video)',
        artist: 'Rick Astley',
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
        description: 'The official video for "Never Gonna Give You Up" by Rick Astley',
        publishedAt: '2009-10-25T06:57:33Z'
      },
      {
        id: '9bZkp7q19f0',
        title: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        artist: 'officialpsy',
        thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
        description: 'PSY - GANGNAM STYLE(강남스타일) M/V',
        publishedAt: '2012-07-15T08:34:21Z'
      },
      {
        id: 'kJQP7kiw5Fk',
        title: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        artist: 'LuisFonsiVEVO',
        thumbnail: 'https://i.ytimg.com/vi/kJQP7kiw5Fk/mqdefault.jpg',
        description: 'Luis Fonsi - Despacito ft. Daddy Yankee',
        publishedAt: '2017-01-12T19:06:32Z'
      },
      {
        id: 'fJ9rUzIMcZQ',
        title: 'Queen – Bohemian Rhapsody (Official Video Remastered)',
        artist: 'Queen Official',
        thumbnail: 'https://i.ytimg.com/vi/fJ9rUzIMcZQ/mqdefault.jpg',
        description: 'Bohemian Rhapsody by Queen',
        publishedAt: '2008-08-01T15:53:05Z'
      },
      {
        id: 'YQHsXMglC9A',
        title: 'Adele - Hello (Official Music Video)',
        artist: 'Adele',
        thumbnail: 'https://i.ytimg.com/vi/YQHsXMglC9A/mqdefault.jpg',
        description: 'Adele - Hello (Official Music Video)',
        publishedAt: '2015-10-22T15:00:07Z'
      },
      {
        id: 'JGwWNGJdvx8',
        title: 'Ed Sheeran - Shape of You (Official Video)',
        artist: 'Ed Sheeran',
        thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/mqdefault.jpg',
        description: 'Ed Sheeran - Shape of You (Official Video)',
        publishedAt: '2017-01-30T10:00:07Z'
      },
      {
        id: 'RgKAFK5djSk',
        title: 'Wiz Khalifa - See You Again ft. Charlie Puth [Official Video]',
        artist: 'Wiz Khalifa',
        thumbnail: 'https://i.ytimg.com/vi/RgKAFK5djSk/mqdefault.jpg',
        description: 'Wiz Khalifa - See You Again ft. Charlie Puth',
        publishedAt: '2015-04-06T20:07:40Z'
      },
      {
        id: 'CevxZvSJLk8',
        title: 'Katy Perry - Roar (Official)',
        artist: 'Katy Perry',
        thumbnail: 'https://i.ytimg.com/vi/CevxZvSJLk8/mqdefault.jpg',
        description: 'Katy Perry - Roar (Official)',
        publishedAt: '2013-09-05T15:00:07Z'
      },
      {
        id: 'hT_nvWreIhg',
        title: 'OneRepublic - Counting Stars (Official Music Video)',
        artist: 'OneRepublic',
        thumbnail: 'https://i.ytimg.com/vi/hT_nvWreIhg/mqdefault.jpg',
        description: 'OneRepublic - Counting Stars',
        publishedAt: '2013-05-31T16:00:07Z'
      },
      {
        id: 'pRpeEdMmmQ0',
        title: 'Shakira - Waka Waka (This Time for Africa)',
        artist: 'Shakira',
        thumbnail: 'https://i.ytimg.com/vi/pRpeEdMmmQ0/mqdefault.jpg',
        description: 'Shakira - Waka Waka (This Time for Africa)',
        publishedAt: '2010-06-04T22:07:31Z'
      }
    ];

    return mockData.slice(0, Math.min(maxResults, mockData.length));
  }

  // Get music recommendations based on a video
  async getRecommendations(videoId, maxResults = 10) {
    try {
      // Get video details first
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
      
      // Search for similar content
      return this.searchMusic(searchQuery, maxResults);
    } catch (error) {
      console.error('YouTube recommendations error:', error.response?.data || error.message);
      throw new Error('Failed to get recommendations');
    }
  }
}

module.exports = new MusicService();
