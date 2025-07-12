'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import {
  Auth,
  User,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';


interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setUsername(user?.displayName || user?.email || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return createUserWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    if (!auth) return;
    const currentUserId = user?.uid;
    // Clear user-specific data from local storage before signing out
    if (currentUserId) {
        // The old key was based on username, so let's try to remove that too for migration
        const oldKey = `spendwise_data_${username}`;
        const newKey = `spendwise_data_${currentUserId}`;
        localStorage.removeItem(oldKey);
        localStorage.removeItem(newKey);
    }
    signOut(auth);
  };

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, username, loading, signIn, signUp, signInWithGoogle, logout }}>
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
