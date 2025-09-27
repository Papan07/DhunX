import { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import MusicPlayer from '../Music/MusicPlayer';
import './Library.css';

const Library = () => {
  const { user } = useOutletContext();
  const [activeTab, setActiveTab] = useState('overview');
  const [playlists, setPlaylists] = useState([]);
  const [likedSongs, setLikedSongs] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const fetchLibraryData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const headers = { Authorization: `Bearer ${token}` };

      // Fetch user's playlists
      const playlistsResponse = await axios.get('http://localhost:5002/api/library/playlists', { headers });
      if (playlistsResponse.data.success) {
        setPlaylists(playlistsResponse.data.data.playlists);
      }

      // Fetch liked songs
      const likedSongsResponse = await axios.get('http://localhost:5002/api/library/liked-songs', { headers });
      if (likedSongsResponse.data.success) {
        setLikedSongs(likedSongsResponse.data.data.songs);
      }

      // Mock recently played for now
      setRecentlyPlayed([
        {
          id: 'dQw4w9WgXcQ',
          title: 'Never Gonna Give You Up',
          artist: 'Rick Astley',
          thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/mqdefault.jpg',
          playedAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
        },
        {
          id: '9bZkp7q19f0',
          title: 'Gangnam Style',
          artist: 'PSY',
          thumbnail: 'https://i.ytimg.com/vi/9bZkp7q19f0/mqdefault.jpg',
          playedAt: new Date(Date.now() - 5 * 60 * 60 * 1000) // 5 hours ago
        }
      ]);

    } catch (error) {
      console.error('Error fetching library data:', error);
      setError('Failed to load your library. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlayTrack = (track) => {
    setCurrentTrack(track);
    setIsPlaying(true);
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleClosePlayer = () => {
    setCurrentTrack(null);
    setIsPlaying(false);
  };

  const handleCreatePlaylist = () => {
    navigate('/playlists?create=true');
  };

  const handleViewAllPlaylists = () => {
    navigate('/playlists');
  };

  const handleViewAllLikedSongs = () => {
    navigate('/favorites');
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    return `${diffInWeeks}w ago`;
  };

  if (loading) {
    return (
      <div className="library-loading">
        <div className="loading-spinner"></div>
        <p>Loading your library...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="library-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchLibraryData} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="library">
      {/* Header */}
      <div className="library-header">
        <h1>Your Library</h1>
        <p>Your music collection and playlists</p>
      </div>

      {/* Navigation Tabs */}
      <div className="library-tabs">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'playlists' ? 'active' : ''}`}
          onClick={() => setActiveTab('playlists')}
        >
          Playlists ({playlists.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'liked' ? 'active' : ''}`}
          onClick={() => setActiveTab('liked')}
        >
          Liked Songs ({likedSongs.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          Recently Played
        </button>
      </div>

      {/* Content */}
      <div className="library-content">
        {activeTab === 'overview' && (
          <div className="overview-content">
            {/* Quick Stats */}
            <div className="library-stats">
              <div className="stat-card">
                <div className="stat-icon">🎵</div>
                <div className="stat-info">
                  <h3>{playlists.length}</h3>
                  <p>Playlists</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">❤️</div>
                <div className="stat-info">
                  <h3>{likedSongs.length}</h3>
                  <p>Liked Songs</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">🎧</div>
                <div className="stat-info">
                  <h3>{recentlyPlayed.length}</h3>
                  <p>Recently Played</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button className="action-btn primary" onClick={handleCreatePlaylist}>
                <span className="btn-icon">➕</span>
                Create Playlist
              </button>
              <button className="action-btn secondary" onClick={handleViewAllLikedSongs}>
                <span className="btn-icon">❤️</span>
                View Liked Songs
              </button>
            </div>

            {/* Recent Playlists */}
            {playlists.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2>Recent Playlists</h2>
                  <button className="see-all-btn" onClick={handleViewAllPlaylists}>
                    See all
                  </button>
                </div>
                <div className="playlists-grid">
                  {playlists.slice(0, 4).map((playlist) => (
                    <div key={playlist._id} className="playlist-card">
                      <div className="playlist-image">
                        <img 
                          src={playlist.coverImage || '/default-playlist.png'} 
                          alt={playlist.name}
                          onError={(e) => {
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=667eea&color=fff&size=200`;
                          }}
                        />
                        <div className="playlist-overlay">
                          <button className="play-btn">▶️</button>
                        </div>
                      </div>
                      <div className="playlist-info">
                        <h3>{playlist.name}</h3>
                        <p>{playlist.songCount} songs</p>
                        <span className="playlist-duration">{playlist.formattedDuration}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recently Played */}
            {recentlyPlayed.length > 0 && (
              <div className="section">
                <div className="section-header">
                  <h2>Recently Played</h2>
                </div>
                <div className="recent-tracks">
                  {recentlyPlayed.map((track) => (
                    <div key={track.id} className="track-item">
                      <div className="track-image">
                        <img src={track.thumbnail} alt={track.title} />
                        <button 
                          className="play-btn"
                          onClick={() => handlePlayTrack(track)}
                        >
                          ▶️
                        </button>
                      </div>
                      <div className="track-info">
                        <h4>{track.title}</h4>
                        <p>{track.artist}</p>
                        <span className="played-time">{formatTimeAgo(track.playedAt)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'playlists' && (
          <div className="playlists-content">
            <div className="content-header">
              <h2>Your Playlists</h2>
              <button className="create-btn" onClick={handleCreatePlaylist}>
                <span className="btn-icon">➕</span>
                Create New
              </button>
            </div>
            {playlists.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">🎵</div>
                <h3>No playlists yet</h3>
                <p>Create your first playlist to organize your favorite songs</p>
                <button className="create-btn primary" onClick={handleCreatePlaylist}>
                  Create Playlist
                </button>
              </div>
            ) : (
              <div className="playlists-list">
                {playlists.map((playlist) => (
                  <div key={playlist._id} className="playlist-row">
                    <div className="playlist-image">
                      <img 
                        src={playlist.coverImage || '/default-playlist.png'} 
                        alt={playlist.name}
                        onError={(e) => {
                          e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=667eea&color=fff&size=100`;
                        }}
                      />
                    </div>
                    <div className="playlist-details">
                      <h3>{playlist.name}</h3>
                      <p>{playlist.description || 'No description'}</p>
                      <div className="playlist-meta">
                        <span>{playlist.songCount} songs</span>
                        <span>•</span>
                        <span>{playlist.formattedDuration}</span>
                        <span>•</span>
                        <span>{playlist.isPublic ? 'Public' : 'Private'}</span>
                      </div>
                    </div>
                    <div className="playlist-actions">
                      <button className="action-btn">▶️</button>
                      <button className="action-btn">⋯</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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

export default Library;
