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

// This function moves the Firebase initialization logic into the AuthProvider
// to ensure it only runs on the client-side and after environment variables are loaded.
let app: FirebaseApp | null = null;
let auth: Auth | null = null;

const initializeFirebase = (): Auth | null => {
    if (auth) {
        return auth;
    }

    if (typeof window === 'undefined') {
        return null;
    }
    
    const firebaseConfig: FirebaseOptions = {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    };

    // This check is crucial. If the API key is missing, we don't initialize.
    if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing. Please check your .env file.");
        return null;
    }

    if (!getApps().length) {
        try {
            app = initializeApp(firebaseConfig);
            auth = getAuth(app);
        } catch (e) {
            console.error("Firebase initialization error:", e);
            return null;
        }
    } else {
        app = getApp();
        auth = getAuth(app);
    }

    return auth;
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);

  useEffect(() => {
    const initializedAuth = initializeFirebase();
    setAuthInstance(initializedAuth);
  }, []);
  

  useEffect(() => {
    if (!authInstance) {
      // If auth is not initialized after the first effect, stop loading.
      // The error screen will be displayed.
      if (loading) setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setUsername(user?.displayName || user?.email || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authInstance]);

  const signIn = (email: string, password: string) => {
    if (!authInstance) return Promise.reject(new Error("Firebase not initialized"));
    return signInWithEmailAndPassword(authInstance, email, password);
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    if (!authInstance) return Promise.reject(new Error("Firebase not initialized"));
    const userCredential = await createUserWithEmailAndPassword(authInstance, email, password);
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
    if (!authInstance) return Promise.reject(new Error("Firebase not initialized"));
    const provider = new GoogleAuthProvider();
    return signInWithPopup(authInstance, provider);
  };

  const signInWithFacebook = () => {
    if (!authInstance) return Promise.reject(new Error("Firebase not initialized"));
    const provider = new FacebookAuthProvider();
    return signInWithPopup(authInstance, provider);
  };

  const logout = () => {
    if (!authInstance) return;
    const currentUserId = user?.uid;
    // Clear user-specific data from local storage before signing out
    if (currentUserId) {
        const key = `expense_tracker_data_${currentUserId}`;
        localStorage.removeItem(key);
    }
    signOut(authInstance);
  };

  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    );
  }
  
  if (!authInstance) {
    return (
       <div className="flex h-screen w-full items-center justify-center bg-background p-4 text-center">
          <div className="max-w-md space-y-4">
            <h1 className="text-2xl font-bold text-destructive">Firebase Configuration Error</h1>
            <p className="text-muted-foreground">
              The application could not connect to Firebase. Please ensure your 
              <code className="mx-1 rounded bg-muted px-1.5 py-1 font-mono text-sm">.env</code> 
              file is present in the project root and contains valid Firebase credentials prefixed with <code className="mx-1 rounded bg-muted px-1.5 py-1 font-mono text-sm">NEXT_PUBLIC_</code>.
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
