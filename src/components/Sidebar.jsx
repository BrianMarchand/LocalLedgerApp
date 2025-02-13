import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/components/Sidebar.css";
import useMediaQuery from "../hooks/useMediaQuery";

const Sidebar = ({
  onAddProject,
  onAddTransaction,
  onAddCustomer,
  onAddNote, // New prop for triggering the global notes modal
}) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const location = useLocation();

  // Set collapsed state based on device
  const [collapsed, setCollapsed] = useState(isMobile ? true : false);

  useEffect(() => {
    setCollapsed(isMobile ? true : false);
  }, [isMobile]);

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  // Determine which icon class to use based on device and state.
  const iconClass = isMobile
    ? collapsed
      ? "bi-list" // Mobile: hamburger icon when closed.
      : "bi-x-lg" // Mobile: X icon when open.
    : collapsed
      ? "bi-arrow-right-square" // Desktop: arrow icon when collapsed.
      : "bi-arrow-left-square"; // Desktop: arrow icon when expanded.

  // Dynamically set the title based on the current location.
  const getSidebarTitle = () => {
    const path = location.pathname.toLowerCase();
    if (path.includes("projects")) return "Projects";
    if (path.includes("transaction")) return "Transactions";
    if (path.includes("customers")) return "Customers";
    // Default/fallback
    return "Dashboard";
  };

  const sidebarTitle = getSidebarTitle();

  return (
    <div
      className={`sidebar ${collapsed ? "collapsed" : ""} ${
        isMobile && collapsed ? "mobile-closed" : ""
      }`}
    >
      {/* Sidebar Header */}
      <div className="sidebar-header">
        {isMobile ? (
          // Mobile header: title on the left and toggle button on the right.
          <div className="header-mobile">
            <h1 className="sidebar-title">{sidebarTitle}</h1>
            <button
              className="toggle-btn btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
            >
              <i className={`bi ${iconClass}`}></i>
            </button>
          </div>
        ) : collapsed ? (
          // When collapsed (desktop): show only the toggle button centered.
          <div className="header-collapsed">
            <button
              className="toggle-btn btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
            >
              <i className={`bi ${iconClass}`}></i>
            </button>
          </div>
        ) : (
          // When expanded (desktop): show title, a divider, and toggle button.
          <div className="header-content">
            <h1 className="sidebar-title">{sidebarTitle}</h1>
            <div className="header-divider" />
            <button
              className="toggle-btn btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
            >
              <i className={`bi ${iconClass}`}></i>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Content */}
      {isMobile ? (
        // Mobile/Tablet: Render accordion content only when expanded.
        !collapsed && (
          <div className="mobile-accordion-container">
            <ul className="sidebar-list navigation">
              <li className="sidebar-list-item nav-item dashboard">
                <Link
                  to="/dashboard"
                  className={`sidebar-link ${
                    location.pathname === "/dashboard" ? "active" : ""
                  }`}
                >
                  <i className="bi bi-speedometer2"></i>
                  <span>Dashboard</span>
                </Link>
              </li>
              <li className="sidebar-list-item nav-item projects">
                <Link to="/projects" className="sidebar-link">
                  <i className="bi bi-folder2-open"></i>
                  <span>Projects</span>
                </Link>
              </li>
              <li className="sidebar-list-item nav-item transactions">
                <Link to="/transaction-summary" className="sidebar-link">
                  <i className="bi bi-receipt"></i>
                  <span>Transactions</span>
                </Link>
              </li>
              <li className="sidebar-list-item nav-item customers">
                <Link to="/customers" className="sidebar-link">
                  <i className="bi bi-people"></i>
                  <span>Customers</span>
                </Link>
              </li>
            </ul>

            <ul className="sidebar-list quick-actions">
              <li
                className="sidebar-list-item add-project"
                onClick={onAddProject}
              >
                <i className="bi bi-plus-square"></i>
                <span>Add Project</span>
              </li>
              <li
                className="sidebar-list-item add-transaction"
                onClick={onAddTransaction}
              >
                <i className="bi bi-plus-circle"></i>
                <span>Add Transaction</span>
              </li>
              <li
                className="sidebar-list-item add-customer"
                onClick={onAddCustomer}
              >
                <i className="bi bi-person-plus"></i>
                <span>Add Customer</span>
              </li>
              <li className="sidebar-list-item add-note" onClick={onAddNote}>
                <i className="bi bi-sticky"></i>
                <span>Add Note</span>
              </li>
            </ul>
          </div>
        )
      ) : (
        // Desktop: Always render full sidebar content.
        <>
          {/* Divider between header and content */}
          <hr className="sidebar-divider" />
          <ul className="sidebar-list navigation">
            <li className="sidebar-list-item nav-item dashboard">
              <Link
                to="/dashboard"
                className={`sidebar-link ${
                  location.pathname === "/dashboard" ? "active" : ""
                }`}
              >
                <i className="bi bi-speedometer2"></i>
                {!collapsed && <span>Dashboard</span>}
              </Link>
            </li>
            <li className="sidebar-list-item nav-item projects">
              <Link to="/projects" className="sidebar-link">
                <i className="bi bi-folder2-open"></i>
                {!collapsed && <span>Projects</span>}
              </Link>
            </li>
            <li className="sidebar-list-item nav-item transactions">
              <Link to="/transaction-summary" className="sidebar-link">
                <i className="bi bi-receipt"></i>
                {!collapsed && <span>Transactions</span>}
              </Link>
            </li>
            <li className="sidebar-list-item nav-item customers">
              <Link to="/customers" className="sidebar-link">
                <i className="bi bi-people"></i>
                {!collapsed && <span>Customers</span>}
              </Link>
            </li>
          </ul>

          <hr className="sidebar-divider" />

          <ul className="sidebar-list quick-actions">
            <li
              className="sidebar-list-item add-project"
              onClick={onAddProject}
            >
              <i className="bi bi-plus-square"></i>
              {!collapsed && <span>New Project</span>}
            </li>
            <li
              className="sidebar-list-item add-transaction"
              onClick={onAddTransaction}
            >
              <i className="bi bi-plus-circle"></i>
              {!collapsed && <span>New Transaction</span>}
            </li>
            <li
              className="sidebar-list-item add-customer"
              onClick={onAddCustomer}
            >
              <i className="bi bi-person-plus"></i>
              {!collapsed && <span>New Customer</span>}
            </li>
            <li className="sidebar-list-item add-note" onClick={onAddNote}>
              <i className="bi bi-sticky"></i>
              {!collapsed && <span>New List</span>}
            </li>
            <li className="sidebar-list-item add-summary">
              <i className="bi bi-calculator"></i>
              {!collapsed && <span>New Summary</span>}
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;
