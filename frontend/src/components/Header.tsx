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
}

export function Header({ selectedState, onStateChange, onLoginClick, onMessagesClick, onRequestsClick, onProfileClick }: HeaderProps) {
  const { user, logout } = useAuth();
  const { unreadMessages, pendingRequests } = useNotifications();

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-brand">
          <div className="header-logo">
            <img src="/logo.png" alt="NepaliWoriPari" className="logo-img" />
          </div>
        </div>
        <div className="header-controls">
          <label htmlFor="state-select" className="state-label">
            State/Territory:
          </label>
          <select
            id="state-select"
            className="state-select"
            value={selectedState}
            onChange={(e) => onStateChange(e.target.value as AustralianState)}
            aria-label="Select Australian state or territory"
          >
            {AUSTRALIAN_STATES.map((state) => (
              <option key={state.value} value={state.value}>
                {state.label}
              </option>
            ))}
          </select>
          <div className="header-auth">
            {user ? (
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
                <button className="auth-btn logout-btn" onClick={logout}>
                  Logout
                </button>
              </div>
            ) : (
              <button className="auth-btn login-btn" onClick={onLoginClick}>
                <span className="login-text-full">Login / Sign Up</span>
                <span className="login-text-short">Login</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
