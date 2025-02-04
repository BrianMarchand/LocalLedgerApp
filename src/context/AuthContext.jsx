// File: src/context/AuthContext.jsx

import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification, // <-- Import sendEmailVerification
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Signup Function ---
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Send verification email
      await sendEmailVerification(user);
      console.log("Signup successful. Verification email sent to:", user.email);

      setCurrentUser(user);
      return user;
    } catch (error) {
      console.error("Signup Error:", error.message);
      throw error;
    }
  };

  // --- Login Function ---
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Optionally, you can check if the email is verified before proceeding.
      if (!user.emailVerified) {
        throw new Error(
          "Email Not Verified! Please verify your email before logging in."
        );
      }

      setCurrentUser(user);
      console.log("Login successful. User ID:", user.uid);
      return user;
    } catch (error) {
      console.error("Login Error:", error.message);
      throw error;
    }
  };

  // --- Google Login Function ---
  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;
      setCurrentUser(user);
      console.log("Google login successful. User ID:", user.uid);
      return user;
    } catch (error) {
      console.error("Google Login Error:", error.message);
      throw error;
    }
  };

  // --- Logout Function ---
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      console.log("Logged out successfully.");
    } catch (error) {
      console.error("Logout Error:", error.message);
      throw error;
    }
  };

  // --- Reset Password Function ---
  const resetPassword = async (email) => {
    const actionCodeSettings = {
      url:
        process.env.NODE_ENV === "development"
          ? "http://localhost:5173/password-reset"
          : "https://localledger.app/password-reset",
      handleCodeInApp: true,
    };
    try {
      await sendPasswordResetEmail(auth, email, actionCodeSettings);
      console.log("Password reset email sent to:", email);
    } catch (error) {
      console.error("Reset Password Error:", error.message);
      throw error;
    }
  };

  // --- Listen for Authentication State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user || null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        signup,
        login,
        loginWithGoogle,
        logout,
        resetPassword,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
