// --- Import Firebase Dependencies ---
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDQkgErcTqXqLl87E3YUrunkqPQo40CJvM",
  authDomain: "local-unlimited-tracker.firebaseapp.com",
  projectId: "local-unlimited-tracker",
  storageBucket: "local-unlimited-tracker.appspot.com", // <-- Fixed typo
  messagingSenderId: "792077217335",
  appId: "1:792077217335:web:57fc86dacfa7db298b19b2",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app); // Export Authentication
export const db = getFirestore(app); // Export Firestore
export default app; // Default Firebase export
