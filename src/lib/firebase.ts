// A client-side only, singleton for initializing Firebase app.
import { initializeApp, getApps, getApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";

const firebaseConfig: FirebaseOptions = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;

function getFirebaseApp(): FirebaseApp | null {
    if (typeof window === 'undefined') {
        // Return null on the server
        return null;
    }

    if (app) {
        return app;
    }

    if (!firebaseConfig.apiKey) {
        console.error("Firebase API Key is missing. Please check your .env file.");
        return null;
    }

    // Check if Firebase has already been initialized.
    if (!getApps().length) {
        try {
            app = initializeApp(firebaseConfig);
        } catch (e) {
            console.error("Firebase initialization error:", e);
            return null;
        }
    } else {
        // Get the default app if it has already been initialized.
        app = getApp();
    }

    return app;
}

export { getFirebaseApp };
