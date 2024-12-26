// Import the functions you need from the SDKs you need
// Import the necessary functions from Firebase SDK
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDQkgErcTqXqLl87E3YUrunkqPQo40CJvM",
  authDomain: "local-unlimited-tracker.firebaseapp.com",
  projectId: "local-unlimited-tracker",
  storageBucket: "local-unlimited-tracker.firebasestorage.app",
  messagingSenderId: "792077217335",
  appId: "1:792077217335:web:57fc86dacfa7db298b19b2"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);  // Firestore initialization

// Export db to use in other files
export { db };