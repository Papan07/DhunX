import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Sidebar from '../Navigation/Sidebar';
import MobileNav from '../Navigation/MobileNav';
import MusicPlayer from './MusicPlayer';
import './Music.css';

const Search = () => {
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem('accessToken');
    const userData = localStorage.getItem('user');

    if (!token) {
      navigate('/signin');
      return;
    }

    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch (e) {
        console.error('Error parsing user data:', e);
        navigate('/signin');
      }
    }
  }, [navigate]);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    console.log('Starting search for:', searchQuery);
    setLoading(true);
    setSearchResults([]); // Clear previous results
    
    try {
      const response = await axios.get(`http://localhost:5002/api/music/search`, {
        params: { q: searchQuery, limit: 20 }
      });

      console.log('Full response:', response);
      console.log('Response data:', response.data);
      console.log('Results array:', response.data?.data?.results);

      if (response.data && response.data.success && response.data.data && response.data.data.results) {
        const results = response.data.data.results;
        console.log('Setting', results.length, 'search results');
        console.log('First result title:', results[0]?.title);
        console.log('All titles:', results.map(r => r.title));
        setSearchResults(results);
      } else {
        console.log('No results found or invalid response structure');
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
      console.error('Error response:', error.response?.data);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  if (!user) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <Sidebar user={user} onLogout={handleLogout} />
      
      <main className="dashboard-main">
        <div className="search-container">
          <div className="search-header">
            <h1>Search Music</h1>
            <p>Find your favorite songs, artists, and albums</p>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div className="search-input-container">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for songs, artists, albums..."
                className="search-input"
              />
              <button type="submit" className="search-button" disabled={loading}>
                {loading ? '🔄' : '🔍'}
              </button>
            </div>
          </form>

          {loading && (
            <div className="search-loading">
              <div className="loading-spinner"></div>
              <p>Searching...</p>
            </div>
          )}

          {searchResults.length > 0 && (
            <div className="search-results">
              <h2>Search Results ({searchResults.length})</h2>
              <div className="results-grid">
                {searchResults.map((track, index) => (
                  <div key={track.id} className="track-card">
                    <div className="track-thumbnail">
                      <img 
                        src={track.thumbnail} 
                        alt={track.title}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/300x200?text=Music';
                        }}
                      />
                      <div className="play-overlay">
                        <button 
                          className="play-button"
                          onClick={() => handlePlayTrack(track)}
                        >
                          ▶️
                        </button>
                      </div>
                    </div>
                    <div className="track-info">
                      <h3 className="track-title">{track.title}</h3>
                      <p className="track-artist">{track.artist}</p>
                      {track.durationFormatted && (
                        <p className="track-duration">{track.durationFormatted}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchQuery && searchResults.length === 0 && !loading && (
            <div className="no-results">
              <div className="no-results-icon">🎵</div>
              <h3>No results found</h3>
              <p>Try searching with different keywords</p>
            </div>
          )}

          {!searchQuery && (
            <div className="search-suggestions">
              <h2>Popular Searches</h2>
              <div className="suggestion-tags">
                {['Pop Music', 'Rock', 'Hip Hop', 'Jazz', 'Classical', 'Electronic', 'Country', 'R&B'].map((genre) => (
                  <button 
                    key={genre}
                    className="suggestion-tag"
                    onClick={() => {
                      setSearchQuery(genre);
                      // Auto-search when clicking suggestion
                      setTimeout(() => {
                        const form = document.querySelector('.search-form');
                        if (form) form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                      }, 100);
                    }}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav user={user} onLogout={handleLogout} />
      
      {currentTrack && (
        <MusicPlayer 
          track={currentTrack}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onClose={() => {
            setCurrentTrack(null);
            setIsPlaying(false);
          }}
        />
      )}
    </div>
  );
};

export default Search;
