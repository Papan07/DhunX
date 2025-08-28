import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import MusicPlayer from '../Music/MusicPlayer';
import userHistoryService from '../../services/userHistoryService';
import recommendationEngine from '../../services/recommendationEngine';
import './Home.css';

const Home = () => {
  const { user, isSidebarHidden } = useOutletContext();
  const [trendingMusic, setTrendingMusic] = useState([]);
  const [songSuggestions, setSongSuggestions] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  useEffect(() => {
    fetchHomeData();

    // Set up automatic refresh every 10 minutes
    const refreshInterval = setInterval(() => {
      refreshRecommendations();
    }, 10 * 60 * 1000); // 10 minutes

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchHomeData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch trending music
      const trendingResponse = await axios.get('http://localhost:5000/api/music/trending', {
        params: { limit: 12 }
      });
      
      if (trendingResponse.data.success) {
        setTrendingMusic(trendingResponse.data.data.results);
      }

      // --- Enhanced Personalized Suggestions Logic ---
      try {
        // Use the recommendation engine for a large number of personalized suggestions
        const personalizedSuggestions = await recommendationEngine.getPersonalizedRecommendations(85);

        if (personalizedSuggestions && personalizedSuggestions.length > 0) {
          setSongSuggestions(personalizedSuggestions);
        } else {
          // Fallback to multiple generic searches to get 80-90 songs
          const suggestionsQueries = [
            'pop hits 2024', 'trending songs', 'viral music', 'top charts',
            'new releases', 'popular music', 'hit songs', 'best music 2024',
            'dance music', 'rock hits', 'indie music', 'electronic music'
          ];

          const allSuggestions = [];
          const songsPerQuery = Math.ceil(85 / suggestionsQueries.length);

          for (const query of suggestionsQueries) {
            try {
              const response = await axios.get('http://localhost:5000/api/music/search', {
                params: { q: query, limit: songsPerQuery }
              });

              if (response.data.success && response.data.data.results) {
                allSuggestions.push(...response.data.data.results);
              }
            } catch (queryError) {
              console.error(`Error with query ${query}:`, queryError);
            }
          }

          // Remove duplicates and shuffle
          const uniqueSuggestions = this.removeDuplicates ? this.removeDuplicates(allSuggestions) : allSuggestions;
          const shuffledSuggestions = uniqueSuggestions.sort(() => Math.random() - 0.5);
          setSongSuggestions(shuffledSuggestions.slice(0, 85));
        }
      } catch (e) {
        console.log("Could not fetch personalized suggestions, falling back to generic ones.", e.message);

        // Final fallback with multiple queries
        const fallbackQueries = ['popular songs', 'trending music', 'top hits', 'new music'];
        const allFallbackSuggestions = [];

        for (const query of fallbackQueries) {
          try {
            const fallbackResponse = await axios.get('http://localhost:5000/api/music/search', {
              params: { q: query, limit: 20 }
            });

            if (fallbackResponse.data.success) {
              allFallbackSuggestions.push(...fallbackResponse.data.data.results);
            }
          } catch (fallbackError) {
            console.error(`Fallback query ${query} failed:`, fallbackError);
          }
        }

        setSongSuggestions(allFallbackSuggestions.slice(0, 80));
      }

      // Get recently played from user history
      const userPreferences = userHistoryService.getUserPreferences();
      const recentlyPlayedFromHistory = userPreferences.recentlyPlayed;

      if (recentlyPlayedFromHistory && recentlyPlayedFromHistory.length > 0) {
        setRecentlyPlayed(recentlyPlayedFromHistory);
      } else {
        // Fallback to mock data if no history exists
        setRecentlyPlayed([
          {
            id: 'dQw4w9WgXcQ',
            title: 'Never Gonna Give You Up',
            artist: 'Rick Astley',
            thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
          },
          {
            id: '9bZkp7q19f0',
            title: 'Gangnam Style',
            artist: 'PSY',
            thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg'
          }
        ]);
      }
      
    } catch (error) {
      console.error('Error fetching home data:', error);
      setError('Failed to load music data. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Enhanced refresh function for recommendations only
  const refreshRecommendations = async () => {
    if (refreshing) return; // Prevent multiple simultaneous refreshes

    setRefreshing(true);
    setLastRefresh(Date.now());

    try {
      // Get fresh personalized recommendations with variety
      const personalizedSuggestions = await recommendationEngine.getPersonalizedRecommendations(15);

      if (personalizedSuggestions && personalizedSuggestions.length > 0) {
        // Shuffle and take a subset to provide variety
        const shuffledSuggestions = personalizedSuggestions
          .sort(() => Math.random() - 0.5)
          .slice(0, 12);
        setSongSuggestions(shuffledSuggestions);
      }

      // Also refresh recently played from history
      const userPreferences = userHistoryService.getUserPreferences();
      const recentlyPlayedFromHistory = userPreferences.recentlyPlayed;

      if (recentlyPlayedFromHistory && recentlyPlayedFromHistory.length > 0) {
        setRecentlyPlayed(recentlyPlayedFromHistory);
      }

    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);

    // Track the play event
    userHistoryService.trackPlay(track);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleLikeSong = async (song) => {
    try {
      const token = localStorage.getItem('accessToken');
      await axios.post('http://localhost:5000/api/library/liked-songs', {
        videoId: song.id,
        title: song.title,
        artist: song.artist,
        thumbnail: song.thumbnail,
        duration: song.duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Track the like event
      userHistoryService.trackLike(song);

      // Show success message or update UI
      alert('Song added to liked songs!');
    } catch (error) {
      console.error('Error liking song:', error);
      alert('Failed to add song to liked songs');
    }
  };

  if (loading) {
    return (
      <div className="home-loading">
        <div className="loading-spinner"></div>
        <p>Loading your music...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchHomeData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`home ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Top Genre Tags */}
      <div className="genre-tags">
        <button className="genre-tag active">Music</button>
        <button className="genre-tag">Podcasts</button>
        <button className="genre-tag">Jazz</button>
        <button className="genre-tag">Electronic</button>
        <button className="genre-tag">Rock Classic</button>
        <button className="genre-tag">Hip Hop</button>
        <button
          className={`refresh-btn ${refreshing ? 'refreshing' : ''}`}
          onClick={refreshRecommendations}
          disabled={refreshing}
          title={refreshing ? "Refreshing..." : "Refresh recommendations"}
        >
          🔄
        </button>
      </div>

      <div className="home-content">
        <div className="main-content">
          {/* Popular Albums Section */}
          <section className="music-section">
            <div className="section-header">
              <h2>Popular Albums</h2>
            </div>
            <div className="albums-grid">
              {trendingMusic.slice(0, isSidebarHidden ? 4 : 3).map((track, index) => (
                <div key={track.id} className="album-card">
                  <div className="album-image">
                    <img src={track.thumbnail} alt={track.title} />
                    <div className="album-overlay">
                      <button
                        className="play-btn-large"
                        onClick={() => handlePlayTrack(track)}
                      >
                        ▶
                      </button>
                    </div>
                    <button
                      className="like-btn-corner"
                      onClick={() => handleLikeSong(track)}
                    >
                      {index === 0 ? '❤️' : '🤍'}
                    </button>
                  </div>
                  <div className="album-info">
                    <h3>{track.title}</h3>
                    <p>{track.artist}</p>
                    <div className="album-stats">
                      <span>12 Tracks</span>
                      <span>•</span>
                      <span>31K Likes</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Picked for You Section */}
          <section className="music-section">
            <div className="section-header">
              <h2>Picked for you</h2>
            </div>
            <div className="featured-playlist">
              <div className="playlist-image">
                <img src={songSuggestions[0]?.thumbnail || '/default-playlist.png'} alt="Featured Playlist" />
              </div>
              <div className="playlist-info">
                <div className="playlist-badge">PLAYLIST</div>
                <h3>New Music Friday Pakistan</h3>
                <p>Listen to the freshest music from Pakistan and around the world.</p>
                <div className="playlist-stats">
                  <span>03:21:29</span>
                  <span>•</span>
                  <span>1.1M LIKES</span>
                  <span>•</span>
                  <span>52 Tracks</span>
                </div>
                <div className="playlist-tags">
                  <span className="tag">Bollywood</span>
                  <span className="tag">Audio Books</span>
                  <span className="tag">Ghazal Fusion</span>
                </div>
                <div className="playlist-actions">
                  <button className="like-btn-playlist">🤍</button>
                  <button className="share-btn">📤</button>
                  <button className="play-btn-playlist" onClick={() => handlePlayTrack(songSuggestions[0])}>
                    ▶
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* Recent Section */}
          <section className="music-section">
            <div className="section-header">
              <h2>Recent</h2>
            </div>
            <div className="recent-list">
              {recentlyPlayed.slice(0, isSidebarHidden ? 4 : 2).map((track, index) => (
                <div key={track.id} className="recent-item">
                  <div className="track-number">{index + 1}</div>
                  <div className="track-image">
                    <img src={track.thumbnail} alt={track.title} />
                  </div>
                  <div className="track-info">
                    <h4>{track.title}</h4>
                    <p>{track.artist}</p>
                  </div>
                  <div className="track-album">Serenity Symphony</div>
                  <div className="track-duration">04:32</div>
                  <button className="track-like">🤍</button>
                </div>
              ))}
            </div>
          </section>

          {/* Additional Recommendations - shown when sidebar is hidden */}
          {isSidebarHidden && songSuggestions.length > 0 && (
            <section className="music-section">
              <div className="section-header">
                <h2>More Recommendations</h2>
              </div>
              <div className="recommendations-grid">
                {songSuggestions.slice(1, 7).map((track, index) => (
                  <div key={track.id} className="recommendation-card">
                    <div className="recommendation-image">
                      <img src={track.thumbnail} alt={track.title} />
                      <div className="recommendation-overlay">
                        <button
                          className="play-btn-small"
                          onClick={() => handlePlayTrack(track)}
                        >
                          ▶
                        </button>
                      </div>
                    </div>
                    <div className="recommendation-info">
                      <h4>{track.title}</h4>
                      <p>{track.artist}</p>
                    </div>
                    <button
                      className="like-btn-small"
                      onClick={() => handleLikeSong(track)}
                    >
                      🤍
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="right-sidebar">
          {/* Popular Artists */}
          <section className="sidebar-section">
            <div className="section-header">
              <h3>Popular Artists</h3>
            </div>
            <div className="artists-grid">
              {['Sarah Melody', 'Javier Cruz', 'Maya Kapoor', 'Andre Williams', 'Alicia Harmon', 'Carlos Rodriguez'].map((artist, index) => (
                <div key={artist} className="artist-card">
                  <div className="artist-image">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(artist)}&background=random&color=fff&size=80`}
                      alt={artist}
                    />
                  </div>
                  <p>{artist}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Top Podcasts */}
          <section className="sidebar-section">
            <div className="section-header">
              <h3>Top Podcasts</h3>
            </div>
            <div className="podcasts-grid">
              <div className="podcast-card">
                <div className="podcast-image">
                  <img src="https://ui-avatars.com/api/?name=Mindful+Musings&background=667eea&color=fff&size=120" alt="Mindful Musings" />
                </div>
                <p>Mindful Musings</p>
              </div>
              <div className="podcast-card">
                <div className="podcast-image">
                  <img src="https://ui-avatars.com/api/?name=The+Creative&background=764ba2&color=fff&size=120" alt="The Creative" />
                </div>
                <p>The Creative</p>
              </div>
            </div>
          </section>

          {/* Next in Queue */}
          <section className="sidebar-section">
            <div className="section-header">
              <h3>Next in Queue</h3>
            </div>
            <div className="queue-list">
              <div className="queue-item">
                <div className="queue-indicator">🔴</div>
                <div className="queue-image">
                  <img src={recentlyPlayed[0]?.thumbnail} alt="Eternal Echoes" />
                </div>
                <div className="queue-info">
                  <h5>Eternal Echoes</h5>
                  <p>Sarah Melody</p>
                </div>
                <div className="queue-duration">04:32</div>
                <button className="queue-options">⋯</button>
              </div>
              <div className="queue-item">
                <div className="queue-like">🤍</div>
                <div className="queue-image">
                  <img src={recentlyPlayed[1]?.thumbnail} alt="Midnight Reverie" />
                </div>
                <div className="queue-info">
                  <h5>Midnight Reverie</h5>
                  <p>Javier Cruz</p>
                </div>
                <div className="queue-duration">04:32</div>
                <button className="queue-options">⋯</button>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Music Player */}
      {currentTrack && (
        <MusicPlayer
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={handlePlayPause}
          onClose={handleClosePlayer}
        />
      )}
    </div>
  );
};

// Helper function to get time of day greeting
const getTimeOfDay = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
};

export default Home;
