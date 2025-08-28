import { useState, useEffect, useRef } from 'react';
import './MusicPlayer.css';

const MusicPlayer = ({ track, isPlaying, onPlayPause, onClose }) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [volume, setVolume] = useState(50);
  const playerRef = useRef(null);

  useEffect(() => {
    // Load YouTube IFrame API
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        initializePlayer();
      };
    } else {
      initializePlayer();
    }
  }, [track]);

  const initializePlayer = () => {
    if (playerRef.current) {
      playerRef.current.destroy();
    }

    playerRef.current = new window.YT.Player('youtube-player', {
      height: '200',
      width: '100%',
      videoId: track.id,
      playerVars: {
        autoplay: isPlaying ? 1 : 0,
        controls: 1,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      },
      events: {
        onReady: (event) => {
          if (isPlaying) {
            event.target.playVideo();
          }
          event.target.setVolume(volume);
        },
        onStateChange: (event) => {
          // Handle player state changes if needed
        }
      }
    });
  };

  useEffect(() => {
    if (playerRef.current && playerRef.current.playVideo) {
      if (isPlaying) {
        playerRef.current.playVideo();
      } else {
        playerRef.current.pauseVideo();
      }
    }
  }, [isPlaying]);

  useEffect(() => {
    if (playerRef.current && playerRef.current.setVolume) {
      playerRef.current.setVolume(volume);
    }
  }, [volume]);

  const handleVolumeChange = (e) => {
    setVolume(parseInt(e.target.value));
  };

  return (
    <div className={`music-player ${isMinimized ? 'minimized' : ''}`}>
      <div className="player-header">
        <div className="track-info-player">
          <img 
            src={track.thumbnail} 
            alt={track.title}
            className="player-thumbnail"
          />
          <div className="track-details">
            <h4 className="player-track-title">{track.title}</h4>
            <p className="player-track-artist">{track.artist}</p>
          </div>
        </div>
        
        <div className="player-controls-header">
          <button 
            className="minimize-btn"
            onClick={() => setIsMinimized(!isMinimized)}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '⬆️' : '⬇️'}
          </button>
          <button 
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ✕
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className="player-content">
          <div className="youtube-player-container">
            <div id="youtube-player"></div>
          </div>
          
          <div className="player-controls">
            <div className="main-controls">
              <button className="control-btn" title="Previous">
                ⏮️
              </button>
              <button 
                className="play-pause-btn"
                onClick={onPlayPause}
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? '⏸️' : '▶️'}
              </button>
              <button className="control-btn" title="Next">
                ⏭️
              </button>
            </div>
            
            <div className="volume-control">
              <span className="volume-icon">🔊</span>
              <input
                type="range"
                min="0"
                max="100"
                value={volume}
                onChange={handleVolumeChange}
                className="volume-slider"
              />
              <span className="volume-value">{volume}%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlayer;
