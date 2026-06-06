import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { useAuth } from '../context/AuthContext';
import { API_BASE } from '../config';

interface Message {
  id?: number;
  sender_id: number;
  content: string;
  sender_name?: string;
  created_at: string;
  is_read?: boolean;
  reply_to_id?: number;
  reply_content?: string;
  reply_sender_name?: string;
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
  const [showEmoji, setShowEmoji] = useState(false);
  const [replyTo, setReplyTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (show && token && user) {
      const sorted = [user.id, providerId].sort((a, b) => a - b);
      const convId = `${sorted[0]}_${sorted[1]}_${businessId}`;
      setConversationId(convId);
      loadMessages(convId);
      pollRef.current = setInterval(() => loadMessages(convId), 5000);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
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
    } catch {} finally { setLoading(false); }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !token || !conversationId || !user) return;

    const content = newMessage.trim();
    setNewMessage('');
    setShowEmoji(false);

    setMessages((prev) => [...prev, {
      sender_id: user.id,
      content,
      created_at: new Date().toISOString(),
      reply_to_id: replyTo?.id,
      reply_content: replyTo?.content,
      reply_sender_name: replyTo?.sender_name,
    }]);

    setReplyTo(null);

    try {
      await fetch(`${API_BASE}/messages/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ receiverId: providerId, businessId, content, replyToId: replyTo?.id }),
      });
    } catch {}
  };

  const onEmojiClick = (emojiData: EmojiClickData) => {
    setNewMessage(prev => prev + emojiData.emoji);
  };

  if (!show || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <div>
            <h3>💬 {businessName}</h3>
            <span className="chat-subtitle">Chat</span>
          </div>
          <div className="chat-header-actions">
            <button type="button" className="chat-view-btn" onClick={() => { navigate(`/business/${businessId}`); onClose(); }}>
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
                {msg.reply_content && (
                  <div className="chat-reply-preview">
                    <span className="chat-reply-name">{msg.reply_sender_name || 'User'}</span>
                    <span className="chat-reply-text">{msg.reply_content}</span>
                  </div>
                )}
                <p>{msg.content}</p>
                <div className="chat-bubble-footer">
                  <span className="chat-time">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.sender_id === user.id && (
                      <span className={`chat-seen ${msg.is_read ? 'seen' : ''}`}>
                        {msg.is_read ? ' ✓✓' : ' ✓'}
                      </span>
                    )}
                  </span>
                  <button className="chat-reply-btn" onClick={() => setReplyTo(msg)}>↩</button>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {replyTo && (
          <div className="chat-reply-bar">
            <div className="chat-reply-info">
              <span>Replying to: </span>
              <span className="chat-reply-text">{replyTo.content.substring(0, 50)}{replyTo.content.length > 50 ? '...' : ''}</span>
            </div>
            <button className="chat-reply-cancel" onClick={() => setReplyTo(null)}>✕</button>
          </div>
        )}

        {showEmoji && (
          <div className="emoji-picker-container">
            <EmojiPicker onEmojiClick={onEmojiClick} width="100%" height={300} />
          </div>
        )}

        <form onSubmit={handleSend} className="chat-input-form">
          <button type="button" className="emoji-toggle-btn" onClick={() => setShowEmoji(!showEmoji)}>
            😊
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="chat-input"
          />
          <button type="submit" className="chat-send-btn" disabled={!newMessage.trim()}>
            ➤
          </button>
        </form>
      </div>
    </div>
  );
}
