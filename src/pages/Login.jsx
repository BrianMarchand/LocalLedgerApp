// File: src/pages/Login.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "@config";

import "../styles/pages/LoginStyles.css";
import { useNavigate, Link } from "react-router-dom"; // Changed: Using Link for SPA navigation
import Swal from "sweetalert2";

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // Toggle state for password visibility

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Email Validation Function ---
  const validateEmail = (email) => {
    // Basic regex for email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Clear any previous alerts
    Swal.close();

    // --- Input Validation ---
    // Trim email input; note: we do not trim password to allow intentional spaces.
    if (!email.trim() || !password) {
      Swal.fire("Oops!", "Please fill in all fields!", "error");
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire("Invalid Email!", "Enter a valid email address.", "error");
      return;
    }

    setLoading(true); // Start loading spinner

    try {
      // --- Attempt Login ---
      // Pass the trimmed email and raw password to the login function
      await login(email.trim(), password);

      // --- Email Verification Check ---
      // Use optional chaining to safely access emailVerified property
      if (!auth.currentUser?.emailVerified) {
        throw new Error("Please verify your email before logging in.");
      }

      // --- Success ---
      Swal.fire("Welcome Back!", "Login successful. 🎉", "success");
      navigate("/select-app"); // Redirect to the selector screen
    } catch (error) {
      console.error("Login Error:", error.message);

      // --- Error Feedback ---
      if (error.message.includes("verify your email")) {
        Swal.fire("Email Not Verified!", error.message, "warning");
      } else {
        Swal.fire("Login Failed!", "Invalid email or password.", "error");
      }
    } finally {
      // Ensure loading spinner is stopped regardless of outcome
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <form onSubmit={handleSubmit}>
          <h2 className="mb-4">Log In</h2>

          {/* --- Email Field --- */}
          <div className="auth-form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              className={`form-control ${!validateEmail(email) && email ? "is-invalid" : ""}`} // Highlights invalid input
              value={email}
              onChange={(e) => setEmail(e.target.value)} // Update email (trimming will occur on submit)
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
                onChange={(e) => setPassword(e.target.value)} // Update password (no trimming here)
                placeholder="Enter your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword((prev) => !prev)}
                style={{ cursor: "pointer" }} // Added cursor style for better UX
              >
                <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
              </span>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="auth-btn"
            disabled={loading} // Button is disabled while loading
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span> // Loading spinner
            ) : (
              "Log In"
            )}
          </button>

          {/* --- Signup Redirect --- */}
          <p className="mt-3">
            Need an account?{" "}
            <Link to="/signup" className="auth-link">
              Sign Up
            </Link>
          </p>

          {/* --- Forgot Password Link --- */}
          <p className="mt-2">
            <Link to="/forgot-password" className="auth-link">
              Forgot Password?
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;