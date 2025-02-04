import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { auth } from "@config";
import AuthLayout from "./AuthLayout";

const VerifyEmail = () => {
  const { currentUser, resendEmailVerification } = useAuth();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleResend = async () => {
    try {
      setMessage("");
      await resendEmailVerification();
      setMessage("Verification email sent! Please check your inbox.");
    } catch (error) {
      setMessage("Error sending verification email: " + error.message);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        navigate("/dashboard");
      } else {
        setMessage("Email not verified yet. Please check your inbox.");
      }
    } catch (error) {
      setMessage("Error checking verification status: " + error.message);
    }
    setLoading(false);
  };

  return (
    <AuthLayout page="verify">
      <div className="verify-content">
        <h2>Please Verify Your Email Address</h2>
        <p>
          A verification email has been sent to{" "}
          <strong>{currentUser?.email}</strong>. Please check your inbox and
          click the verification link to activate your account.
        </p>
        {message && <div className="alert alert-info">{message}</div>}
        <div className="d-flex gap-2">
          <button
            className="btn btn-primary"
            onClick={handleResend}
            disabled={loading}
          >
            Resend Verification Email
          </button>
          <button
            className="btn btn-secondary"
            onClick={handleRefresh}
            disabled={loading}
          >
            Refresh Status
          </button>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyEmail;
