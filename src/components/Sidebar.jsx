// src/components/Sidebar.jsx
import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/components/Sidebar.css";
import useMediaQuery from "../hooks/useMediaQuery";

const Sidebar = ({ onAddProject, onAddTransaction, onAddCustomer }) => {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const location = useLocation();

  // On mobile, default to collapsed; on desktop, default to expanded.
  const [collapsed, setCollapsed] = useState(isMobile ? true : false);

  // When switching between mobile and desktop, update collapsed state.
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
            <h1 className="sidebar-title">Dashboard</h1>
            <button
              className="toggle-btn btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
            >
              <i className={`bi ${iconClass}`}></i>
            </button>
          </div>
        ) : // Desktop header:
        collapsed ? (
          // When collapsed, show only the toggle button centered.
          <div className="header-collapsed">
            <button
              className="toggle-btn btn btn-sm btn-outline-light"
              onClick={toggleSidebar}
            >
              <i className={`bi ${iconClass}`}></i>
            </button>
          </div>
        ) : (
          // When expanded, show title (left), a divider, and toggle button (right).
          <div className="header-content">
            <h1 className="sidebar-title">Dashboard</h1>
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
            </ul>
          </div>
        )
      ) : (
        // Desktop: Always render full sidebar content (with text hidden when collapsed).
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
              {!collapsed && <span>Add Project</span>}
            </li>
            <li
              className="sidebar-list-item add-transaction"
              onClick={onAddTransaction}
            >
              <i className="bi bi-plus-circle"></i>
              {!collapsed && <span>Add Transaction</span>}
            </li>
            <li
              className="sidebar-list-item add-customer"
              onClick={onAddCustomer}
            >
              <i className="bi bi-person-plus"></i>
              {!collapsed && <span>Add Customer</span>}
            </li>
          </ul>
        </>
      )}
    </div>
  );
};

export default Sidebar;
