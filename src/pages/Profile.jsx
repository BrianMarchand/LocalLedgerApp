import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import {
  updateEmail,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { auth } from "../firebaseConfig";

const Profile = () => {
  const { logout, currentUser } = useAuth();
  const navigate = useNavigate();

  // --- State Management ---
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // --- Update Email ---
  const handleUpdateEmail = async () => {
    setMessage("");
    setError("");
    if (!newEmail.trim() || !password.trim()) {
      setError("Please fill out all fields.");
      return;
    }

    try {
      setLoading(true);

      // --- Step 1: Re-authenticate User ---
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        password,
      );
      await reauthenticateWithCredential(auth.currentUser, credential);

      console.log("Re-authentication successful!");

      // --- Step 2: Update Email ---
      await updateEmail(auth.currentUser, newEmail);
      setMessage("Email updated successfully!");

      // Log out user after update
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Email Update Error:", err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

        {/* --- Update Email Section --- */}
        <div className="mb-4">
          <label>New Email</label>
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            className="form-control"
          />
          <label>Current Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
          />
          <button
            onClick={handleUpdateEmail}
            disabled={loading}
            className="btn btn-primary mt-2"
          >
            {loading ? "Updating..." : "Update Email"}
          </button>
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
