// -- Page: firebaseConfig.js --

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// --- Firebase Configuration ---
const firebaseConfig = {
  apiKey: "AIzaSyDQkgErcTqXqLl87E3YUrunkqPQo40CJvM",
  authDomain: "localledger.app", // Matches your custom domain
  projectId: "local-unlimited-tracker",
  storageBucket: "localledger.appspot.com",
  messagingSenderId: "792077217335",
  appId: "1:792077217335:web:57fc86dacfa7db298b19b2",
};

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app); // Firestore export

export default app;
