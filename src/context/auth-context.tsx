'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  Auth,
  User,
  getAuth,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { Loader2 } from 'lucide-react';
import { getFirebaseApp } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  const app = getFirebaseApp();
  const auth = app ? getAuth(app) : null;

  useEffect(() => {
    if (!auth) {
        setLoading(false);
        // A console error will be shown from getFirebaseApp()
        return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setUsername(user?.displayName || user?.email || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  const signIn = (email: string, password: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    return signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await updateProfile(user, {
        displayName: `${firstName} ${lastName}`,
    });
    // Manually update the user object after profile update
    setUser({...user, displayName: `${firstName} ${lastName}`});
    setUsername(`${firstName} ${lastName}`);
    return userCredential;
  };

  const signInWithGoogle = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const signInWithFacebook = () => {
    if (!auth) return Promise.reject(new Error("Firebase not initialized"));
    const provider = new FacebookAuthProvider();
    return signInWithPopup(auth, provider);
  };

  const logout = () => {
    if (!auth) return;
    const currentUserId = user?.uid;
    // Clear user-specific data from local storage before signing out
    if (currentUserId) {
        const key = `expense_tracker_data_${currentUserId}`;
        localStorage.removeItem(key);
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
  
  if (!auth) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Firebase Configuration Error</h1>
            <p className="text-muted-foreground">
              The application could not connect to Firebase. Please ensure your 
              <code className="mx-1 rounded bg-muted px-1.5 py-1 font-mono text-sm">.env</code> 
              file is present in the project root and contains valid Firebase credentials.
            </p>
            <p className="text-sm text-muted-foreground">
              After creating or updating the <code className="mx-1 rounded bg-muted px-1.5 py-1 font-mono text-sm">.env</code> file, you must restart the development server.
            </p>
          </div>
       </div>
    )
  }

  return (
    <AuthContext.Provider value={{ user, username, loading, signIn, signUp, signInWithGoogle, signInWithFacebook, logout }}>
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
