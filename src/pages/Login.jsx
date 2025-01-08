import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { auth } from "../firebaseConfig";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/pages/LoginStyles.css";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // NEW: Password toggle state

  const { login } = useAuth();
  const navigate = useNavigate();

  // --- Email Validation ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh

    // Clear previous alerts
    Swal.close();

    // --- Input Validation ---
    if (!email.trim() || !password.trim()) {
      Swal.fire("Oops!", "Please fill in all fields!", "error");
      return;
    }

    if (!validateEmail(email)) {
      Swal.fire("Invalid Email!", "Enter a valid email address.", "error");
      return;
    }

    try {
      setLoading(true); // Start loading spinner

      // --- Attempt Login ---
      await login(email, password);

      // --- Email Verification Check ---
      if (!auth.currentUser.emailVerified) {
        throw new Error("Please verify your email before logging in.");
      }

      // --- Success ---
      Swal.fire("Welcome Back!", "Login successful. 🎉", "success");
      navigate("/select-app"); // Redirect to Selector Screen
    } catch (error) {
      console.error("Login Error:", error.message);

      // --- Error Feedback ---
      if (error.message.includes("verify your email")) {
        Swal.fire("Email Not Verified!", error.message, "warning");
      } else {
        Swal.fire("Login Failed!", "Invalid email or password.", "error");
      }
    }

    setLoading(false); // Stop loading spinner
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
              className={`form-control ${!validateEmail(email) && email ? "is-invalid" : ""}`} // Highlight invalid input
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
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
                onChange={(e) => setPassword(e.target.value.trim())}
                placeholder="Enter your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i
                  className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
                ></i>
              </span>
            </div>
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="auth-btn"
            disabled={loading} // Disable button when loading
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm"></span> // Spinner
            ) : (
              "Log In"
            )}
          </button>

          {/* --- Signup Redirect --- */}
          <p className="mt-3">
            Need an account?{" "}
            <a href="/signup" className="auth-link">
              Sign Up
            </a>
          </p>

          {/* --- Forgot Password Link --- */}
          <p className="mt-2">
            <a href="/forgot-password" className="auth-link">
              Forgot Password?
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
