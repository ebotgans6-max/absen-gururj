import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

export const firebaseConfig = {
  apiKey: "AIzaSyBDZHbATm38aK95RkkkQrf9mNqHDyXow-E",
  authDomain: "absen-guru-7db66.firebaseapp.com",
  projectId: "absen-guru-7db66",
  storageBucket: "absen-guru-7db66.firebasestorage.app",
  messagingSenderId: "854307793368",
  appId: "1:854307793368:web:cacda954590c07270c6aad"
};

export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const isRealFirebaseConfigured = () => true;
