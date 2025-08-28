import axios from 'axios';
import userHistoryService from './userHistoryService';

class RecommendationEngine {
  constructor() {
    this.apiBaseUrl = 'http://localhost:5000/api/music';
    this.weights = {
      recentPlays: 0.3,
      likedSongs: 0.4,
      favoriteArtists: 0.2,
      timeOfDay: 0.1
    };
  }

  async getPersonalizedRecommendations(limit = 12) {
    try {
      const userPreferences = userHistoryService.getUserPreferences();
      const recommendations = [];

      // Strategy 1: Artist-based recommendations
      const artistRecommendations = await this.getArtistBasedRecommendations(
        userPreferences.favoriteArtists,
        Math.ceil(limit * 0.4)
      );
      recommendations.push(...artistRecommendations);

      // Strategy 2: Similar songs to recently played
      const similarRecommendations = await this.getSimilarSongRecommendations(
        userPreferences.recentlyPlayed,
        Math.ceil(limit * 0.3)
      );
      recommendations.push(...similarRecommendations);

      // Strategy 3: Time-based recommendations
      const timeBasedRecommendations = await this.getTimeBasedRecommendations(
        userPreferences.listeningPatterns,
        Math.ceil(limit * 0.2)
      );
      recommendations.push(...timeBasedRecommendations);

      // Strategy 4: Trending songs (fallback)
      if (recommendations.length < limit) {
        const trendingRecommendations = await this.getTrendingRecommendations(
          limit - recommendations.length
        );
        recommendations.push(...trendingRecommendations);
      }

      // Remove duplicates and shuffle
      const uniqueRecommendations = this.removeDuplicates(recommendations);
      return this.shuffleArray(uniqueRecommendations).slice(0, limit);

    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return this.getFallbackRecommendations(limit);
    }
  }

  async getArtistBasedRecommendations(favoriteArtists, limit) {
    if (!favoriteArtists || favoriteArtists.length === 0) {
      return [];
    }

    const recommendations = [];
    
    for (const { artist } of favoriteArtists.slice(0, 3)) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/search`, {
          params: { 
            q: `${artist} songs`,
            limit: Math.ceil(limit / 3)
          }
        });

        if (response.data.success && response.data.data.results) {
          recommendations.push(...response.data.data.results);
        }
      } catch (error) {
        console.error(`Error fetching recommendations for artist ${artist}:`, error);
      }
    }

    return recommendations;
  }

  async getSimilarSongRecommendations(recentlyPlayed, limit) {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return [];
    }

    const recommendations = [];
    
    // Use the most recent 3 songs to find similar content
    for (const song of recentlyPlayed.slice(0, 3)) {
      try {
        // Search for similar songs by combining artist and genre-like terms
        const searchQueries = [
          `${song.artist} similar songs`,
          `songs like ${song.title}`,
          `${song.artist} best tracks`
        ];

        for (const query of searchQueries) {
          const response = await axios.get(`${this.apiBaseUrl}/search`, {
            params: { 
              q: query,
              limit: Math.ceil(limit / 6) // Distribute across queries
            }
          });

          if (response.data.success && response.data.data.results) {
            recommendations.push(...response.data.data.results);
          }
        }
      } catch (error) {
        console.error(`Error fetching similar songs for ${song.title}:`, error);
      }
    }

    return recommendations;
  }

  async getTimeBasedRecommendations(listeningPatterns, limit) {
    const currentHour = new Date().getHours();
    let moodQuery = 'chill music'; // default

    // Determine mood based on time of day
    if (currentHour >= 6 && currentHour < 12) {
      moodQuery = 'morning energy music';
    } else if (currentHour >= 12 && currentHour < 17) {
      moodQuery = 'afternoon focus music';
    } else if (currentHour >= 17 && currentHour < 22) {
      moodQuery = 'evening relaxing music';
    } else {
      moodQuery = 'late night chill music';
    }

    try {
      const response = await axios.get(`${this.apiBaseUrl}/search`, {
        params: { 
          q: moodQuery,
          limit: limit
        }
      });

      if (response.data.success && response.data.data.results) {
        return response.data.data.results;
      }
    } catch (error) {
      console.error('Error fetching time-based recommendations:', error);
    }

    return [];
  }

  async getTrendingRecommendations(limit) {
    try {
      const response = await axios.get(`${this.apiBaseUrl}/trending`, {
        params: { limit }
      });

      if (response.data.success && response.data.data.results) {
        return response.data.data.results;
      }
    } catch (error) {
      console.error('Error fetching trending recommendations:', error);
    }

    return [];
  }

  async getFallbackRecommendations(limit) {
    // Fallback to popular searches when personalization fails
    const fallbackQueries = [
      'popular songs 2024',
      'trending music',
      'top hits',
      'viral songs',
      'best music'
    ];

    const recommendations = [];

    for (const query of fallbackQueries) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/search`, {
          params: { 
            q: query,
            limit: Math.ceil(limit / fallbackQueries.length)
          }
        });

