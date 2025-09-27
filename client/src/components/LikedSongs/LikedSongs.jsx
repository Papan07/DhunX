import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import axios from 'axios';
import MusicPlayer from '../Music/MusicPlayer';
import './LikedSongs.css';

const LikedSongs = () => {
  const { user } = useOutletContext();
  const [likedSongs, setLikedSongs] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('recent'); // recent, alphabetical, artist
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchLikedSongs();
  }, []);

  const fetchLikedSongs = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('http://localhost:5002/api/library/liked-songs', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setLikedSongs(response.data.data.songs);
      }
    } catch (error) {
      console.error('Error fetching liked songs:', error);
      setError('Failed to load liked songs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveLikedSong = async (videoId, title) => {
    if (!confirm(`Remove "${title}" from liked songs?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`http://localhost:5002/api/library/liked-songs/${videoId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setLikedSongs(likedSongs.filter(song => song.videoId !== videoId));
      alert('Song removed from liked songs!');
    } catch (error) {
      console.error('Error removing liked song:', error);
      alert('Failed to remove song. Please try again.');
    }
  };

  const handlePlayTrack = (song) => {
    const track = {
      id: song.videoId,
      title: song.title,
      artist: song.artist,
      thumbnail: song.thumbnail
    };
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

  const handlePlayAll = () => {
    if (filteredSongs.length > 0) {
      handlePlayTrack(filteredSongs[0]);
    }
  };

  const handleShuffle = () => {
    if (filteredSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * filteredSongs.length);
      handlePlayTrack(filteredSongs[randomIndex]);
    }
  };

  // Filter and sort songs
  const filteredSongs = likedSongs
    .filter(song => 
      song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.title.localeCompare(b.title);
        case 'artist':
          return a.artist.localeCompare(b.artist);
        case 'recent':
        default:
          return new Date(b.createdAt || b.addedAt) - new Date(a.createdAt || a.addedAt);
      }
    });

  const formatDuration = (seconds) => {
    if (!seconds) return '0:00';
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="liked-songs-loading">
        <div className="loading-spinner"></div>
        <p>Loading your liked songs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="liked-songs-error">
        <div className="error-icon">⚠️</div>
        <p>{error}</p>
        <button onClick={fetchLikedSongs} className="retry-btn">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="liked-songs">
      {/* Header */}
      <div className="liked-songs-header">
        <div className="header-content">
          <div className="header-icon">❤️</div>
          <div className="header-info">
            <h1>Liked Songs</h1>
            <p>{likedSongs.length} songs you've liked</p>
          </div>
        </div>
        {likedSongs.length > 0 && (
          <div className="header-actions">
            <button className="play-all-btn" onClick={handlePlayAll}>
              <span className="btn-icon">▶️</span>
              Play All
            </button>
            <button className="shuffle-btn" onClick={handleShuffle}>
              <span className="btn-icon">🔀</span>
              Shuffle
            </button>
          </div>
        )}
      </div>

      {/* Controls */}
      {likedSongs.length > 0 && (
        <div className="controls">
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search in liked songs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="sort-controls">
            <label>Sort by:</label>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value)}
              className="sort-select"
            >
              <option value="recent">Recently Added</option>
              <option value="alphabetical">Song Title</option>
              <option value="artist">Artist Name</option>
            </select>
          </div>
        </div>
      )}

      {/* Content */}
      {likedSongs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💔</div>
          <h2>No liked songs yet</h2>
          <p>Songs you like will appear here. Start exploring music and tap the heart icon to save your favorites!</p>
          <button className="explore-btn" onClick={() => window.location.href = '/search'}>
            <span className="btn-icon">🔍</span>
            Explore Music
          </button>
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="no-results">
          <div className="no-results-icon">🔍</div>
          <h3>No songs found</h3>
          <p>Try adjusting your search or sort criteria</p>
        </div>
      ) : (
        <div className="songs-list">
          <div className="list-header">
            <div className="col-index">#</div>
            <div className="col-title">Title</div>
            <div className="col-artist">Artist</div>
            <div className="col-duration">Duration</div>
            <div className="col-added">Date Added</div>
            <div className="col-actions">Actions</div>
          </div>
          {filteredSongs.map((song, index) => (
            <div key={song._id || song.videoId} className="song-row">
              <div className="col-index">
                <span className="song-number">{index + 1}</span>
                <button 
                  className="play-btn"
                  onClick={() => handlePlayTrack(song)}
                >
                  ▶️
                </button>
              </div>
              <div className="col-title">
                <div className="song-info">
                  <img 
                    src={song.thumbnail} 
                    alt={song.title}
                    className="song-thumbnail"
                  />
                  <div className="song-details">
                    <h4>{song.title}</h4>
                  </div>
                </div>
              </div>
              <div className="col-artist">{song.artist}</div>
              <div className="col-duration">{formatDuration(song.duration)}</div>
              <div className="col-added">{formatDate(song.createdAt || song.addedAt)}</div>
              <div className="col-actions">
                <button 
                  className="action-btn remove"
                  onClick={() => handleRemoveLikedSong(song.videoId, song.title)}
                  title="Remove from liked songs"
                >
                  💔
                </button>
                <button 
                  className="action-btn add-to-playlist"
                  title="Add to playlist"
                >
                  ➕
                </button>
              </div>
            </div>
          ))}
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

export default LikedSongs;
