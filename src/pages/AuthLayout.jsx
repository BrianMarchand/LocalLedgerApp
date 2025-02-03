import React from "react";
import PropTypes from "prop-types";
import "../styles/pages/LoginStyles.css"; // Ensure your CSS applies

// Define copy for each page type so you can change it in one place.
const authCopy = {
  login: {
    logo: "/images/LL-main-logo-light.svg",
    header: "Welcome To LocalLedger",
    subheader: "Effortless Project Tracking for Contractors™",
    description:
      "To begin, you can login to your account or sign up for a free account if you just found us!",
    disclaimer: (
      <>
        By creating your account, you agree to the{" "}
        <a href="#" className="auth-link">
          Terms of Service
        </a>{" "}
        |{" "}
        <a href="#" className="auth-link">
          Privacy Notice
        </a>
        .
      </>
    ),
  },
  signup: {
    logo: "/images/LL-main-logo-light.svg",
    header: "Create Your Account",
    subheader: "Effortless Project Tracking for Contractors™",
    description:
      "Sign up now to experience effortless project tracking for contractors.",
    disclaimer: (
      <>
        By signing up, you agree to our{" "}
        <a href="#" className="auth-link">
          Terms of Service
        </a>{" "}
        |{" "}
        <a href="#" className="auth-link">
          Privacy Policy
        </a>
        .
      </>
    ),
  },
  forgot: {
    logo: "/images/LL-main-logo-light.svg",
    header: "Reset Your Password",
    subheader: "Effortless Project Tracking for Contractors™",
    description: "Enter your email below to receive a password reset link.",
    disclaimer:
      "If you don't have an account, you can sign up for a free account.",
  },
};

const AuthLayout = ({ page, children }) => {
  const copy = authCopy[page] || authCopy.login;
  return (
    <div className="auth-wrapper">
      <div className="auth-container">
        {/* Left Side: Gradient Background with Logo & Copy */}
        <div className="auth-gradient">
          <div className="left-content">
            <img src={copy.logo} alt="LocalLedger Logo" className="logo" />
            <h1>{copy.header}</h1>
            <h3>{copy.subheader}</h3>
            <hr />
            <p>{copy.description}</p>
          </div>
        </div>
        {/* Right Side: Content (form, etc.) */}
        <div className="auth-right">
          <div className="auth-card">
            {/* Logo Stamp above the form */}
            <div className="auth-stamp-container">
              <img
                src="/assets/svg/local-ledger-logo-stamp-outline.svg"
                alt="LocalLedger Stamp"
                className="auth-stamp"
              />
            </div>
            {children}
          </div>
          <small className="auth-disclaimer">{copy.disclaimer}</small>
        </div>
      </div>
    </div>
  );
};

AuthLayout.propTypes = {
  page: PropTypes.oneOf(["login", "signup", "forgot"]),
  children: PropTypes.node.isRequired,
};

export default AuthLayout;
