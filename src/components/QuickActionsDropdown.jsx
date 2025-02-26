import React from "react";
import { Dropdown } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useLocation } from "react-router-dom"; // Routing hooks

const QuickActionsDropdown = ({
  onAddProject,
  onAddTransaction,
  onAddCustomer,
}) => {
  const { darkMode, toggleTheme } = useTheme(); // Access theme context
  const navigate = useNavigate(); // Navigation hook
  const location = useLocation(); // Track current route

  // --- Hide Button Logic ---
  const isOnProjectsPage =
    location.pathname === "/" || location.pathname === "/projects"; // Check both '/' and '/projects'

  return (
    <Dropdown
      // Handle hover for desktop and allow click on mobile
      onMouseEnter={(e) => e.currentTarget.classList.add("show")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("show")}
    >
      {/* Dropdown Toggle */}
      <Dropdown.Toggle
        variant="light"
        id="dropdown-quick-actions"
        className="dropdown-toggle"
      >
        <i className="bi bi-lightning-charge me-2"></i>Quick Actions
      </Dropdown.Toggle>

      {/* Dropdown Menu */}
      <Dropdown.Menu className="quick-actions-menu">
        {/* View All Projects - Hide if already on Projects Page */}
        {!isOnProjectsPage && (
          <Dropdown.Item onClick={() => navigate("/projects")}>
            <i className="bi bi-list-ul me-2"></i>View All Projects
          </Dropdown.Item>
        )}
        <Dropdown.Divider />

        {/* Add New Project */}
        <Dropdown.Item onClick={onAddProject}>
          <i className="bi bi-folder-plus me-2"></i>Add New Project
        </Dropdown.Item>

        {/* Add Transaction */}
        <Dropdown.Item onClick={onAddTransaction}>
          <i className="bi bi-cash-stack me-2"></i>Add Transaction
        </Dropdown.Item>

        {/* Add Customer */}
        <Dropdown.Item onClick={onAddCustomer}>
          <i className="bi bi-person-plus me-2"></i>Add Customer
        </Dropdown.Item>

        <Dropdown.Divider />

        {/* Dark Mode Toggle */}
        <Dropdown.Item
          disabled={!darkMode} // Bootstrap 'disabled' state for styles
          style={{
            pointerEvents: "auto", // Re-enable mouse events
            cursor: !darkMode ? "not-allowed" : "pointer", // Dynamic cursor
          }}
          onClick={darkMode ? toggleTheme : undefined} // Prevent clicks if disabled
        >
          {darkMode ? (
            <>
              <i className="bi bi-brightness-high me-2"></i>Light Mode
            </>
          ) : (
            <>
              <i className="bi bi-moon-stars me-2"></i>Dark Mode
            </>
          )}
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default QuickActionsDropdown;
