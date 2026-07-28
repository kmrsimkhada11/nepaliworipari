import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { AustralianState, AUSTRALIAN_STATES } from '../types';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

interface HeaderProps {
  selectedState: AustralianState;
  onStateChange: (state: AustralianState) => void;
  onLoginClick: () => void;
  onMessagesClick: () => void;
  onRequestsClick: () => void;
  onProfileClick: () => void;
  onLogoClick: () => void;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  locationEnabled?: boolean;
  radius?: number;
  onLocationToggle?: () => void;
  onRadiusChange?: (radius: number) => void;
}

export function Header({
  selectedState,
  onStateChange,
  onLoginClick,
  onMessagesClick,
  onRequestsClick,
  onProfileClick,
  onLogoClick,
  searchValue = '',
  onSearchChange,
  locationEnabled,
  radius,
  onLocationToggle,
  onRadiusChange,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const { unreadMessages, pendingRequests } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <header className="header">
        <div className="header-content">
          {/* Left: Logo */}
          <div className="header-left">
            <Link to="/" className="header-logo" onClick={onLogoClick}>
              <img src="/logo.svg" alt="NepaliOriPari" className="logo-img" />
            </Link>
          </div>

          {/* Center: Search bar */}
          <div className="header-center">
            <div className="header-search">
              <svg className="header-search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                className="header-search-input"
                placeholder="Search services..."
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                aria-label="Search businesses"
              />
              {searchValue && (
                <button
                  type="button"
                  className="header-search-clear"
                  onClick={() => { onSearchChange?.(''); searchInputRef.current?.focus(); }}
                  aria-label="Clear"
                >
                  ✕
                </button>
              )}
              {onLocationToggle && (
                !locationEnabled ? (
                  <button type="button" className="header-search-location" onClick={onLocationToggle} title="Near me">
                    <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                  </button>
                ) : (
                  <select
                    className="header-search-radius"
                    value={radius}
                    onChange={(e) => {
                      if (e.target.value === 'off') {
                        onLocationToggle();
                      } else if (onRadiusChange) {
                        onRadiusChange(parseInt(e.target.value));
                      }
                    }}
                  >
                    <option value="5">5km</option>
                    <option value="10">10km</option>
                    <option value="25">25km</option>
                    <option value="50">50km</option>
                    <option value="100">100km</option>
                    <option value="off">✕ Off</option>
                  </select>
                )
              )}
            </div>
          </div>

          {/* Right: User controls */}
          <div className="header-right">
            {user ? (
              <div className="user-menu">
                <button className="auth-btn messages-btn" onClick={onRequestsClick} title="Service Requests">
                  📋
                  {pendingRequests > 0 && <span className="notification-badge">{pendingRequests}</span>}
                </button>
                <button className="auth-btn messages-btn" onClick={onMessagesClick} title="Messages">
                  💬
                  {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
                </button>
                <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
                  <div className="hamburger-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  <div className="hamburger-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                </button>
              </div>
            ) : (
              <div className="user-menu">
                <button className="auth-btn nav-login-btn" onClick={onLoginClick}>
                  Sign up
                </button>
                <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
                  <div className="hamburger-lines">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen && <div className="side-menu-overlay" onClick={() => setMenuOpen(false)} />}
      <aside className={`side-menu ${menuOpen ? 'open' : ''}`}>
        <button className="side-menu-close" onClick={() => setMenuOpen(false)}>✕</button>
        <nav className="side-menu-nav">
          {user && (
            <div className="side-menu-user">
              <div className="side-menu-avatar">{user.name.charAt(0).toUpperCase()}</div>
              <span className="side-menu-username">{user.name}</span>
            </div>
          )}

          {user && (
            <button className="side-menu-item" onClick={() => { onProfileClick(); setMenuOpen(false); }}>
              👤 Profile
            </button>
          )}

          <div className="side-menu-section">
            <label className="side-menu-label">State/Territory</label>
            <select
              className="side-menu-select"
              value={selectedState}
              onChange={(e) => { onStateChange(e.target.value as AustralianState); setMenuOpen(false); }}
            >
              {AUSTRALIAN_STATES.map((state) => (
                <option key={state.value} value={state.value}>{state.label}</option>
              ))}
            </select>
          </div>

          {!user ? (
            <button className="side-menu-item side-menu-login" onClick={() => { onLoginClick(); setMenuOpen(false); }}>
              🔐 Login / Sign Up
            </button>
          ) : (
            <button className="side-menu-item side-menu-logout" onClick={() => { logout(); setMenuOpen(false); }}>
              🚪 Logout
            </button>
          )}
        </nav>
      </aside>
    </>
  );
}
