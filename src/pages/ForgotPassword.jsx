// File: src/pages/ForgotPassword.jsx

import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/pages/LoginStyles.css"; // Reuse your login styling; you can update this CSS as needed.
import { toast } from "react-toastify";
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  // --- State Management ---
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  
  // resetPassword should be implemented in your AuthContext.
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    setLoading(true); // Start the loading spinner

    // Basic validation: ensure email is provided
    if (!email.trim()) {
      toast.error("Please enter a valid email address.");
      setLoading(false);
      return;
    }

    try {
      // Attempt to send a password reset email
      await resetPassword(email.trim());
      toast.success("Password reset email sent! Check your inbox.");
      
      // Redirect to the login page after a 3-second delay
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (error) {
      // Display error message using toast notifications
      toast.error(error.message || "Failed to send reset email.");
    } finally {
      // Ensure the loading spinner is turned off regardless of outcome
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        {/* Page Header */}
        <h2 className="mb-3 text-center">Forgot Password</h2>
        <p className="text-center">
          Enter your email address below and we'll send you a link to reset your password.
        </p>

        {/* Forgot Password Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="reset-email">Email Address</label>
            <input
              type="email"
              id="reset-email"
              className="form-control"
              value={email}
              // Update email state on every change; trimming is applied during submission.
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {/* Back to Login Link */}
        <div className="text-center mt-3">
          <p>
            Remembered your password?{" "}
            <Link to="/login" className="auth-link">
              Back to Login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;