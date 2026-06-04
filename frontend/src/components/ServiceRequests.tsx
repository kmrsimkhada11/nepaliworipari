import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface ServiceRequest {
  id: number;
  business_id: number;
  business_name: string;
  seeker_name: string;
  seeker_phone: string;
  seeker_email: string;
  status: string;
  note: string;
  created_at: string;
  completed_at: string | null;
}

interface ServiceRequestsProps {
  show: boolean;
  onClose: () => void;
}

export function ServiceRequests({ show, onClose }: ServiceRequestsProps) {
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const isProvider = user?.role === 'provider';

  useEffect(() => {
    if (show && token) {
      loadRequests();
    }
  }, [show, token]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const endpoint = isProvider ? `${API_BASE}/service-requests/provider-requests` : `${API_BASE}/service-requests/my-requests`;
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests);
      }
    } catch {
      console.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (requestId: number, status: string) => {
    try {
      const res = await fetch(`${API_BASE}/service-requests/${requestId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        loadRequests();
      }
    } catch {
      console.error('Failed to update status');
    }
  };

  if (!show || !user) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <span className="status-badge status-pending">Pending</span>;
      case 'accepted': return <span className="status-badge status-accepted">Accepted</span>;
      case 'completed': return <span className="status-badge status-completed">Completed</span>;
      case 'rejected': return <span className="status-badge status-rejected">Rejected</span>;
      default: return <span className="status-badge">{status}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content service-requests-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2>📋 {isProvider ? 'Incoming Requests' : 'My Service Requests'}</h2>

        <div className="requests-list">
          {loading ? (
            <p className="chat-loading">Loading...</p>
          ) : requests.length === 0 ? (
            <p className="chat-empty">No service requests yet.</p>
          ) : (
            requests.map((req) => (
              <div key={req.id} className="request-item">
                <div className="request-item-header">
                  <strong className="request-link" onClick={() => { navigate(`/business/${req.business_id}`); onClose(); }}>{req.business_name}</strong>
                  {getStatusBadge(req.status)}
                </div>
                {isProvider && (
                  <div className="request-seeker-info">
                    <span>👤 {req.seeker_name}</span>
                    {req.seeker_phone && <span>📞 {req.seeker_phone}</span>}
                    {req.seeker_email && <span>✉️ {req.seeker_email}</span>}
                  </div>
                )}
                {req.note && <p className="request-note">Note: {req.note}</p>}
                <span className="request-date">{new Date(req.created_at).toLocaleDateString()}</span>

                {isProvider && req.status === 'pending' && (
                  <div className="request-actions">
                    <button className="action-btn accept-btn" onClick={() => updateStatus(req.id, 'accepted')}>
                      ✓ Accept
                    </button>
                    <button className="action-btn reject-btn" onClick={() => updateStatus(req.id, 'rejected')}>
                      ✗ Reject
                    </button>
                  </div>
                )}
                {isProvider && req.status === 'accepted' && (
                  <div className="request-actions">
                    <button className="action-btn complete-btn" onClick={() => updateStatus(req.id, 'completed')}>
                      ✓ Mark Completed
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
