import { useState, useEffect } from 'react';
import { useNavigate, Outlet } from 'react-router-dom';
import Sidebar from '../Navigation/Sidebar';
import MobileNav from '../Navigation/MobileNav';
import HamburgerMenu from '../Navigation/HamburgerMenu';
import './ProtectedLayout.css';

const ProtectedLayout = () => {
  const [user, setUser] = useState(null);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);
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

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    navigate('/signin');
  };

  const toggleSidebar = () => {
    setIsSidebarHidden(!isSidebarHidden);
  };

  if (!user) {
    return (
      <div className="layout-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className={`protected-layout ${isSidebarHidden ? 'sidebar-hidden' : ''}`}>
      {/* Hamburger Menu - shown when sidebar is hidden */}
      <HamburgerMenu onToggle={toggleSidebar} isVisible={isSidebarHidden} />

      {/* Desktop Sidebar Navigation */}
      <Sidebar
        user={user}
        onLogout={handleLogout}
        isHidden={isSidebarHidden}
        onToggle={toggleSidebar}
      />

      {/* Mobile Header */}
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="logo">
            <h1>DhunX</h1>
          </div>
          <div className="mobile-user-menu">
            <img
              src={user.profilePicture || '/default-avatar.png'}
              alt={user.name}
              className="mobile-user-avatar"
              onError={(e) => {
                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff`;
              }}
            />
            <button onClick={handleLogout} className="mobile-logout-btn">
              🚪
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content-area">
        <Outlet context={{ user, isSidebarHidden }} />
      </main>

      {/* Mobile Navigation */}
      <MobileNav user={user} onLogout={handleLogout} />
    </div>
  );
};

export default ProtectedLayout;
