import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../pages/AuthLayout"; // New layout component
import { useNavigate, Link } from "react-router-dom";
import { db } from "@config"; // Firestore instance from your config
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Signup = () => {
  // New state for additional fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [companyName, setCompanyName] = useState("");

  // Existing state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { signup, signupWithGoogle } = useAuth(); // Assume signupWithGoogle is defined in your context
  const navigate = useNavigate();

  // Password toggle state
  const [showPassword, setShowPassword] = useState(false);

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle Email Sign Up
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !email.trim() ||
      !password ||
      !firstName.trim() ||
      !lastName.trim() ||
      !companyName.trim()
    ) {
      setError("Please fill in all fields!");
      return;
    }
    if (!validateEmail(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const user = await signup(email.trim(), password);
      if (!user || !user.uid) {
        throw new Error("Signup failed: User ID is undefined.");
      }
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: "",
        shortBio: "",
        profilePictureUrl: "",
        company: {
          companyName: companyName.trim(),
          businessAddress: "",
          businessPhone: "",
          businessEmail: "",
        },
        account: {
          username: "",
        },
        appearance: {
          theme: "light",
        },
        notifications: {
          emailNotifications: true,
          dashboardNotifications: true,
        },
        role: "user",
        createdAt: serverTimestamp(),
      });
      console.log("User document created with fields:", {
        email: user.email,
        displayName: `${firstName.trim()} ${lastName.trim()}`,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        companyName: companyName.trim(),
      });
      // Redirect to Verify Email page instead of the dashboard
      navigate("/verify-email");
    } catch (error) {
      console.error("Signup Error:", error.code, error.message);
      let errMsg = "Signup Failed! Please try again later.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errMsg =
            "Email Already Registered. Try logging in or resetting your password.";
          break;
        case "auth/invalid-email":
          errMsg = "Invalid Email. Please use a valid email address.";
          break;
        case "auth/weak-password":
          errMsg = "Weak Password! Password should be at least 6 characters.";
          break;
        default:
          errMsg = error.message || errMsg;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Google Sign Up
  const handleGoogleSignup = async () => {
    setError("");
    setLoading(true);
    try {
      const user = await signupWithGoogle();
      // Optionally add additional user setup here if needed.
      navigate("/dashboard");
    } catch (err) {
      console.error("Google Signup Error:", err.message);
      setError("Google Signup Failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout page="signup">
      <form onSubmit={handleSubmit} noValidate>
        <h2 className="mb-2 text-center">Sign up with email</h2>
        <p className="mb-4 text-center small">
          Manage your entire project lifecycle all in one place.
        </p>
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {/* Email Field */}
        <div className="auth-form-group">
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
                error && (!email.trim() || !validateEmail(email))
                  ? "is-invalid"
                  : ""
              }`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email Address"
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="auth-form-group">
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
              placeholder="Password"
            />
            <span
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              style={{ cursor: "pointer" }}
            >
              <i
                className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}
              ></i>
            </span>
          </div>
        </div>

        {/* First and Last Name Fields in a Row */}
        <div className="row">
          <div className="col-md-6 auth-form-group">
            <div className="input-container">
              <span className="input-icon">
                {error && !firstName.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-person"></i>
                )}
              </span>
              <input
                type="text"
                id="firstName"
                className={`form-control ${error && !firstName.trim() ? "is-invalid" : ""}`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
              />
            </div>
          </div>

          <div className="col-md-6 auth-form-group">
            <div className="input-container">
              <span className="input-icon">
                {error && !lastName.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-person"></i>
                )}
              </span>
              <input
                type="text"
                id="lastName"
                className={`form-control ${error && !lastName.trim() ? "is-invalid" : ""}`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
              />
            </div>
          </div>
        </div>

        {/* Company Name Field */}
        <div className="auth-form-group">
          <div className="input-container">
            <span className="input-icon">
              {error && !companyName.trim() ? (
                <i className="bi bi-exclamation-triangle-fill"></i>
              ) : (
                <i className="bi bi-building"></i>
              )}
            </span>
            <input
              type="text"
              id="companyName"
              className={`form-control ${error && !companyName.trim() ? "is-invalid" : ""}`}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company Name"
            />
          </div>
        </div>

        <button type="submit" className="auth-btn" disabled={loading}>
          {loading ? "Creating account..." : "Create Your Account"}
        </button>

        <p className="mt-3 text-center small">
          Already have a LocalLedger account?{" "}
          <Link to="/login" className="auth-link">
            Log In Here
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
};

export default Signup;
