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
            <a href={`tel:${business.phone}`} className="business-phone" aria-label={`Call ${business.name}`}>
              📞 {business.phone}
            </a>
          )}
          {business.email && (
            <a href={`mailto:${business.email}`} className="business-email" aria-label={`Email ${business.name}`}>
              ✉️ {business.email}
            </a>
          )}
          {business.website && (
            <a
              href={business.website}
              target="_blank"
              rel="noopener noreferrer"
              className="business-website"
              aria-label={`Visit ${business.name} website`}
            >
              🌐 Website
            </a>
          )}
          {business.facebook && (
            <a href={business.facebook} target="_blank" rel="noopener noreferrer" className="business-social">
              📘 Facebook
            </a>
          )}
          {business.instagram && (
            <a href={business.instagram} target="_blank" rel="noopener noreferrer" className="business-social">
              📷 Instagram
            </a>
          )}
          {business.tiktok && (
            <a href={business.tiktok} target="_blank" rel="noopener noreferrer" className="business-social">
              🎵 TikTok
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
