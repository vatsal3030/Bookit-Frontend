import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'CUSTOMER' | 'PROVIDER' | 'ADMIN' | 'ORGANIZATION';
  contactNo?: string;
  location?: string;
  isVerified: boolean;
  providerProfile?: any;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: any) => Promise<User>;
  googleLogin: (googleData: any) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
  switchRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        
        // Background cache re-hydration resolving Role & Profile desyncs
        api.get('/auth/profile').then(res => {
          if (res.data?.user) {
            setUser(res.data.user);
            localStorage.setItem('user', JSON.stringify(res.data.user));
          }
        }).catch(() => {
          // Keep local storage defaults if network fails temporarily
        });
      } catch {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setIsLoading(false);

    const handleStorageChange = (e: StorageEvent) => {
      // If token changed in another tab, reload to sync State bounds (prevents 403s on mismatched roles)
      if (e.key === 'token') {
        window.location.reload();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveSession = (userData: User, tokenStr: string) => {
    setUser(userData);
    setToken(tokenStr);
    localStorage.setItem('token', tokenStr);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const login = async (email: string, password: string): Promise<User> => {
    const res = await api.post('/auth/login', { email, password });
    saveSession(res.data.user, res.data.token);
    return res.data.user;
  };

  const register = async (data: any): Promise<User> => {
    const res = await api.post('/auth/register', data);
    saveSession(res.data.user, res.data.token);
    return res.data.user;
  };

  const googleLogin = async (googleData: any): Promise<User> => {
    const res = await api.post('/auth/google', googleData);
    saveSession(res.data.user, res.data.token);
    return res.data.user;
  };

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  const refreshProfile = async () => {
    try {
      const res = await api.get('/auth/profile');
      const updatedUser = res.data.user;
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch {
      // Silent fail
    }
  };

  const switchRole = async () => {
    const res = await api.post('/auth/switch-role');
    saveSession(res.data.user, res.data.token);
  };

  return (
    <AuthContext.Provider value={{
      user, token, isLoading,
      isAuthenticated: !!token && !!user,
      login, register, googleLogin, logout, refreshProfile, switchRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
