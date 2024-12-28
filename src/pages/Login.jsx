import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth(); // Firebase Auth Context
  const navigate = useNavigate();

  // --- Email Validation ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent page refresh
    toast.dismiss(); // Clear previous toasts

    // --- Input Validation ---
    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields!"); // Error Toast
      return; // Prevent form submission
    }

    if (!validateEmail(email)) {
      toast.error("Invalid email format!"); // Error Toast
      return;
    }

    try {
      setLoading(true); // Start loading spinner
      await login(email, password); // Firebase Auth
      toast.success("Login successful! 🎉"); // Success Toast
      navigate("/dashboard"); // Redirect to Dashboard
    } catch (error) {
      console.error("Login Error:", error.message); // Debug Log
      toast.error("Invalid email or password. Please try again."); // Error Toast
    }

    setLoading(false); // Stop loading spinner
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <h2 className="text-center mb-4">Log In</h2>

          {/* --- Email Field --- */}
          <div className="mb-3">
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value.trim())}
              placeholder="Enter your email"
            />
          </div>

          {/* --- Password Field --- */}
          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value.trim())}
              placeholder="Enter your password"
            />
          </div>

          {/* --- Submit Button --- */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Logging In..." : "Log In"}
          </button>

          {/* --- Signup Redirect --- */}
          <p className="mt-3 text-center">
            Need an account?{" "}
            <a href="/signup" className="text-decoration-none">
              Sign Up
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
