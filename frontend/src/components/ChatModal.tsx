import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface Message {
  id?: number;
  sender_id: number;
  receiver_id?: number;
  content: string;
  sender_name?: string;
  created_at: string;
}

interface ChatModalProps {
  show: boolean;
  onClose: () => void;
  businessId: number;
  businessName: string;
  providerId: number;
}

export function ChatModal({ show, onClose, businessId, businessName, providerId }: ChatModalProps) {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (show && token && user) {
      const sorted = [user.id, providerId].sort((a, b) => a - b);
      const convId = `${sorted[0]}_${sorted[1]}_${businessId}`;
      setConversationId(convId);

      loadMessages(convId);

      // Poll for new messages every 5 seconds
      pollRef.current = setInterval(() => loadMessages(convId), 5000);

      return () => {
        if (pollRef.current) clearInterval(pollRef.current);
      };
    }
  }, [show, token, user, businessId, providerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async (convId: string) => {
    try {
      const res = await fetch(`${API_BASE}/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !conversationId || !user) return;

    const content = newMessage.trim();
    setNewMessage('');

    // Optimistically add message to local state
    setMessages((prev) => [...prev, {
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
    }]);

    // Send via API
    try {
      await fetch(`${API_BASE}/messages/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: providerId,
          businessId,
          content,
        }),
      });
    } catch {
      // Message already shown optimistically
    }
  };

  if (!show || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <h3>💬 {businessName}</h3>
            <span className="chat-subtitle">Chat with provider</span>
          </div>
          <div className="chat-header-actions">
            <button
              type="button"
              className="chat-view-btn"
              onClick={() => { navigate(`/business/${businessId}`); onClose(); }}
            >
              👁️ View
            </button>
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
        </div>

        <div className="chat-messages">
          {loading ? (
            <p className="chat-loading">Loading messages...</p>
          ) : messages.length === 0 ? (
            <p className="chat-empty">No messages yet. Start the conversation!</p>
          ) : (
            messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`chat-bubble ${msg.sender_id === user.id ? 'sent' : 'received'}`}
              >
                <p>{msg.content}</p>
                <span className="chat-time">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSend} className="chat-input-form">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
            autoFocus
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
