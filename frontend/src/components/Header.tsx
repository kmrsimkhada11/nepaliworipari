import { useState } from 'react';
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
  onListBusinessClick: () => void;
  onFindNearMe: () => void;
  mode: 'seeker' | 'provider';
  onModeChange: (mode: 'seeker' | 'provider') => void;
}

export function Header({ selectedState, onStateChange, onLoginClick, onMessagesClick, onRequestsClick, onProfileClick, onListBusinessClick, onFindNearMe, mode, onModeChange }: HeaderProps) {
  const { user, logout } = useAuth();
  const { unreadMessages, pendingRequests } = useNotifications();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <header className="header">
        <div className="header-content">
          <div className="header-brand">
            <div className="header-logo">
              <img src="/logo.svg" alt="NepaliOriPari" className="logo-img" />
            </div>
          </div>
          <div className="header-controls">
            {user && (
              <div className="user-menu">
                <button className="auth-btn profile-btn" onClick={onProfileClick} title={user.name}>
                  {user.name.charAt(0).toUpperCase()}
                </button>
                <button className="auth-btn messages-btn" onClick={onRequestsClick} title="Service Requests">
                  📋
                  {pendingRequests > 0 && <span className="notification-badge">{pendingRequests}</span>}
                </button>
                <button className="auth-btn messages-btn" onClick={onMessagesClick} title="Messages">
                  💬
                  {unreadMessages > 0 && <span className="notification-badge">{unreadMessages}</span>}
                </button>
              </div>
            )}
            <button className="hamburger-btn" onClick={() => setMenuOpen(true)} aria-label="Menu">
              <span></span>
              <span></span>
              <span></span>
            </button>
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
            <div className="side-menu-section">
              <label className="side-menu-label">Mode</label>
              <div className="mode-toggle">
                <button
                  className={`mode-btn ${mode === 'seeker' ? 'active' : ''}`}
                  onClick={() => { onModeChange('seeker'); setMenuOpen(false); }}
                >
                  🔍 Seeker
                </button>
                <button
                  className={`mode-btn ${mode === 'provider' ? 'active' : ''}`}
                  onClick={() => { onModeChange('provider'); setMenuOpen(false); }}
                >
                  🏪 Provider
                </button>
              </div>
            </div>
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

          <button className="side-menu-item" onClick={() => { onFindNearMe(); setMenuOpen(false); }}>
            📍 Find Near Me
          </button>
          <button className="side-menu-item" onClick={() => { onListBusinessClick(); setMenuOpen(false); }}>
            ➕ List Your Business
          </button>

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
