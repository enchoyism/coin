import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="header">
        <div className="header-left">
          <button className="menu-btn" onClick={() => setIsSidebarOpen(true)}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <div className="user-card">
          <div className="user-avatar">
            {user?.photo && !imageError ? (
              <img
                src={user.photo}
                alt={user.displayName}
                onError={handleImageError}
              />
            ) : (
              <div className="avatar-placeholder">
                {user?.displayName?.charAt(0) || 'U'}
              </div>
            )}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.displayName || 'User'}</span>
            <span className="user-separator">·</span>
            <span className="user-email">{user?.email || 'No email'}</span>
            {user?.expireAt && !user?.isAdmin && (
              <>
                <span className="user-separator">·</span>
                <span className="user-expire">
                  {new Date(user.expireAt).toISOString().split('T')[0]}
                </span>
              </>
            )}
          </div>
        </div>
        </div>

        <div className="header-actions">
          {user?.isAdmin && (
            <button onClick={() => navigate('/admin')} className="admin-btn">
              관리자
            </button>
          )}
          <button onClick={handleLogout} className="logout-btn">
            로그아웃
          </button>
        </div>
      </div>
    </>
  );
};

export default Header;
