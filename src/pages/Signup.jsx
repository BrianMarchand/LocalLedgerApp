// File: src/pages/Signup.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/pages/LoginStyles.css"; // Reuse login styles for consistency
import { useNavigate, Link } from "react-router-dom"; // Use Link for internal navigation
import Swal from "sweetalert2";

import { db } from "@config"; // Firestore instance from your config
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Signup = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Password toggle states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Email Validation Function ---
  const validateEmail = (email) => {
    // Basic email regex validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.close(); // Clear any open alerts

    // --- Input Validation ---
    // Trim email here; do not trim passwords to allow intentional spaces.
    if (!email.trim() || !password || !confirmPassword) {
      Swal.fire("Oops!", "Please fill in all fields!", "error");
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire("Invalid Email!", "Enter a valid email address.", "error");
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire(
        "Passwords Don't Match!",
        "Please check your passwords.",
        "error"
      );
      return;
    }

    setLoading(true); // Start loading spinner

    try {
      // --- Create user in Firebase Auth ---
      // signup returns the created user
      const user = await signup(email.trim(), password);

      // --- Add user document to Firestore ---
      if (!user || !user.uid) {
        throw new Error("Signup failed: User ID is undefined.");
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email,         // Store the email
        displayName: "",           // Optional: can be updated later
        role: "user",              // Default role
        createdAt: serverTimestamp(), // Timestamp field
      });

      console.log("Signup User:", user);

      Swal.fire("Success!", "Signup completed successfully. 🎉", "success");
      navigate("/dashboard"); // Redirect to Dashboard after signup
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);

      // --- Enhanced Error Messages Based on Firebase Error Codes ---
      switch (error.code) {
        case "auth/email-already-in-use":
          Swal.fire(
            "Email Already Registered",
            "Try logging in or resetting your password.",
            "error"
          );
          break;
        case "auth/invalid-email":
          Swal.fire(
            "Invalid Email",
            "Please use a valid email address.",
            "error"
          );
          break;
        case "auth/weak-password":
          Swal.fire(
            "Weak Password!",
            "Password should be at least 6 characters.",
            "error"
          );
          break;
        default:
          Swal.fire("Signup Failed!", "Please try again later.", "error");
      }
    } finally {
      // Ensure that loading is turned off regardless of success or error
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2 className="mb-4 text-center">Sign Up</h2>

          {/* --- Email Field --- */}
          <div className="auth-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              // Update email state without trimming on every keystroke;
              // trimming is applied during form submission.
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          {/* --- Password Field --- */}
          <div className="auth-form-group">
            <label htmlFor="password">Password</label>
            <div className="input-container">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                className="form-control"
                value={password}
                // Do not trim password to allow any intentional spaces.
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: "pointer" }} // Enhance UX with pointer cursor
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                />
              </span>
            </div>
          </div>

          {/* --- Confirm Password Field --- */}
          <div className="auth-form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="input-container">
              <input
                type={showConfirmPassword ? "text" : "password"}
                id="confirmPassword"
                className="form-control"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                style={{ cursor: "pointer" }}
              >
                <i
                  className={`bi ${
                    showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                  }`}
                />
              </span>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading} // Disable while loading
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          {/* --- Redirect to Login Page --- */}
          <p className="mt-3 text-center">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">
              Log In
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;