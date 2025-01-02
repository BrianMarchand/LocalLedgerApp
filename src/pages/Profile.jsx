import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { updatePassword } from "firebase/auth";

const Profile = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // --- State Management ---
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --- Update Password ---
  const handleUpdatePassword = async () => {
    setMessage("");
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await updatePassword(currentUser, password);
      setMessage("Password updated successfully!");
      setPassword(""); // Clear field
    } catch (err) {
      console.error("Password Update Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- Logout ---
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <div>
      <Navbar page="profile" />
      <div className="container mt-5">
        <h2>Profile & Authentication</h2>

        {/* --- Success/Error Messages --- */}
        {message && <div className="alert alert-success">{message}</div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {/* --- Email Section --- */}
        <div className="mb-4">
          <label>Current Email Address</label>
          <input
            type="email"
            value={currentUser.email}
            disabled
            className="form-control"
          />
          <p className="text-muted mt-2">
            Your current email address: <strong>{currentUser.email}</strong> is
            locked and cannot be changed. If you would like to change this,
            please contact support.
          </p>
        </div>

        {/* --- Update Password Section --- */}
        <div className="mb-4">
          <label>New Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
          />
          <button
            onClick={handleUpdatePassword}
            disabled={loading}
            className="btn btn-primary mt-2"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </div>

        {/* --- Logout Button --- */}
        <button className="btn btn-danger" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
