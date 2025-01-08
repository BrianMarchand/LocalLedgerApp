import React from "react";
import { ReactSVG } from "react-svg"; // Optional for logo
import UserDropdown from "/src/components/UserDropdown";
import "/src/styles/components/Navbar.css"; // Reuse the same styles or create Marchand-specific styles if needed

const MarchandNavbar = () => {
  return (
    <nav className="navbar-glass">
      {/* Left: Logo */}
      <div className="navbar-left">
        <h2>MH</h2>
      </div>

      {/* Right: User Dropdown */}
      <div className="navbar-right d-flex align-items-center gap-3">
        <UserDropdown /> {/* Reuse existing dropdown */}
      </div>
    </nav>
  );
};

export default MarchandNavbar;