        if (response.data.success && response.data.data.results) {
          recommendations.push(...response.data.data.results);
        }
      } catch (error) {
        console.error(`Error with fallback query ${query}:`, error);
      }
    }

    return recommendations.slice(0, limit);
  }

  removeDuplicates(recommendations) {
    const seen = new Set();
    return recommendations.filter(song => {
      const key = `${song.id}-${song.title}-${song.artist}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  // Get recommendations for a specific context
  async getContextualRecommendations(context, limit = 8) {
    const contextQueries = {
      workout: ['workout music', 'gym songs', 'high energy music'],
      study: ['study music', 'focus music', 'concentration songs'],
      party: ['party music', 'dance songs', 'upbeat music'],
      relax: ['relaxing music', 'chill songs', 'calm music'],
      sleep: ['sleep music', 'peaceful songs', 'ambient music']
    };

    const queries = contextQueries[context] || contextQueries.relax;
    const recommendations = [];

    for (const query of queries) {
      try {
        const response = await axios.get(`${this.apiBaseUrl}/search`, {
          params: { 
            q: query,
            limit: Math.ceil(limit / queries.length)
          }
        });

        if (response.data.success && response.data.data.results) {
          recommendations.push(...response.data.data.results);
        }
      } catch (error) {
        console.error(`Error fetching contextual recommendations for ${context}:`, error);
      }
    }

    return this.shuffleArray(recommendations).slice(0, limit);
  }

  // Score and rank recommendations based on user preferences
  scoreRecommendations(recommendations, userPreferences) {
    return recommendations.map(song => {
      let score = 0;

      // Boost score for favorite artists
      if (userPreferences.favoriteArtists.some(fav => fav.artist === song.artist)) {
        score += this.weights.favoriteArtists * 100;
      }

      // Boost score for recently played similar content
      if (userPreferences.recentlyPlayed.some(recent => recent.artist === song.artist)) {
        score += this.weights.recentPlays * 50;
      }

      // Add randomness to avoid too predictable recommendations
      score += Math.random() * 20;

      return { ...song, score };
    }).sort((a, b) => b.score - a.score);
  }

  // Get user's music discovery preferences
  getDiscoveryPreferences() {
    const preferences = userHistoryService.getUserPreferences();
    
    return {
      explorationLevel: this.calculateExplorationLevel(preferences),
      preferredGenres: preferences.favoriteGenres,
      artistDiversity: this.calculateArtistDiversity(preferences),
      timePreferences: preferences.listeningPatterns.timeOfDay
    };
  }

  calculateExplorationLevel(preferences) {
    // Calculate how much the user likes to discover new music
    const totalPlays = preferences.recentlyPlayed.length;
    const uniqueArtists = new Set(preferences.recentlyPlayed.map(p => p.artist)).size;
    
    if (totalPlays === 0) return 0.5; // neutral
    
    const diversity = uniqueArtists / totalPlays;
    return Math.min(diversity * 2, 1); // normalize to 0-1
  }

  calculateArtistDiversity(preferences) {
    const artistCounts = preferences.favoriteArtists;
    if (artistCounts.length === 0) return 0.5;
    
    // Calculate how evenly distributed the listening is across artists
    const total = artistCounts.reduce((sum, artist) => sum + artist.count, 0);
    const entropy = artistCounts.reduce((ent, artist) => {
      const p = artist.count / total;
      return ent - (p * Math.log2(p));
    }, 0);
    
    return Math.min(entropy / Math.log2(artistCounts.length), 1);
  }
}

// Create singleton instance
const recommendationEngine = new RecommendationEngine();

export default recommendationEngine;
