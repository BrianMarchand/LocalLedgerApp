import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Dropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Navbar.css";
import AddProjectModal from "./AddProjectModal";

// Components
import SearchBar from "./SearchBar";
import NotificationsDropdown from "./NotificationsDropdown";
import QuickActionsDropdown from "./QuickActionsDropdown";

// Firebase
import { db } from "../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";

const Navbar = ({ page, progress = 0 }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const handleModalClose = () => setShowModal(false);

  // Theme Toggle Button
  const themeToggleButton = (
    <button
      className="btn btn-outline-secondary"
      onClick={toggleTheme}
      title="Toggle Theme"
    >
      {darkMode ? (
        <i className="bi bi-moon-stars-fill"></i>
      ) : (
        <i className="bi bi-brightness-high-fill"></i>
      )}
    </button>
  );

  // Dynamic Navigation Buttons
  const renderNavButtons = () => {
    if (page === "dashboard") {
      return (
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/")}
        >
          <i className="bi bi-arrow-left me-1"></i> View Projects
        </button>
      );
    } else if (page === "projectDashboard") {
      return (
        <button
          className="btn btn-outline-primary"
          onClick={() => navigate("/dashboard")}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </button>
      );
    }
    return null;
  };

  // Handle Logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg ${
          darkMode ? "bg-dark navbar-dark" : "bg-light navbar-light"
        } sticky-top shadow-sm`}
      >
        {/* --- Progress Bar --- */}
        <div
          className="progress"
          style={{
            height: "4px",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1030, // Above navbar
          }}
        >
          <div
            className="progress-bar bg-primary"
            role="progressbar"
            style={{
              width: `${progress}%`,
              transition: "width 0.4s ease-in-out",
            }}
            aria-valuenow={progress}
            aria-valuemin="0"
            aria-valuemax="100"
          ></div>
        </div>
        <div className="container-fluid py-3">
          {/* Logo */}
          <a
            className={`navbar-brand ${darkMode ? "text-white" : "text-dark"}`}
            href="/"
          >
            <img
              src={
                darkMode
                  ? "http://localledger.ca/wp-content/uploads/2024/12/LL-main-logo-dark.svg"
                  : "http://localledger.ca/wp-content/uploads/2024/12/LL-main-logo-light.svg"
              }
              alt="Local Ledger Logo"
              style={{
                height: "70px",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </a>

          {/* Mobile Menu Toggle */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <i className="bi bi-list"></i>
          </button>

          <div className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}>
            <ul className="navbar-nav ms-auto align-items-center">
              {/* Search Bar */}
              <li className="nav-item me-3">
                <SearchBar />
              </li>

              {/* Theme Toggle */}
              <li className="nav-item me-3">{themeToggleButton}</li>

              {/* Quick Actions */}
              <li className="nav-item me-3">
                <QuickActionsDropdown onAddProject={() => setShowModal(true)} />
              </li>

              {/* Notifications */}
              <li className="nav-item me-3">
                <NotificationsDropdown />
              </li>

              {/* Profile */}
              <li className="nav-item dropdown">
                <Dropdown>
                  <Dropdown.Toggle variant="light" id="dropdown-basic">
                    <i className="bi bi-person-circle me-2"></i> Brian M.
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item onClick={() => navigate("/profile")}>
                      View Profile
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/settings")}>
                      Settings
                    </Dropdown.Item>
                    <Dropdown.Divider />
                    <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Add Project Modal */}
      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </>
  );
};

export default Navbar;
