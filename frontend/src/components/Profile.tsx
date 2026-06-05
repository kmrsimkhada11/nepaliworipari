import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface ServiceHistory {
  id: number;
  business_id: number;
  business_name: string;
  city: string;
  business_state: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

interface ProfileProps {
  show: boolean;
  onClose: () => void;
}

export function Profile({ show, onClose }: ProfileProps) {
  const { user, token, logout } = useAuth();
  const [history, setHistory] = useState<ServiceHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (show && token) {
      loadHistory();
    }
  }, [show, token]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/service-requests/my-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.requests);
      }
    } catch {
      console.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  if (!show || !user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="status-badge status-pending">Pending</span>;
      case 'accepted': return <span className="status-badge status-accepted">In Progress</span>;
      case 'completed': return <span className="status-badge status-completed">Completed</span>;
      case 'rejected': return <span className="status-badge status-rejected">Rejected</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>

        <div className="profile-header">
          <div className="profile-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="profile-info">
            <h2>{user.name}</h2>
            <p className="profile-email">{user.email}</p>
            {user.city && user.state && (
              <p className="profile-location">📍 {user.city}, {user.state}</p>
            )}
          </div>
        </div>

        {user && (
          <>
            <h3 className="profile-section-title">Service History</h3>
            <div className="profile-history">
              {loading ? (
                <p className="chat-loading">Loading...</p>
              ) : history.length === 0 ? (
                <p className="chat-empty">No services used yet.</p>
              ) : (
                history.map((item) => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-header">
                      <strong>{item.business_name}</strong>
                      {getStatusBadge(item.status)}
                    </div>
                    <span className="history-location">📍 {item.city}, {item.business_state}</span>
                    <span className="history-date">
                      Requested: {new Date(item.created_at).toLocaleDateString()}
                      {item.completed_at && ` • Completed: ${new Date(item.completed_at).toLocaleDateString()}`}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <button className="profile-logout-btn" onClick={() => { logout(); onClose(); }}>
          Logout
        </button>
      </div>
    </div>
  );
}
