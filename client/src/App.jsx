import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './components/Auth/SignIn';
import SignUp from './components/Auth/SignUp';
import AuthCallback from './components/Auth/AuthCallback';
import Dashboard from './components/Dashboard/Dashboard';
import Search from './components/Music/Search';
import Library from './components/Library/Library';
import Playlists from './components/Playlists/Playlists';
import LikedSongs from './components/LikedSongs/LikedSongs';
import ProtectedLayout from './components/Layout/ProtectedLayout';
import './App.css';

// Import Auth CSS globally
import './components/Auth/Auth.css';

// Component to handle root route logic
const RootRedirect = () => {
  const token = localStorage.getItem('accessToken');
  return token ? <Navigate to="/dashboard" replace /> : <Navigate to="/signin" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Default route checks authentication */}
          <Route path="/" element={<RootRedirect />} />

          {/* Authentication routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route path="/auth/error" element={<AuthCallback />} />

          {/* Protected routes with layout */}
          <Route path="/" element={<ProtectedLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="search" element={<Search />} />
            <Route path="library" element={<Library />} />
            <Route path="playlists" element={<Playlists />} />
            <Route path="favorites" element={<LikedSongs />} />
          </Route>

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/signin" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
