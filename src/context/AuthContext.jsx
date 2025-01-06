import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail,
} from "firebase/auth";

// --- Auth Context ---
const AuthContext = createContext();

// --- Hook to Access Auth Context ---
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- Provider ---
export const AuthProvider = ({ children }) => {
  // --- States ---
  const [currentUser, setCurrentUser] = useState(null); // Current user state
  const [loading, setLoading] = useState(true); // Loading state
  const [idToken, setIdToken] = useState(null); // ID Token for Firestore access

  // --- Signup Function ---
  const signup = async (email, password) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );

      const user = userCredential.user;

      // Force Firebase to reload the user data before returning it
      await user.reload();
      const refreshedUser = auth.currentUser; // Ensure fresh data

      await refreshedUser.getIdToken(true); // Refresh token immediately
      setCurrentUser(refreshedUser); // Update state
      setIdToken(await refreshedUser.getIdToken());

      console.log("Signup successful. User ID:", refreshedUser.uid);
      return refreshedUser; // Return refreshed user
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
        password,
      );
      const user = userCredential.user;

      // Force token refresh
      await user.getIdToken(true);
      setCurrentUser(user);
      setIdToken(await user.getIdToken());

      console.log("Logged in successfully. User ID:", user.uid); // Debugging log
      return user;
    } catch (error) {
      console.error("Login Error:", error.message); // Log errors
      throw error;
    }
  };

  // --- Logout Function ---
  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null); // Clear session
      setIdToken(null); // Clear token
      console.log("Logged out successfully."); // Debug log
    } catch (error) {
      console.error("Logout Error:", error.message); // Log errors
      throw error;
    }
  };

  // --- Update Email ---
  const updateUserEmail = async (newEmail) => {
    if (!auth.currentUser) throw new Error("No user logged in."); // Ensure user is logged in

    try {
      // Update email and force token refresh
      await updateEmail(auth.currentUser, newEmail);
      await auth.currentUser.getIdToken(true); // Refresh token
      await auth.currentUser.reload(); // Reload user data

      setCurrentUser(auth.currentUser); // Sync React state
      setIdToken(await auth.currentUser.getIdToken()); // Update token in state

      console.log("Email updated to:", auth.currentUser.email); // Debugging log
    } catch (error) {
      console.error("Failed to update email:", error.message); // Log errors
      throw error;
    }
  };

  // --- Listener for Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Fetch ID token and claims
        const idTokenResult = await user.getIdTokenResult();
        console.log("User Token Claims:", idTokenResult.claims); // Debugging log

        setCurrentUser(user);
        setIdToken(idTokenResult.token); // Save token in context
      } else {
        setCurrentUser(null);
        setIdToken(null); // Clear token if no user
      }

      setLoading(false); // Done loading
    });

    return unsubscribe; // Cleanup on unmount
  }, []);

  // --- Provide Context ---
  const value = {
    currentUser, // Provide user state
    idToken, // Provide ID token for Firestore queries
    signup,
    login,
    logout,
    updateUserEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Prevent rendering until loading completes */}
    </AuthContext.Provider>
  );
};
