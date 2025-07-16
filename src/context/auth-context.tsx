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
  sendPasswordResetEmail,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, type Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { type AppData } from '@/lib/types';

const defaultData: AppData = {
  transactions: [],
  categories: {
    income: ['Salary', 'Bonus', 'Gifts', 'Freelance'],
    expense: [
      'Food',
      'Transport',
      'Utilities',
      'House Rent',
      'Entertainment',
      'Health',
      'Shopping',
      'Other',
      'Grocery',
      'DPS',
      'EMI',
      'Medical',
      'Electricity Bill',
      'Gas Bill',
      'Wifi Bill',
    ],
  },
};

interface AuthContextType {
  user: User | null;
  username: string | null;
  loading: boolean;
  db: Firestore | null;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<any>;
  signInWithGoogle: () => Promise<any>;
  signInWithFacebook: () => Promise<any>;
  logout: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

const initializeFirebase = (): { auth: Auth | null, db: Firestore | null } => {
    if (auth && db) {
        return { auth, db };
    }

    if (typeof window === 'undefined') {
        return { auth: null, db: null };
    }
    
    const firebaseConfig: FirebaseOptions = {
      apiKey: "YOUR_FIREBASE_API_KEY",
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
            db = getFirestore(app);
        } catch (e) {
            console.error("Firebase initialization error:", e);
            return { auth: null, db: null };
        }
    } else {
        app = getApp();
        auth = getAuth(app);
        db = getFirestore(app);
    }

    return { auth, db };
}


export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInstance, setAuthInstance] = useState<Auth | null>(null);
  const [dbInstance, setDbInstance] = useState<Firestore | null>(null);

  useEffect(() => {
    const { auth: initializedAuth, db: initializedDb } = initializeFirebase();
    if (initializedAuth && initializedDb) {
        setAuthInstance(initializedAuth);
        setDbInstance(initializedDb);
    } else {
        setLoading(false);
    }
  }, []);
  
  const handleUserAuth = async (user: User | null) => {
    setLoading(true);
    if (user && dbInstance) {
      const userDocRef = doc(dbInstance, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (!userDoc.exists()) {
        await setDoc(userDocRef, defaultData);
      }
      setUser(user);
      setUsername(user.displayName || user.email || null);
    } else {
      setUser(null);
      setUsername(null);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (!authInstance) {
      if (loading) setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(authInstance, (user) => {
      handleUserAuth(user);
    });

    return () => unsubscribe();
  }, [authInstance, dbInstance]);

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
    // The onAuthStateChanged listener will handle creating the user document.
    // We just need to update the user state locally for immediate feedback.
    setUsername(`${firstName} ${lastName}`);
    setUser(user);

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
    signOut(authInstance);
  };

  const sendPasswordReset = (email: string) => {
    if (!authInstance) return Promise.reject(new Error("Firebase not initialized"));
    return sendPasswordResetEmail(authInstance, email);
  }

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
    <AuthContext.Provider value={{ user, username, loading, db: dbInstance, signIn, signUp, signInWithGoogle, signInWithFacebook, logout, sendPasswordReset }}>
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
