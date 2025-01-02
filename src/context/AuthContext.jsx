import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateEmail, // Import updateEmail
} from "firebase/auth";

// --- Auth Context ---
const AuthContext = createContext();

// --- Hook to Access Auth Context ---
export const useAuth = () => {
  return useContext(AuthContext);
};

// --- Provider ---
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Current user state
  const [loading, setLoading] = useState(true); // Loading state

  // --- Signup Function ---
  const signup = async (email, password) => {
    return await createUserWithEmailAndPassword(auth, email, password);
  };

  // --- Login Function ---
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password,
    );
    setCurrentUser(userCredential.user); // Sync session immediately
    return userCredential.user;
  };

  // --- Logout Function ---
  const logout = async () => {
    await signOut(auth);
    setCurrentUser(null); // Clear local session
  };

  // --- Update Email ---
  const updateUserEmail = async (newEmail) => {
    if (!auth.currentUser) throw new Error("No user logged in."); // Ensure user is logged in

    try {
      // Update email and reload user
      await updateEmail(auth.currentUser, newEmail);
      await auth.currentUser.reload(); // Ensure updated info is available
      setCurrentUser(auth.currentUser); // Sync React state

      console.log("Email updated to:", auth.currentUser.email); // Debugging log
    } catch (error) {
      console.error("Failed to update email:", error.message);
      throw error;
    }
  };
  // --- Listener for Auth State ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // Sync user state
      setLoading(false); // Done loading
    });
    return unsubscribe; // Cleanup on unmount
  }, []);

  // --- Provide Context ---
  const value = {
    currentUser, // Provide currentUser inside the context
    signup,
    login,
    logout,
    updateUserEmail, // Export this for Profile.jsx
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Prevent rendering until loading completes */}
    </AuthContext.Provider>
  );
};
