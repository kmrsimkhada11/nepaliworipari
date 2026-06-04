import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

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

export function MyRequests() {
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

  if (!user) return null;

  return (
    <div className="my-requests-section">
      <h2 className="section-title">My Requests</h2>
      <div className="my-requests-list">
        {loading ? (
          <p>Loading...</p>
        ) : posts.length === 0 ? (
          <p className="my-requests-empty">No requests posted yet. Click "Post What you are looking for" to get started.</p>
        ) : (
          posts.map((post) => (
            <div key={post.id} className="my-request-card">
              <div className="my-request-header">
                <div>
                  <h3>{post.title}</h3>
                  <span className="my-request-meta">
                    {post.category_icon} {post.category_name || 'General'} • 📍 {post.city || post.state}
                  </span>
                </div>
                <span className={`status-badge status-${post.status}`}>
                  {post.status}
                </span>
              </div>
              {post.description && <p className="my-request-desc">{post.description}</p>}
              <div className="my-request-footer">
                <span className="my-request-date">{new Date(post.created_at).toLocaleDateString()}</span>
                {post.status === 'open' && (
                  <button className="my-request-close-btn" onClick={() => handleClose(post.id)}>
                    Close
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
