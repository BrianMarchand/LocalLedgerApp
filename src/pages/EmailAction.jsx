import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { auth } from "@config";
import { applyActionCode } from "firebase/auth";
import AuthLayout from "./AuthLayout";

const EmailAction = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const mode = searchParams.get("mode");
  const oobCode = searchParams.get("oobCode");
  const [message, setMessage] = useState("Processing your request...");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (mode === "verifyEmail" && oobCode) {
      // Apply the action code to verify the user's email.
      applyActionCode(auth, oobCode)
        .then(() => {
          setMessage(
            "Your email has been successfully verified. You can now log in."
          );
          // Redirect after a short delay.
          setTimeout(() => {
            navigate("/login");
          }, 3000);
        })
        .catch((error) => {
          console.error("Error verifying email:", error);
          setMessage("Failed to verify email: " + error.message);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setMessage("Invalid action. Please check the link in your email.");
      setLoading(false);
    }
  }, [mode, oobCode, navigate]);

  return (
    <AuthLayout page="verify">
      <div className="email-action-content">
        <h2>Email Verification</h2>
        <p>{message}</p>
        {loading && <p>Loading...</p>}
      </div>
    </AuthLayout>
  );
};

export default EmailAction;
