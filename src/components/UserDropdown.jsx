// File: src/components/UserDropdown.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { Dropdown } from "react-bootstrap";
import { useAuth } from "../context/AuthContext";

const UserDropdown = ({ onManageProfile }) => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <Dropdown>
      <Dropdown.Toggle
        variant="light"
        id="dropdown-profile"
        className="profile-btn dropdown-toggle"
      >
        {currentUser?.photoURL ? (
          <img
            src={currentUser.photoURL}
            alt="Profile"
            className="profile-picture"
          />
        ) : (
          <i className="bi bi-person-circle"></i>
        )}
        <span className="toggle-text">Welcome, {currentUser.email}</span>
      </Dropdown.Toggle>
      <Dropdown.Menu className="profile-dropdown-menu">
        {/* Trigger the modal via onManageProfile callback */}
        <Dropdown.Item onClick={onManageProfile}>
          <i className="bi bi-person-fill me-2"></i>Update Profile
        </Dropdown.Item>

        <Dropdown.Divider />

        {/* NEW: Switch App Option */}
        <Dropdown.Item onClick={() => navigate("/select-app")}>
          <i className="bi bi-arrow-left-right me-2"></i>Switch App
        </Dropdown.Item>

        <Dropdown.Divider />

        <Dropdown.Item onClick={handleLogout}>
          <i className="bi bi-box-arrow-right me-2"></i>Logout
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default UserDropdown;
