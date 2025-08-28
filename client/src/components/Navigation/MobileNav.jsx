import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './MobileNav.css';

const MobileNav = ({ user, onLogout }) => {
  const [isOpen, setIsOpen] = useState(false);
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
      label: 'Library',
      icon: '📚',
      path: '/library',
      active: location.pathname === '/library'
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: '❤️',
      path: '/favorites',
      active: location.pathname === '/favorites'
    }
  ];

  const handleNavigation = (path) => {
    navigate(path);
    setIsOpen(false);
  };

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="mobile-bottom-nav">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            className={`mobile-nav-item ${item.active ? 'active' : ''}`}
            onClick={() => handleNavigation(item.path)}
          >
            <span className="mobile-nav-icon">{item.icon}</span>
            <span className="mobile-nav-label">{item.label}</span>
          </button>
        ))}
        
        <button
          className="mobile-nav-item menu-toggle"
          onClick={toggleMenu}
        >
          <span className="mobile-nav-icon">☰</span>
          <span className="mobile-nav-label">Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="mobile-menu-overlay" onClick={() => setIsOpen(false)}>
          <div className="mobile-menu" onClick={(e) => e.stopPropagation()}>
            <div className="mobile-menu-header">
              <div className="mobile-user-profile">
                <img 
                  src={user?.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=667eea&color=fff`}
                  alt={user?.name || 'User'}
                  className="mobile-user-avatar"
                />
                <div className="mobile-user-info">
                  <span className="mobile-user-name">{user?.name || 'User'}</span>
                  <span className="mobile-user-plan">{user?.subscription === 'premium' ? 'Premium' : 'Free'}</span>
                </div>
              </div>
              <button className="mobile-menu-close" onClick={() => setIsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="mobile-menu-content">
              <div className="mobile-menu-section">
                <h3>Navigation</h3>
                <ul className="mobile-menu-list">
                  <li>
                    <button onClick={() => handleNavigation('/playlists')}>
                      <span className="menu-icon">🎵</span>
                      Playlists
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigation('/artists')}>
                      <span className="menu-icon">👥</span>
                      Following
                    </button>
                  </li>
                  <li>
                    <button onClick={() => handleNavigation('/discover')}>
                      <span className="menu-icon">🌟</span>
                      Discover
                    </button>
                  </li>
                </ul>
              </div>

              <div className="mobile-menu-section">
                <h3>Recently Played</h3>
                <ul className="mobile-menu-list">
                  <li>
                    <button>
                      <span className="menu-icon">🎧</span>
                      Daily Mix 1
                    </button>
                  </li>
                  <li>
                    <button>
                      <span className="menu-icon">🎶</span>
                      Chill Vibes
                    </button>
                  </li>
                  <li>
                    <button>
                      <span className="menu-icon">🔥</span>
                      Top Hits
                    </button>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mobile-menu-footer">
              <button className="mobile-logout-btn" onClick={onLogout}>
                <span className="logout-icon">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNav;
