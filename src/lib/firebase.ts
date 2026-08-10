import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY 
  ? {
      apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
      projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
      appId: import.meta.env.VITE_FIREBASE_APP_ID,
      measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
    }
  : {
      apiKey: "AIzaSyBU8gVVVAVQPyykKWJMgiJM_GfsgSe0fKU",
      authDomain: "connectx-b614a.firebaseapp.com",
      projectId: "connectx-b614a",
      storageBucket: "connectx-b614a.firebasestorage.app",
      messagingSenderId: "450519084412",
      appId: "1:450519084412:web:41a6f4de8c96fbea2e88f9",
      measurementId: "G-6NYRBJQ8NT"
    };

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
export default app;
