import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AuthCallback = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState('processing');

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(location.search);
      const token = urlParams.get('token');
      const refreshToken = urlParams.get('refresh');
      const userStr = urlParams.get('user');
      const error = urlParams.get('message');

      if (error) {
        setStatus('error');
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
        return;
      }

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem('accessToken', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        if (userStr) {
          try {
            const user = JSON.parse(decodeURIComponent(userStr));
            localStorage.setItem('user', JSON.stringify(user));
          } catch (e) {
            console.error('Error parsing user data:', e);
          }
        }

        setStatus('success');
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        setStatus('error');
        setTimeout(() => {
          navigate('/signin');
        }, 3000);
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="logo">
            <h1>DhunX</h1>
            <p>Your Music, Your Way</p>
          </div>
        </div>

        <div className="auth-content" style={{ textAlign: 'center', padding: '60px 30px' }}>
          {status === 'processing' && (
            <>
              <div className="loading-spinner"></div>
              <h2 style={{ marginTop: '20px' }}>Processing Authentication...</h2>
              <p>Please wait while we sign you in.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="success-icon">✓</div>
              <h2 style={{ color: '#48bb78', marginTop: '20px' }}>Welcome to DhunX!</h2>
              <p>Authentication successful. Redirecting to your dashboard...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="error-icon">✗</div>
              <h2 style={{ color: '#e53e3e', marginTop: '20px' }}>Authentication Failed</h2>
              <p>Something went wrong. Redirecting to sign in...</p>
            </>
          )}
        </div>
      </div>

      <style jsx>{`
        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #e2e8f0;
          border-top: 4px solid #667eea;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        .success-icon {
          width: 60px;
          height: 60px;
          background: #48bb78;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 30px;
          font-weight: bold;
          margin: 0 auto;
        }

        .error-icon {
          width: 60px;
          height: 60px;
          background: #e53e3e;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 30px;
          font-weight: bold;
          margin: 0 auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AuthCallback;
