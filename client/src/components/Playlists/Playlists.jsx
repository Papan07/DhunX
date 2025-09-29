import { useState, useEffect } from 'react';
import { useSearchParams, useOutletContext } from 'react-router-dom';
import axios from 'axios';
import MusicPlayer from '../Music/MusicPlayer';
import './Playlists.css';

const Playlists = () => {
  const { user } = useOutletContext();
  const [playlists, setPlaylists] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({
    name: '',
    description: '',
    isPublic: false
  });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    fetchPlaylists();
    
    // Check if we should show create modal from URL params
    if (searchParams.get('create') === 'true') {
      setShowCreateModal(true);
    }
  }, [searchParams]);

  const fetchPlaylists = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/library/playlists`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlaylists(response.data.data.playlists);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylist.name.trim()) {
      alert('Please enter a playlist name');
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/library/playlists`, {
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim(),
        isPublic: newPlaylist.isPublic
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setPlaylists([response.data.data.playlist, ...playlists]);
        setShowCreateModal(false);
        setNewPlaylist({ name: '', description: '', isPublic: false });
        alert('Playlist created successfully!');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      alert('Failed to create playlist. Please try again.');
    }
  };

  const handleDeletePlaylist = async (playlistId, playlistName) => {
    if (!confirm(`Are you sure you want to delete "${playlistName}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/library/playlists/${playlistId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPlaylists(playlists.filter(p => p._id !== playlistId));
      alert('Playlist deleted successfully!');
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Failed to delete playlist. Please try again.');
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="playlists-loading">
        <div className="loading-spinner"></div>
        <p>Loading your playlists...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="playlists-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchPlaylists} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="playlists">
      {/* Header */}
      <div className="playlists-header">
        <div className="header-content">
          <h1>Your Playlists</h1>
          <p>Create and manage your music collections</p>
        </div>
        <button 
          className="create-playlist-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <span className="btn-icon">➕</span>
          Create Playlist
        </button>
      </div>

      {/* Playlists Content */}
      {playlists.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🎵</div>
          <h2>No playlists yet</h2>
          <p>Create your first playlist to organize your favorite songs</p>
          <button 
            className="create-btn primary"
            onClick={() => setShowCreateModal(true)}
          >
            <span className="btn-icon">➕</span>
            Create Your First Playlist
          </button>
        </div>
      ) : (
        <div className="playlists-grid">
          {playlists.map((playlist) => (
            <div key={playlist._id} className="playlist-card">
              <div className="playlist-image">
                <img 
                  src={playlist.coverImage || '/default-playlist.png'} 
                  alt={playlist.name}
                  onError={(e) => {
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=667eea&color=fff&size=300`;
                  }}
                />
                <div className="playlist-overlay">
                  <button className="play-btn">
                    ▶️
                  </button>
                  <div className="playlist-actions">
                    <button 
                      className="action-btn edit"
                      title="Edit playlist"
                    >
                      ✏️
                    </button>
                    <button 
                      className="action-btn delete"
                      title="Delete playlist"
                      onClick={() => handleDeletePlaylist(playlist._id, playlist.name)}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
              <div className="playlist-info">
                <h3>{playlist.name}</h3>
                <p className="playlist-description">
                  {playlist.description || 'No description'}
                </p>
                <div className="playlist-meta">
                  <span className="song-count">{playlist.songCount || 0} songs</span>
                  <span className="separator">•</span>
                  <span className="duration">{playlist.formattedDuration || '0m'}</span>
                  <span className="separator">•</span>
                  <span className="visibility">
                    {playlist.isPublic ? '🌐 Public' : '🔒 Private'}
                  </span>
                </div>
                <div className="playlist-footer">
                  <span className="created-date">
                    Created {formatDate(playlist.createdAt)}
                  </span>
                  <span className="updated-date">
                    Updated {formatDate(playlist.updatedAt)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Playlist Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Playlist</h2>
              <button 
                className="close-btn"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreatePlaylist} className="create-form">
              <div className="form-group">
                <label htmlFor="playlist-name">Playlist Name *</label>
                <input
                  id="playlist-name"
                  type="text"
                  value={newPlaylist.name}
                  onChange={(e) => setNewPlaylist({...newPlaylist, name: e.target.value})}
                  placeholder="Enter playlist name"
                  maxLength={100}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="playlist-description">Description</label>
                <textarea
                  id="playlist-description"
                  value={newPlaylist.description}
                  onChange={(e) => setNewPlaylist({...newPlaylist, description: e.target.value})}
                  placeholder="Add a description (optional)"
                  maxLength={500}
                  rows={3}
                />
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newPlaylist.isPublic}
                    onChange={(e) => setNewPlaylist({...newPlaylist, isPublic: e.target.checked})}
                  />
                  <span className="checkmark"></span>
                  Make this playlist public
                </label>
                <p className="checkbox-help">
                  Public playlists can be discovered and followed by other users
                </p>
              </div>
              <div className="form-actions">
                <button 
                  type="button" 
                  className="cancel-btn"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="create-btn">
                  Create Playlist
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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

export default Playlists;
