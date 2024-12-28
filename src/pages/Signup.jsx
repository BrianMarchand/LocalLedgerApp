import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Signup = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // --- Email Validation ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    toast.dismiss(); // Clear any previous toasts

    // --- Input Validation ---
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields!");
      return;
    }

    if (!validateEmail(email)) {
      toast.error("Invalid email format!");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }

    try {
      setLoading(true);
      await signup(email, password);
      toast.success("Account created successfully! 🎉");
      navigate("/dashboard");
    } catch (error) {
      console.error("Signup Error:", error.message); // Log error
      toast.error(error.message);
    }

    setLoading(false);
  };

  return (
    <div className="container d-flex justify-content-center align-items-center vh-100">
      <div className="w-100" style={{ maxWidth: "400px" }}>
        <form onSubmit={handleSubmit} className="card p-4 shadow-sm">
          <h2 className="text-center mb-4">Sign Up</h2>

          {/* Email */}
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
            />
          </div>

          {/* Password */}
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
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-3">
            <label htmlFor="confirmPassword" className="form-label">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              className="form-control"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value.trim())}
            />
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
