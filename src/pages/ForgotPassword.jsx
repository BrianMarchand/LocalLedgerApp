import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../pages/AuthLayout"; // New layout component
import { useNavigate, Link } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  // --- Email Validation Function ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate email input
    if (!email.trim() || !validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(email.trim());
      setSuccess("Password reset email sent! Check your inbox.");
      setTimeout(() => {
        navigate("/login");
      }, 3000);
    } catch (err) {
      setError(err.message || "Failed to send reset email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout page="forgot">
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="mb-2 text-center">Forgot Password?</h2>
        <p className="mb-4 text-center small">
          To recover your password, please give us your email address and we
          will send you a password reset link.
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success" role="alert">
            {success}
          </div>
        )}
        <div className="auth-form-group">
          <label htmlFor="reset-email">Email Address</label>
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
              id="reset-email"
              className={`form-control ${
                error && (!email.trim() || !validateEmail(email))
                  ? "is-invalid"
                  : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>
        </div>
        <button
          type="submit"
          className="btn btn-primary w-100"
          disabled={loading}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
        <div className="text-center mt-3 small">
          <p>
            Remembered your password?{" "}
            <Link to="/login" className="auth-link">
              Go Back to Login
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPassword;
