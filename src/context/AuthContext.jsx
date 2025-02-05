import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "@config";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
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

      // Refresh the user object to get updated emailVerified status
      await user.reload();

      // Optional: add a short delay to help ensure propagation
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Force refresh the token to update claims
      await user.getIdToken(true);

      // Get the updated user object from auth.currentUser
      const updatedUser = auth.currentUser;

      console.log(
        "User emailVerified after reload:",
        updatedUser.emailVerified
      );

      if (!updatedUser.emailVerified) {
        throw new Error(
          "Email Not Verified! Please verify your email before logging in."
        );
      }

      setCurrentUser(updatedUser);
      console.log("Login successful. User ID:", updatedUser.uid);
      return updatedUser;
    } catch (error) {
      console.error("Login Error:", error.message);
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

  // --- Resend Email Verification Function ---
  const resendEmailVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
      console.log("Verification email re-sent to:", auth.currentUser.email);
    }
  };

  // --- Refresh User Function ---
  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      // Update the state with the reloaded user object.
      setCurrentUser(auth.currentUser);
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
        logout,
        resetPassword,
        resendEmailVerification,
        refreshUser, // expose refreshUser to your app
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
