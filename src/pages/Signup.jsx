import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import "../styles/pages/LoginStyles.css"; // Reuse styles from login
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { db, auth } from "../firebaseConfig"; // Firestore instance
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Signup = () => {
  // State Management
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  // Password Toggles
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // --- Email Validation ---
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // Basic email regex
    return emailRegex.test(email);
  };

  // --- Handle Form Submit ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    Swal.close(); // Clear any open alerts

    // --- Input Validation ---
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
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
        "error",
      );
      return;
    }

    try {
      setLoading(true); // Start loading spinner

      // --- Create user in Firebase Auth ---
      const user = await signup(email, password); // Get the user directly

      // --- Add user to Firestore ---
      if (!user || !user.uid) {
        throw new Error("Signup failed: User ID is undefined.");
      }

      await setDoc(doc(db, "users", user.uid), {
        email: user.email, // Store email
        displayName: "", // Optional field, can be updated later
        role: "user", // Default role
        createdAt: serverTimestamp(), // Timestamp
      });

      console.log("Signup User:", user);
      console.log("Firebase Auth User:", auth.currentUser);

      Swal.fire("Success!", "Signup completed successfully. 🎉", "success");
      navigate("/dashboard"); // Redirect to Dashboard
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);

      // --- Enhanced Error Messages ---
      switch (error.code) {
        case "auth/email-already-in-use":
          Swal.fire(
            "Email Already Registered",
            "Try logging in or resetting your password.",
            "error",
          );
          break;
        case "auth/invalid-email":
          Swal.fire(
            "Invalid Email",
            "Please use a valid email address.",
            "error",
          );
          break;
        case "auth/weak-password":
          Swal.fire(
            "Weak Password!",
            "Password should be at least 6 characters.",
            "error",
          );
          break;
        default:
          Swal.fire("Signup Failed!", "Please try again later.", "error");
      }
    }

    setLoading(false); // Stop loading spinner
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
                onChange={(e) => setConfirmPassword(e.target.value.trim())}
                placeholder="Confirm your password"
              />
              <span
                className="password-toggle"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i
                  className={`bi ${
                    showConfirmPassword ? "bi-eye-slash" : "bi-eye"
                  }`}
                />
              </span>
            </div>
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
            <a href="/login" className="auth-link">
              Log In
            </a>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
