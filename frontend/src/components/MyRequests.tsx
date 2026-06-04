import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface MyRequestsProps {
  onPostClick: () => void;
}

interface MyPost {
  id: number;
  title: string;
  description: string;
  state: string;
  city: string;
  budget: string;
  status: string;
  created_at: string;
  category_name: string;
  category_icon: string;
}

export function MyRequests({ onPostClick }: MyRequestsProps) {
  const { user, token } = useAuth();
  const [posts, setPosts] = useState<MyPost[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && token) {
      loadMyPosts();
    }
  }, [user, token]);

  const loadMyPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/service-posts/my-posts`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch {
      console.error('Failed to load my posts');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async (postId: number) => {
    try {
      const res = await fetch(`${API_BASE}/service-posts/${postId}/close`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadMyPosts();
      }
    } catch {
      console.error('Failed to close post');
    }
  };

  const handleDelete = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    try {
      const res = await fetch(`${API_BASE}/service-posts/${postId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadMyPosts();
      }
    } catch {
      console.error('Failed to delete post');
    }
  };

  if (!user) return null;

  return (
    <div className="my-requests-section">
      <div className="provider-dashboard-header">
        <h2>My Requests</h2>
        <button className="register-btn post-needed-btn" onClick={onPostClick}>
          + Post What you are looking for
        </button>
      </div>
      <div className="business-grid">
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p className="my-requests-empty">No requests posted yet.</p>
        ) : (
          posts.map((post) => (
            <article key={post.id} className="business-card">
              <div className="owner-actions-top">
                <button className="edit-btn edit-btn-top" onClick={() => {}}>
                  ✏️
                </button>
                <button className="delete-btn-top" onClick={() => handleDelete(post.id)}>
                  ✕
                </button>
              </div>
              <div className="business-card-header">
                <span className="business-category-icon">{post.category_icon || '📋'}</span>
                <div className="business-card-meta">
                  <span className="business-category-tag">{post.category_name || 'General'}</span>
                  <span className="business-location">📍 {post.city || post.state}</span>
                </div>
              </div>
              <h3 className="business-name">{post.title}</h3>
              {post.description && <p className="business-description">{post.description}</p>}
              {post.budget && <p className="business-description">💰 Budget: {post.budget}</p>}
              <div className="business-card-footer">
                <div className="business-card-actions">
                  <span className={`status-badge status-${post.status}`}>{post.status === 'open' ? 'Active' : post.status}</span>
                  <span className="review-btn">{new Date(post.created_at).toLocaleDateString()}</span>
                  <button className="chat-btn" onClick={() => {}}>
                    💬 Messages
                  </button>
                </div>
                {post.status === 'open' && (
                  <button className="request-service-btn" onClick={() => handleClose(post.id)}>
                    Mark Closed
                  </button>
                )}
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
