import axios from 'axios';

class UserHistoryService {
  constructor() {
    this.localStorageKey = 'dhunx_user_history';
    this.sessionData = {
      plays: [],
      likes: [],
      skips: [],
      searches: [],
      sessionStart: Date.now()
    };
    this.initializeHistory();
  }

  initializeHistory() {
    // Load existing history from localStorage
    const existingHistory = this.getLocalHistory();
    if (existingHistory) {
      this.sessionData = { ...this.sessionData, ...existingHistory };
    }
  }

  getLocalHistory() {
    try {
      const history = localStorage.getItem(this.localStorageKey);
      return history ? JSON.parse(history) : null;
    } catch (error) {
      console.error('Error loading user history from localStorage:', error);
      return null;
    }
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.sessionData));
    } catch (error) {
      console.error('Error saving user history to localStorage:', error);
    }
  }

  async syncWithServer() {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await axios.post('http://localhost:5000/api/user/history/sync', {
        history: this.sessionData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (error) {
      console.error('Error syncing history with server:', error);
    }
  }

  // Track when a user plays a song
  trackPlay(track, duration = 0) {
    const playEvent = {
      id: track.id || track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      timestamp: Date.now(),
      duration: duration,
      source: 'home' // could be 'search', 'playlist', etc.
    };

    this.sessionData.plays.push(playEvent);
    
    // Keep only last 100 plays to manage storage
    if (this.sessionData.plays.length > 100) {
      this.sessionData.plays = this.sessionData.plays.slice(-100);
    }

    this.saveToLocalStorage();
    this.debouncedSync();
  }

  // Track when a user likes a song
  trackLike(track) {
    const likeEvent = {
      id: track.id || track.videoId,
      title: track.title,
      artist: track.artist,
      thumbnail: track.thumbnail,
      timestamp: Date.now(),
      action: 'like'
    };

    this.sessionData.likes.push(likeEvent);
    
    // Keep only last 50 likes
    if (this.sessionData.likes.length > 50) {
      this.sessionData.likes = this.sessionData.likes.slice(-50);
    }

    this.saveToLocalStorage();
    this.debouncedSync();
  }

  // Track when a user skips a song
  trackSkip(track, playDuration = 0) {
    const skipEvent = {
      id: track.id || track.videoId,
      title: track.title,
      artist: track.artist,
      timestamp: Date.now(),
      playDuration: playDuration
    };

    this.sessionData.skips.push(skipEvent);
    
    // Keep only last 50 skips
    if (this.sessionData.skips.length > 50) {
      this.sessionData.skips = this.sessionData.skips.slice(-50);
    }

    this.saveToLocalStorage();
    this.debouncedSync();
  }

  // Track search queries for better recommendations
  trackSearch(query, results = []) {
    const searchEvent = {
      query: query.toLowerCase(),
      timestamp: Date.now(),
      resultCount: results.length,
      topResults: results.slice(0, 3).map(r => ({
        id: r.id,
        title: r.title,
        artist: r.artist
      }))
    };

    this.sessionData.searches.push(searchEvent);
    
    // Keep only last 20 searches
    if (this.sessionData.searches.length > 20) {
      this.sessionData.searches = this.sessionData.searches.slice(-20);
    }

    this.saveToLocalStorage();
    this.debouncedSync();
  }

  // Get user preferences based on history
  getUserPreferences() {
    const preferences = {
      favoriteArtists: this.getFavoriteArtists(),
      favoriteGenres: this.getFavoriteGenres(),
      listeningPatterns: this.getListeningPatterns(),
      recentlyPlayed: this.getRecentlyPlayed(),
      skipPatterns: this.getSkipPatterns()
    };

    return preferences;
  }

  getFavoriteArtists() {
    const artistCounts = {};
    
    // Count plays and likes by artist
    [...this.sessionData.plays, ...this.sessionData.likes].forEach(event => {
      if (event.artist) {
        artistCounts[event.artist] = (artistCounts[event.artist] || 0) + 1;
      }
    });

    // Sort by count and return top 10
    return Object.entries(artistCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([artist, count]) => ({ artist, count }));
  }

  getFavoriteGenres() {
    // This would need genre detection or API integration
    // For now, return empty array
    return [];
  }

  getListeningPatterns() {
    const now = new Date();
    const patterns = {
      timeOfDay: {},
      dayOfWeek: {},
      averageSessionLength: 0
    };

    this.sessionData.plays.forEach(play => {
      const date = new Date(play.timestamp);
      const hour = date.getHours();
      const day = date.getDay();

      // Time of day patterns
      const timeSlot = hour < 6 ? 'night' : 
                     hour < 12 ? 'morning' : 
                     hour < 18 ? 'afternoon' : 'evening';
      patterns.timeOfDay[timeSlot] = (patterns.timeOfDay[timeSlot] || 0) + 1;

      // Day of week patterns
      const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day];
      patterns.dayOfWeek[dayName] = (patterns.dayOfWeek[dayName] || 0) + 1;
    });

    return patterns;
  }

  getRecentlyPlayed() {
    return this.sessionData.plays
      .slice(-10)
      .reverse()
      .map(play => ({
        id: play.id,
        title: play.title,
        artist: play.artist,
        thumbnail: play.thumbnail,
        timestamp: play.timestamp
      }));
  }

  getSkipPatterns() {
    const skipReasons = {
      quickSkips: 0, // skipped within 10 seconds
      midSkips: 0,   // skipped between 10-60 seconds
      lateSkips: 0   // skipped after 60 seconds
    };

    this.sessionData.skips.forEach(skip => {
      if (skip.playDuration < 10000) {
        skipReasons.quickSkips++;
      } else if (skip.playDuration < 60000) {
        skipReasons.midSkips++;
      } else {
        skipReasons.lateSkips++;
      }
    });

    return skipReasons;
  }

  // Debounced sync to avoid too many server calls
  debouncedSync = this.debounce(() => {
    this.syncWithServer();
  }, 5000);

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Clear all history (for privacy)
  clearHistory() {
    this.sessionData = {
      plays: [],
      likes: [],
      skips: [],
      searches: [],
      sessionStart: Date.now()
    };
    localStorage.removeItem(this.localStorageKey);
  }

  // Get history summary for display
  getHistorySummary() {
    return {
      totalPlays: this.sessionData.plays.length,
      totalLikes: this.sessionData.likes.length,
      totalSkips: this.sessionData.skips.length,
      totalSearches: this.sessionData.searches.length,
      sessionStart: this.sessionData.sessionStart,
      favoriteArtists: this.getFavoriteArtists().slice(0, 5)
    };
  }
}

// Create singleton instance
const userHistoryService = new UserHistoryService();

export default userHistoryService;
