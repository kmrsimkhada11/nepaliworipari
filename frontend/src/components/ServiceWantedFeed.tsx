import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';
import { ChatModal } from './ChatModal';

interface ServicePost {
  id: number;
  seeker_id: number;
  title: string;
  description: string;
  state: string;
  city: string;
  budget: string;
  status: string;
  created_at: string;
  seeker_name: string;
  category_name: string;
  category_icon: string;
  parent_category_name: string;
}

export function ServiceWantedFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ServicePost[]>([]);
  const [loading, setLoading] = useState(false);
  const [chatPost, setChatPost] = useState<ServicePost | null>(null);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/service-posts`);
      if (res.ok) {
        const data = await res.json();
        setPosts(data.posts);
      }
    } catch {
      console.error('Failed to load service posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post => !user || post.seeker_id !== user.id);

  if (loading) {
    return <div className="loading"><div className="loading-spinner"></div><p>Loading requests...</p></div>;
  }

  if (filteredPosts.length === 0) {
    return (
      <div className="empty-state">
        <span className="empty-icon">📋</span>
        <h3>No service requests yet</h3>
        <p>When seekers post what they need, it will appear here.</p>
      </div>
    );
  }

  return (
    <>
      <div className="service-wanted-feed">
        <h2 className="section-title">🔍 People Looking for Services</h2>
        <div className="service-posts-grid">
          {filteredPosts.map((post) => (
            <div key={post.id} className="service-post-card">
              <div className="service-post-header">
                {post.category_icon && <span className="service-post-icon">{post.category_icon}</span>}
                <div>
                  <span className="service-post-category">
                    {post.parent_category_name ? `${post.parent_category_name} → ` : ''}{post.category_name || 'General'}
                  </span>
                  <span className="service-post-location">📍 {post.city || post.state}</span>
                </div>
              </div>
              <h3 className="service-post-title">{post.title}</h3>
              {post.description && <p className="service-post-desc">{post.description}</p>}
              <div className="service-post-meta">
                <span>👤 {post.seeker_name}</span>
                {post.budget && <span>💰 {post.budget}</span>}
                <span>🕐 {new Date(post.created_at).toLocaleDateString()}</span>
              </div>
              {user?.role === 'provider' && (
                <button className="service-post-contact-btn" onClick={() => setChatPost(post)}>
                  💬 Message {post.seeker_name.split(' ')[0]}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {chatPost && user && (
        <ChatModal
          show={true}
          onClose={() => setChatPost(null)}
          businessId={chatPost.id}
          businessName={chatPost.title}
          providerId={chatPost.seeker_id}
        />
      )}
    </>
  );
}
