import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/components/Sidebar.css";

const Sidebar = ({ onAddProject, onAddTransaction, onAddCustomer }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggleSidebar = () => {
    setCollapsed((prev) => !prev);
  };

  return (
    <div className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-header d-flex justify-content-between align-items-center">
        {!collapsed && <h1 className="sidebar-title">Dashboard</h1>}
        <button
          className="toggle-btn btn btn-sm btn-outline-light"
          onClick={toggleSidebar}
        >
          <i
            className={`bi ${collapsed ? "bi-arrow-right-square" : "bi-arrow-left-square"}`}
          ></i>
        </button>
      </div>

      {/* Navigation Items */}
      <ul className="sidebar-list navigation">
        <li className="sidebar-list-item nav-item dashboard">
          <Link
            to="/dashboard"
            className={`sidebar-link ${location.pathname === "/dashboard" ? "active" : ""}`}
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

      {/* Quick Actions */}
      <ul className="sidebar-list quick-actions">
        <li className="sidebar-list-item add-project" onClick={onAddProject}>
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
        <li className="sidebar-list-item add-customer" onClick={onAddCustomer}>
          <i className="bi bi-person-plus"></i>
          {!collapsed && <span>Add Customer</span>}
        </li>
      </ul>
    </div>
  );
};

export default Sidebar;
