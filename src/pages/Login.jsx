// File: src/pages/Login.jsx

import React, { useState } from "react"; 
import { useAuth } from "../context/AuthContext";
import { auth } from "@config";
import AuthLayout from "../pages/AuthLayout"; // New layout component
import { useNavigate, Link } from "react-router-dom";

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  // --- Email Validation Function ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    if (!email.trim() || !password) {
      setError("Please fill in all fields!");
      return;
    }

    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
      if (!auth.currentUser?.emailVerified) {
        throw new Error("Please verify your email before logging in.");
      }
      navigate("/select-app");
    } catch (err) {
      console.error("Login Error:", err.message);
      if (err.message.includes("verify your email")) {
        setError("Email Not Verified! " + err.message);
      } else {
        setError("Login Failed! Invalid email or password.");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- Handle Google Login ---
  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate("/select-app");
    } catch (err) {
      console.error("Google Login Error:", err.message);
      setError("Google Login Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout page="login">
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="mb-2 text-center">Sign in with email</h2>
        <p className="mb-4 text-center small">
          Start managing your entire project lifecycle all in one place,
          effectively and completely free!
        </p>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* --- Email Field --- */}
        <div className="auth-form-group">
          <label htmlFor="email">Email Address</label>
          <div className="input-container">
            <span className="input-icon">
              {error && (!email.trim() || !validateEmail(email)) ? (
                <i className="bi bi-exclamation-triangle-fill"></i>
              ) : (
                <i className="bi bi-envelope"></i>
              )}
            </span>
            <input
              type="email"
              id="email"
              className={`form-control ${
                error && (!email.trim() || !validateEmail(email)) ? "is-invalid" : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
            />
          </div>
        </div>

        {/* --- Password Field with Inline Forgot Password Link --- */}
        <div className="auth-form-group">
          <div className="password-label-wrapper">
            <label htmlFor="password" className="password-label">
              Password
            </label>
            <Link to="/forgot-password" className="forgot-password">
              Forgot Password?
            </Link>
          </div>
          <div className="input-container">
            <span className="input-icon">
              {error && !password ? (
                <i className="bi bi-exclamation-triangle-fill"></i>
              ) : (
                <i className="bi bi-shield-lock"></i>
              )}
            </span>
            <input
              type={showPassword ? "text" : "password"}
              id="password"
              className={`form-control ${error && !password ? "is-invalid" : ""}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="•••••••••••"
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              style={{ cursor: "pointer" }}
            >
              <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
            </span>
          </div>
        </div>

        {/* --- Submit Button --- */}
        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            "Get Started"
          )}
        </button>
        {/* Divider */}
        <div className="divider">
          <span>or sign in with</span>
        </div>
        {/* --- Google Login Button --- */}
        <button
          type="button"
          className="btn btn-outline-secondary w-100"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          {loading ? (
            <span className="spinner-border spinner-border-sm"></span>
          ) : (
            "Sign in with Google"
          )}
        </button>

        {/* --- Signup Redirect --- */}
        <p className="mt-3 text-center small">
          Need an account?{" "}
          <Link to="/signup" className="auth-link">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Login;