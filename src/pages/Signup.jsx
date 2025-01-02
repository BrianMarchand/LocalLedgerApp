import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { sendPasswordResetEmail } from "firebase/auth";
import { db } from "../firebaseConfig"; // Firestore instance
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  // --- Email Validation ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss(); // Clear previous toasts

    // --- Input Validation ---
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields!"); // Error Toast
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Invalid email format!"); // Error Toast
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!"); // Error Toast
      return;
    }

    try {
      setLoading(true); // Start loading spinner

      // --- Create user in Firebase Auth ---
      const userCredential = await signup(email, password);
      const user = userCredential.user; // Newly created user

      // --- Add user to Firestore ---
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, // Store email
        displayName: "", // Optional field, can be updated later
        role: "user", // Default role
        createdAt: serverTimestamp(), // Timestamp
      });

      toast.success("Signup successful! 🎉"); // Success Toast
      navigate("/dashboard"); // Redirect to Dashboard
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);

      // --- Enhanced Error Messages ---
      switch (error.code) {
        case "auth/email-already-in-use":
          toast.error(
            "This email is already registered. Try logging in or resetting your password.",
          );
          break;
        case "auth/invalid-email":
          toast.error("Invalid email format.");
          break;
        case "auth/weak-password":
          toast.error("Password is too weak. Use at least 6 characters.");
          break;
        default:
          toast.error("Signup failed. Please try again later.");
      }
    }

    setLoading(false); // Stop loading spinner
  };

  // --- Send Password Reset ---
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email); // Firebase method
    } catch (error) {
      console.error("Password Reset Error:", error.message);

      switch (error.code) {
        case "auth/user-not-found":
          throw new Error("No account found with this email.");
        case "auth/invalid-email":
          throw new Error("Invalid email format.");
        default:
          throw new Error("Failed to send password reset email.");
      }
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <h2 className="text-center mb-4">Sign Up</h2>

          {/* --- Email Field --- */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className={`form-control ${emailError ? "is-invalid" : ""}`} // Highlight error
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
            <div className="invalid-feedback">Invalid email format.</div>
          </div>

          {/* --- Password Field --- */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className={`form-control ${passwordError ? "is-invalid" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
            <div className="invalid-feedback">
              Password must be at least 6 characters.
            </div>
          </div>

          {/* --- Confirm Password Field --- */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className={`form-control ${confirmPasswordError ? "is-invalid" : ""}`}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
            <div className="invalid-feedback">Passwords do not match.</div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className="mt-3 text-center">
            Already have an account?{" "}
            <a href="/login" className="text-decoration-none">
              Log In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
