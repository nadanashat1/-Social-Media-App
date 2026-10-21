import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Sun, Moon, Plus, ChevronDown, User, Lock, Bookmark, LogOut, Camera, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi } from '../../api/users.api';

export default function Header({ onOpenCreatePost, onOpenUploadPhoto }) {
  const { user, isAuthenticated, isLoading: authLoading, logout, theme, toggleTheme } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }
    let isMounted = true;
    async function loadUnread() {
      try {
        const res = await notificationsApi.getUnreadCount();
        if (isMounted) setUnreadCount(res?.data?.unreadCount ?? 0);
      } catch {
      }
    }
    loadUnread();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/signin');
  };

  const avatarSrc = user?.photo || import.meta.env.BASE_URL + 'images/default-avatar.jpg';

  if (authLoading) {
    return (
      <header className="site-header">
        <div className="header-left">
          <Link to="/" className="brand-logo" aria-label="Route Home">
            <span className="brand-badge">ROUTE<span className="brand-dot" /></span>
          </Link>
        </div>
        <div className="header-right">
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
          </button>
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="header-left">
        <Link to="/" className="brand-logo" aria-label="Route Home">
          <span className="brand-badge">ROUTE<span className="brand-dot" /></span>
        </Link>
      </div>

      {isAuthenticated && (
        <nav className="header-nav">
          <Link
            to="/"
            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
          >
            <span>Home</span>
          </Link>
          <Link
            to="/discover"
            className={`nav-link ${location.pathname === '/discover' ? 'active' : ''}`}
          >
            <span>Discover</span>
          </Link>
          <Link
            to="/bookmarks"
            className={`nav-link ${location.pathname === '/bookmarks' ? 'active' : ''}`}
          >
            <span>Bookmarks</span>
          </Link>
          <Link
            to="/notifications"
            className={`nav-link ${location.pathname === '/notifications' ? 'active' : ''}`}
            style={{ position: 'relative' }}
            aria-label="Notifications"
          >
            <Bell size={16} style={{ flexShrink: 0 }} />
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        </nav>
      )}

      <div className="header-right">
        {isAuthenticated && (
          <button
            type="button"
            className="btn-create-post"
            aria-label="Create Post"
            onClick={onOpenCreatePost || (() => navigate('/'))}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Create Post</span>
          </button>
        )}

        <button
          type="button"
          className="theme-toggle-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
        </button>

        {isAuthenticated ? (
          <div className="user-profile-menu" ref={dropdownRef}>
            <button
              type="button"
              className="user-avatar-trigger"
              onClick={() => setDropdownOpen((prev) => !prev)}
              aria-expanded={dropdownOpen}
              aria-label="User menu"
            >
              <img
                src={avatarSrc}
                alt={user?.name || 'Profile'}
                className="avatar-img"
                onError={(e) => {
                  e.currentTarget.src = import.meta.env.BASE_URL + 'images/default-avatar.jpg';
                }}
              />
              <ChevronDown size={14} color="var(--text-dim)" />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-header">
                  <div className="dropdown-user-name">{user?.name || 'Route Author'}</div>
                  <div className="dropdown-user-handle">@{user?.username || 'member'}</div>
                </div>

                <Link
                  to="/profile"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <User size={16} />
                  <span>Your Profile</span>
                </Link>

                <button
                  type="button"
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    if (onOpenUploadPhoto) onOpenUploadPhoto();
                    else navigate('/profile');
                  }}
                >
                  <Camera size={16} />
                  <span>Update Photo</span>
                </button>

                <Link
                  to="/change-password"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Lock size={16} />
                  <span>Change Password</span>
                </Link>

                <Link
                  to="/bookmarks"
                  className="dropdown-item"
                  onClick={() => setDropdownOpen(false)}
                >
                  <Bookmark size={16} />
                  <span>Bookmarks</span>
                </Link>

                <button
                  type="button"
                  className="dropdown-item danger"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <Link to="/signin" className="nav-link" style={{ fontWeight: 600 }}>
              Sign In
            </Link>
            <Link
              to="/signup"
              className="btn-create-post"
              style={{ padding: '0.45rem 1rem', fontSize: '0.88rem' }}
            >
              Join Route
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
