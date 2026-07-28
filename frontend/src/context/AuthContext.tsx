import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { getMe } from '../api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  loginUser: (user: User, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Set a timeout so the app doesn't stay loading forever if backend is cold
      const timeout = setTimeout(() => {
        setIsLoading(false);
      }, 3000);

      try {
        const data = await getMe(token);
        setUser(data.user);
      } catch {
        // Token is invalid or expired
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
      } finally {
        clearTimeout(timeout);
        setIsLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const loginUser = (user: User, newToken: string) => {
    setUser(user);
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, loginUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
