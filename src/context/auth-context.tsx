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

let app: FirebaseApp | null = null;
let auth: Auth | null = null;

const initializeFirebase = (): Auth | null => {
    if (auth) {
        return auth;
    }

    if (typeof window === 'undefined') {
        return null;
    }
    
    // WARNING: Hardcoding configuration is a security risk.
    // It is strongly recommended to use environment variables.
    const firebaseConfig: FirebaseOptions = {
      apiKey: "AIzaSyADF0r6skU1Hd1C2TfIR6zCYon05ITYlI4",
      authDomain: "expense-tracker-app-1f50d.firebaseapp.com",
      projectId: "expense-tracker-app-1f50d",
      storageBucket: "expense-tracker-app-1f50d.appspot.com",
      messagingSenderId: "935484828246",
      appId: "1:935484828246:web:29e3f332c7d782e62a69f7",
    };

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
    if (initializedAuth) {
        setAuthInstance(initializedAuth);
    } else {
        setLoading(false); // Stop loading if initialization fails
    }
  }, []);
  

  useEffect(() => {
    if (!authInstance) {
      if (loading) setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      setUser(user);
      setUsername(user?.displayName || user?.email || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [authInstance, loading]);

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
            <h1 className="text-2xl font-bold text-destructive">Firebase Initialization Failed</h1>
            <p className="text-muted-foreground">
              The application could not connect to Firebase. This might be due to a network issue or an invalid configuration.
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
