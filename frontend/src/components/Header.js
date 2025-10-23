import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [imageError, setImageError] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleImageError = () => {
    setImageError(true);
  };

  return (
    <div className="header">
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
  );
};

export default Header;
