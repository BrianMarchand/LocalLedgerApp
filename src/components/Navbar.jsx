import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import FAB from "./FAB";

const Navbar = ({ page, progress = 0 }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const handleModalClose = () => setShowModal(false);

  // Track Scroll Position
  useEffect(() => {
    const handleScroll = () => {
      setScrolling(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      {/* Navbar */}
      <nav
        className={`navbar navbar-expand-md ${
          darkMode ? "bg-dark navbar-dark" : "bg-light navbar-light"
        } sticky-top shadow-sm ${scrolling ? "navbar-scroll" : ""}`}
      >
        <div className="container-fluid d-flex align-items-center justify-content-between">
          {/* Logo */}
          <a
            className="navbar-brand d-flex align-items-center"
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

          {/* Hamburger Menu */}
          <button
            className="navbar-toggler"
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-controls="navbarNav"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
          >
            <i className="bi bi-list"></i>
          </button>

          {/* Navbar Content */}
          <div
            className={`navbar-collapse ${
              menuOpen ? "show" : ""
            } align-items-center justify-content-end`}
          >
            {/* Search Bar */}
            <div className="nav-item me-3">
              <SearchBar />
            </div>

            {/* Theme Toggle */}
            <div className="nav-item me-3">
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
            </div>

            {/* Quick Actions */}
            <div className="nav-item me-3">
              <QuickActionsDropdown
                onAddProject={() => setShowModal(true)}
              />
            </div>

            {/* Notifications */}
            <div className="nav-item me-3">
              <NotificationsDropdown />
            </div>

            {/* Profile Dropdown */}
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
          </div>
        </div>
      </nav>

      {/* Floating Action Button */}
      <FAB
        icon="bi-plus-circle"
        variant="primary"
        tooltip="Add New Project"
        onClick={() => setShowModal(true)}
      />

      {/* Add Project Modal */}
      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </>
  );
};

export default Navbar;