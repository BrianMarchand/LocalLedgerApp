import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Dropdown } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../styles/components/Navbar.css";

// --- Key Components ---
import { ReactSVG } from "react-svg"; // <-- Import react-svg
import QuickActionsDropdown from "./QuickActionsDropdown";
import UserDropdown from "./UserDropdown";

import FAB from "./FAB";
import AddProjectModal from "./AddProjectModal";

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // States
  const [scrolling, setScrolling] = useState(false);
  const [showModal, setShowModal] = useState(false); // Modal visibility

  // Scroll Effect
  useEffect(() => {
    const handleScroll = () => setScrolling(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login"); // Redirect to login after logout
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  // Modal Handlers
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  return (
    <>
      {/* Navbar */}
      <nav className={`navbar-glass ${scrolling ? "navbar-scroll" : ""}`}>
        {/* Left: Logo */}
        <div className="navbar-left">
          <a href="/Dashboard" className="logo">
            {/* Render SVG Logo */}
            <ReactSVG
              src="/assets/svg/local-ledger-logo-rect-outline.svg" // Public folder path
              className="logo-svg"
            />
          </a>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right d-flex align-items-center gap-3">
          {/* Quick Actions Dropdown */}
          <QuickActionsDropdown onAddProject={handleModalOpen} />

          {/* Profile Dropdown */}
          {currentUser ? (
            <UserDropdown />
          ) : (
            <div className="auth-buttons">
              <button
                className="btn btn-primary auth-btn"
                onClick={() => navigate("/login")}
              >
                Login
              </button>
              <button
                className="btn btn-outline-primary auth-btn"
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* Floating Action Button */}
      <FAB
        icon="bi-plus-circle"
        variant="primary"
        tooltip="Add New Project"
        onClick={handleModalOpen}
      />

      {/* Add Project Modal */}
      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </>
  );
};

export default Navbar;
