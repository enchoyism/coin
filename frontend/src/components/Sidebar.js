import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  const handleNavigate = (path) => {
    navigate(path);
    onClose();
  };

  const toggleGuide = () => {
    setIsGuideOpen(!isGuideOpen);
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      {/* Sidebar */}
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <h4>MENU</h4>
          <button className="sidebar-close-btn" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="sidebar-nav">
          {user?.isAdmin && (
            <div
              className={`sidebar-item ${location.pathname === '/admin' ? 'active' : ''}`}
              onClick={() => handleNavigate('/admin')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5"></path>
              </svg>
              <span>관리자</span>
            </div>
          )}

          <div
            className={`sidebar-item ${location.pathname === '/main' ? 'active' : ''}`}
            onClick={() => handleNavigate('/main')}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
              <polyline points="9 22 9 12 15 12 15 22"></polyline>
            </svg>
            <span>메인</span>
          </div>

          <div className="sidebar-item" onClick={toggleGuide}>
            <div className="sidebar-item-content">
              <div className="sidebar-item-left">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                </svg>
                <span>가이드</span>
              </div>
              <svg
                className={`sidebar-arrow ${isGuideOpen ? 'open' : ''}`}
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          </div>

          {isGuideOpen && (
            <div className="sidebar-submenu">
              <div
                className={`sidebar-subitem ${location.pathname === '/guide' && location.hash === '' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/guide');
                  onClose();
                }}
              >
                Bithumb
              </div>
              <div
                className={`sidebar-subitem ${location.pathname === '/guide' && location.hash === '#telegram' ? 'active' : ''}`}
                onClick={() => {
                  navigate('/guide#telegram');
                  onClose();
                }}
              >
                Telegram
              </div>
            </div>
          )}
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
