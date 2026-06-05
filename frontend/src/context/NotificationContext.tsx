import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { API_BASE } from '../config';

interface NotificationContextType {
  unreadMessages: number;
  pendingRequests: number;
  refreshCounts: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { user, token } = useAuth();
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [pendingRequests, setPendingRequests] = useState(0);

  const fetchCounts = useCallback(async () => {
    if (!token) return;

    try {
      const [msgRes, reqRes] = await Promise.all([
        fetch(`${API_BASE}/messages/unread-count`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API_BASE}/service-requests/pending-count`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setUnreadMessages(msgData.unreadCount);
      }
      if (reqRes.ok) {
        const reqData = await reqRes.json();
        setPendingRequests(reqData.pendingCount);
      }
    } catch {
      // Silent fail
    }
  }, [token]);

  useEffect(() => {
    if (user && token) {
      fetchCounts();

      // Poll for notifications every 60 seconds
      const interval = setInterval(fetchCounts, 60000);
      return () => clearInterval(interval);
    } else {
      setUnreadMessages(0);
      setPendingRequests(0);
    }
  }, [user, token, fetchCounts]);

  const refreshCounts = useCallback(() => {
    fetchCounts();
  }, [fetchCounts]);

  return (
    <NotificationContext.Provider value={{ unreadMessages, pendingRequests, refreshCounts }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
