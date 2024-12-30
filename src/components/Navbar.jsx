import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Dropdown } from "react-bootstrap";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Navbar.css";

// --- Key Components ---
import QuickActionsDropdown from "./QuickActionsDropdown";
import FAB from "./FAB";
import AddProjectModal from "./AddProjectModal";

const Navbar = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

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
      navigate("/login");
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
          <a href="/" className="logo">
            LL
          </a>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right d-flex align-items-center gap-3">
          {/* Quick Actions Dropdown */}
          <QuickActionsDropdown onAddProject={handleModalOpen} />

          {/* Profile Dropdown */}
          <Dropdown>
            <Dropdown.Toggle
              variant="light"
              id="dropdown-profile"
              className="profile-btn"
            >
              <i className="bi bi-person-circle me-2"></i>Welcome, Brian
            </Dropdown.Toggle>
            <Dropdown.Menu className="profile-dropdown-menu">
              <Dropdown.Item onClick={() => navigate("/profile")}>
                <i className="bi bi-person-fill me-2"></i>Profile
              </Dropdown.Item>
              <Dropdown.Item onClick={() => navigate("/settings")}>
                <i className="bi bi-gear-fill me-2"></i>Settings
              </Dropdown.Item>
              <Dropdown.Divider />
              <Dropdown.Item onClick={handleLogout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
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
