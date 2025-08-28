import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Navigation.css';

const Sidebar = ({ user, onLogout, isHidden, onToggle }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    {
      id: 'home',
      label: 'Home',
      icon: '🏠',
      path: '/dashboard',
      active: location.pathname === '/dashboard'
    },
    {
      id: 'search',
      label: 'Search',
      icon: '🔍',
      path: '/search',
      active: location.pathname === '/search'
    },
    {
      id: 'library',
      label: 'Your Library',
      icon: '📚',
      path: '/library',
      active: location.pathname === '/library'
    },
    {
      id: 'playlists',
      label: 'Playlists',
      icon: '🎵',
      path: '/playlists',
      active: location.pathname === '/playlists'
    },
    {
      id: 'favorites',
      label: 'Liked Songs',
      icon: '❤️',
      path: '/favorites',
      active: location.pathname === '/favorites'
    },
    {
      id: 'artists',
      label: 'Following',
      icon: '👥',
      path: '/artists',
      active: location.pathname === '/artists'
    },
    {
      id: 'discover',
      label: 'Discover',
      icon: '🌟',
      path: '/discover',
      active: location.pathname === '/discover'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isHidden ? 'hidden' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <h1 className="logo-text">DhunX</h1>
          <button
            className="hide-btn"
            onClick={onToggle}
            aria-label="Hide sidebar"
          >
            ✕
          </button>
        </div>
      </div>

      <nav className="sidebar-nav">
        <ul className="nav-list">
          {navigationItems.map((item) => (
            <li key={item.id} className="nav-item">
              <button
                className={`nav-link ${item.active ? 'active' : ''}`}
                onClick={() => handleNavigation(item.path)}
                title={isCollapsed ? item.label : ''}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>

        <div className="nav-divider"></div>

        <div className="playlist-section">
          <h3 className="section-title">Recently Played</h3>
          <ul className="playlist-list">
            <li className="playlist-item">
              <button className="playlist-link">
                <span className="playlist-icon">🎧</span>
                <span className="playlist-name">Daily Mix 1</span>
              </button>
            </li>
            <li className="playlist-item">
              <button className="playlist-link">
                <span className="playlist-icon">🎶</span>
                <span className="playlist-name">Chill Vibes</span>
              </button>
            </li>
            <li className="playlist-item">
              <button className="playlist-link">
                <span className="playlist-icon">🔥</span>
                <span className="playlist-name">Top Hits</span>
              </button>
            </li>
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-profile">
          <img 
            src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff`}
            alt={user?.name || 'User'}
            className="user-avatar"
          />
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-plan">{user?.subscription === 'premium' ? 'Premium' : 'Free'}</span>
          </div>
        </div>
        
        <button 
          className="logout-btn"
          onClick={onLogout}
          title="Logout"
        >
          <span className="logout-icon">🚪</span>
          <span className="logout-text">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
