import { useState } from 'react';
import { Business } from '../types';
import { ReviewSection } from './ReviewSection';
import { ChatModal } from './ChatModal';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface BusinessCardProps {
  business: Business;
}

export function BusinessCard({ business }: BusinessCardProps) {
  const { user, token } = useAuth();
  const [showReviews, setShowReviews] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [requestStatus, setRequestStatus] = useState<string | null>(null);

  const isSeeker = user?.role === 'seeker';
  const canChat = isSeeker && business.user_id && business.user_id !== user?.id;

  const handleRequestService = async () => {
    if (!token) return;
    setRequesting(true);
    try {
      const res = await fetch(`${API_BASE}/service-requests/${business.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ note: '' }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequestStatus('pending');
      } else {
        setRequestStatus(data.error?.includes('already') ? 'already' : 'error');
      }
    } catch {
      setRequestStatus('error');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <>
      <article className="business-card">
        <div className="business-card-header">
          <span className="business-category-icon">{business.category_icon}</span>
          <div className="business-card-meta">
            <span className="business-category-tag">{business.category_name}</span>
            <span className="business-location">
              📍 {business.city}, {business.state}
              {business.distance_km !== undefined && (
                <span className="business-distance"> • {business.distance_km.toFixed(1)} km away</span>
              )}
            </span>
          </div>
        </div>
        <h3 className="business-name">{business.name}</h3>
        {business.description && (
          <p className="business-description">{business.description}</p>
        )}
        <div className="business-contact">
          {business.phone && (
            <a href={`tel:${business.phone}`} className="business-social phone" aria-label={`Call ${business.name}`}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
            </a>
          )}
          {business.email && (
            <a href={`mailto:${business.email}`} className="business-social email" aria-label={`Email ${business.name}`}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/></svg>
            </a>
          )}
          {business.website && (
            <a href={business.website} target="_blank" rel="noopener noreferrer" className="business-social website" aria-label={`Visit ${business.name} website`}>
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>
            </a>
          )}
          {business.facebook && (
            <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="business-social facebook" aria-label="Facebook">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
            </a>
          )}
          {business.instagram && (
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="business-social instagram" aria-label="Instagram">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          )}
          {business.tiktok && (
            <a href={business.tiktok} target="_blank" rel="noopener noreferrer" className="business-social tiktok" aria-label="TikTok">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.88 2.89 2.89 0 01-2.88-2.88 2.89 2.89 0 012.88-2.88c.28 0 .56.04.82.11v-3.5a6.37 6.37 0 00-.82-.05A6.34 6.34 0 003.15 15.7a6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.34-6.34V9.41a8.16 8.16 0 004.76 1.52v-3.4a4.85 4.85 0 01-1-.84z"/></svg>
            </a>
          )}
        </div>
        <div className="business-card-footer">
          <div className="business-card-actions">
            <button className="review-btn" onClick={() => setShowReviews(true)}>
              ⭐ Reviews
            </button>
            {canChat && (
              <button className="chat-btn" onClick={() => setShowChat(true)}>
                💬 Chat
              </button>
            )}
            {isSeeker && business.user_id && (
              <button
                className="request-service-btn"
                onClick={handleRequestService}
                disabled={requesting || requestStatus === 'pending' || requestStatus === 'already'}
              >
                {requestStatus === 'pending' || requestStatus === 'already'
                  ? '✓ Requested'
                  : requesting
                  ? 'Requesting...'
                  : '📋 Request Service'}
              </button>
            )}
          </div>
          {business.is_featured && <span className="featured-badge">⭐ Featured</span>}
        </div>
      </article>
      <ReviewSection
        businessId={business.id}
        businessName={business.name}
        show={showReviews}
        onClose={() => setShowReviews(false)}
      />
      {canChat && (
        <ChatModal
          show={showChat}
          onClose={() => setShowChat(false)}
          businessId={business.id}
          businessName={business.name}
          providerId={business.user_id!}
        />
      )}
    </>
  );
}
