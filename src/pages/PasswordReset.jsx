// File: src/pages/PasswordReset.jsx 

import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { auth } from "@config";
import { verifyPasswordResetCode, confirmPasswordReset } from "firebase/auth";

const PasswordReset = () => {
  // Get query parameters from the URL
  const [searchParams] = useSearchParams();
  const oobCode = searchParams.get("oobCode");
  const mode = searchParams.get("mode");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [codeValid, setCodeValid] = useState(false);
  const [loading, setLoading] = useState(true);

  // Verify the password reset code on mount
  useEffect(() => {
    if (mode !== "resetPassword" || !oobCode) {
      toast.error("Invalid password reset link.");
      navigate("/login");
      return;
    }

    verifyPasswordResetCode(auth, oobCode)
      .then((email) => {
        // Code is valid; you might display the email to the user here.
        setCodeValid(true);
        setLoading(false);
      })
      .catch((error) => {
        toast.error("Invalid or expired password reset code.");
        navigate("/login");
      });
  }, [oobCode, mode, navigate]);

  // Handle the form submission to confirm password reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await confirmPasswordReset(auth, oobCode, newPassword);
      toast.success("Password has been reset successfully!");
      navigate("/login");
    } catch (error) {
      toast.error("Error resetting password: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="auth-container"><div className="auth-card">Loading...</div></div>;
  }

  if (!codeValid) {
    return null; // Optionally, display an error message if the code is invalid.
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2 className="mb-3 text-center">Reset Your Password</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="new-password">New Password</label>
            <input
              type="password"
              id="new-password"
              className="form-control"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="Enter your new password"
            />
          </div>
          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordReset;