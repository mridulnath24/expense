'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';

interface AuthContextType {
  user: string | null;
  loading: boolean;
  login: (username: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('spendwise_user');
      if (storedUser) {
        setUser(storedUser);
      }
    } catch (error) {
      console.error("Failed to read from localStorage", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (username: string) => {
    try {
      localStorage.setItem('spendwise_user', username);
      setUser(username);
    } catch (error) {
      console.error("Failed to write to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('spendwise_user');
      // Also clear user data upon logout
      if (user) {
        localStorage.removeItem(`spendwise_data_${user}`);
      }
      setUser(null);
    } catch (error) {
      console.error("Failed to remove from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
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
