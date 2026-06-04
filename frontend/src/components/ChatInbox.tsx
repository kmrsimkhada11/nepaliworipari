import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ChatModal } from './ChatModal';
import { API_BASE } from '../config';

interface Conversation {
  conversation_id: string;
  business_id: number;
  business_name: string;
  last_message: string;
  last_message_at: string;
  other_user_id: number;
  other_user_name: string;
  unread_count: string;
  conversation_status: string;
  initiator_id: number;
}

interface ChatInboxProps {
  show: boolean;
  onClose: () => void;
}

export function ChatInbox({ show, onClose }: ChatInboxProps) {
  const { token, user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeChat, setActiveChat] = useState<Conversation | null>(null);

  useEffect(() => {
    if (show && token) {
      loadConversations();
    }
  }, [show, token]);

  const loadConversations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/messages/conversations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
      }
    } catch {
      console.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/accept`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadConversations();
      }
    } catch {
      console.error('Failed to accept');
    }
  };

  const handleReject = async (conversationId: string) => {
    try {
      const res = await fetch(`${API_BASE}/messages/conversations/${conversationId}/reject`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadConversations();
      }
    } catch {
      console.error('Failed to reject');
    }
  };

  if (!show || !user) return null;

  if (activeChat) {
    return (
      <ChatModal
        show={true}
        onClose={() => {
          setActiveChat(null);
          loadConversations();
        }}
        businessId={activeChat.business_id}
        businessName={activeChat.business_name}
        providerId={activeChat.other_user_id}
      />
    );
  }

  const isPending = (conv: Conversation) => conv.conversation_status === 'pending';
  const isReceiver = (conv: Conversation) => conv.initiator_id !== user.id;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-inbox-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <h2>💬 Messages</h2>

        <div className="inbox-list">
          {loading ? (
            <p className="chat-loading">Loading conversations...</p>
          ) : conversations.length === 0 ? (
            <p className="chat-empty">No messages yet.</p>
          ) : (
            conversations.map((conv) => (
              <div key={conv.conversation_id} className="inbox-item-wrapper">
                {isPending(conv) && isReceiver(conv) ? (
                  // Pending conversation - receiver needs to accept/reject
                  <div className="inbox-item inbox-item-pending">
                    <div className="inbox-item-info">
                      <strong>{conv.other_user_name}</strong>
                      <span className="inbox-business-name">Re: {conv.business_name}</span>
                      <p className="inbox-last-message">"{conv.last_message}"</p>
                    </div>
                    <div className="inbox-actions">
                      <button className="action-btn accept-btn" onClick={() => handleAccept(conv.conversation_id)}>
                        ✓ Accept
                      </button>
                      <button className="action-btn reject-btn" onClick={() => handleReject(conv.conversation_id)}>
                        ✗ Decline
                      </button>
                    </div>
                  </div>
                ) : isPending(conv) && !isReceiver(conv) ? (
                  // Pending - initiator waiting
                  <div className="inbox-item inbox-item-waiting">
                    <div className="inbox-item-info">
                      <strong>{conv.other_user_name}</strong>
                      <span className="inbox-business-name">Re: {conv.business_name}</span>
                      <p className="inbox-last-message">Waiting for response...</p>
                    </div>
                    <span className="status-badge status-pending">Pending</span>
                  </div>
                ) : conv.conversation_status === 'rejected' ? (
                  // Rejected
                  <div className="inbox-item inbox-item-rejected">
                    <div className="inbox-item-info">
                      <strong>{conv.other_user_name}</strong>
                      <span className="inbox-business-name">Re: {conv.business_name}</span>
                      <p className="inbox-last-message">Conversation declined</p>
                    </div>
                    <span className="status-badge status-rejected">Declined</span>
                  </div>
                ) : (
                  // Accepted - can open chat
                  <button
                    className="inbox-item"
                    onClick={() => setActiveChat(conv)}
                  >
                    <div className="inbox-item-info">
                      <strong>{conv.other_user_name}</strong>
                      <span className="inbox-business-name">Re: {conv.business_name}</span>
                      <p className="inbox-last-message">{conv.last_message}</p>
                    </div>
                    <div className="inbox-item-meta">
                      <span className="inbox-time">
                        {new Date(conv.last_message_at).toLocaleDateString()}
                      </span>
                      {parseInt(conv.unread_count) > 0 && (
                        <span className="inbox-unread">{conv.unread_count}</span>
                      )}
                    </div>
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
