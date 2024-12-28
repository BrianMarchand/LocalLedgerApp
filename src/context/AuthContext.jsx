import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";

// Create Auth Context
const AuthContext = createContext();

// Custom Hook
export const useAuth = () => {
  return useContext(AuthContext);
};

// Provider Component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Signup Function ---
  const signup = (email, password) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // --- Login Function ---
  const login = async (email, password) => {
    try {
      return await signInWithEmailAndPassword(auth, email, password); // Firebase Login
    } catch (error) {
      console.error("Firebase Login Error:", error.code, error.message); // Log error details

      // Handle specific Firebase errors
      switch (error.code) {
        case "auth/invalid-email":
          throw new Error("Invalid email format.");
        case "auth/user-disabled":
          throw new Error("This account has been disabled.");
        case "auth/user-not-found":
          throw new Error("No account found with this email.");
        case "auth/wrong-password":
          throw new Error("Incorrect password. Please try again.");
        case "auth/invalid-credential":
          throw new Error("Invalid email or password. Please try again."); // NEW Error Code Handling
        default:
          throw new Error("Login failed. Please try again later.");
      }
    }
  };

  // --- Logout Function ---
  const logout = () => {
    return signOut(auth);
  };

  // --- Track Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  // --- Provide Context Values ---
  const value = {
    currentUser,
    signup,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
