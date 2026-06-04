import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { useAuth } from '../context/AuthContext';
import { ChatModal } from '../components/ChatModal';

interface ServicePost {
  id: number;
  title: string;
  description: string;
  state: string;
  city: string;
  budget: string;
  status: string;
  created_at: string;
  seeker_id: number;
  seeker_name: string;
  category_name: string;
  category_icon: string;
}

export function RequestPage() {
  const { id } = useParams<{ id: string }>();
  const { user, token } = useAuth();
  const [post, setPost] = useState<ServicePost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    if (id) {
      loadPost();
    }
  }, [id]);

  const loadPost = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/service-posts/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setError('Request not found');
        return;
      }
      const data = await res.json();
      setPost(data.post || data);
    } catch {
      setError('Failed to load request');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <p>Loading request...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="page-container">
        <p>{error || 'Request not found'}</p>
        <Link to="/" className="breadcrumb-btn">← Back to Home</Link>
      </div>
    );
  }

  const canChat = user && post.seeker_id && user.id !== post.seeker_id;

  return (
    <div className="page-container">
      <Link to="/" className="breadcrumb-btn">← Back to Home</Link>

      <article className="business-detail">
        <div className="business-card-header">
          <span className="business-category-icon">{post.category_icon || '📋'}</span>
          <div className="business-card-meta">
            <span className="business-category-tag">{post.category_name || 'General'}</span>
            <span className={`status-badge status-${post.status}`}>
              {post.status === 'open' ? 'Active' : post.status}
            </span>
          </div>
        </div>

        <h1 className="business-name">{post.title}</h1>

        <p className="business-location">
          📍 {post.city || post.state}
        </p>

        {post.description && (
          <p className="business-description">{post.description}</p>
        )}

        {post.budget && (
          <p className="business-description">💰 Budget: {post.budget}</p>
        )}

        <p className="business-description">
          Posted by: {post.seeker_name} • {new Date(post.created_at).toLocaleDateString()}
        </p>

        <div className="business-card-actions" style={{ marginTop: '1rem' }}>
          {canChat && (
            <button className="chat-btn" onClick={() => setShowChat(true)}>
              💬 Message about this request
            </button>
          )}
        </div>
      </article>

      {canChat && post.seeker_id && (
        <ChatModal
          show={showChat}
          onClose={() => setShowChat(false)}
          businessId={post.id}
          businessName={post.title}
          providerId={post.seeker_id}
        />
      )}
    </div>
  );
}
