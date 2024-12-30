import React from "react";
import { Dropdown } from "react-bootstrap";
import { useTheme } from "../context/ThemeContext";

const QuickActionsDropdown = ({ onAddProject }) => {
  const { darkMode, toggleTheme } = useTheme(); // Access theme context

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
        {/* Add New Project */}
        <Dropdown.Item onClick={onAddProject}>
          <i className="bi bi-plus-circle me-2"></i>Add New Project
        </Dropdown.Item>

        {/* Dark Mode Toggle */}
        <Dropdown.Item onClick={toggleTheme}>
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

        {/* Placeholder */}
        <Dropdown.Item disabled>
          <i className="bi bi-tools me-2"></i>More Actions (Coming Soon)
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default QuickActionsDropdown;
