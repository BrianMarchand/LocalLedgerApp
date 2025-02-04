// File: src/components/Navbar.jsx

import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "@config";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { Dropdown } from "react-bootstrap";

import "../styles/components/Navbar.css";

// --- Key Components ---
import { ReactSVG } from "react-svg";
import QuickActionsDropdown from "./QuickActionsDropdown";
import UserDropdown from "./UserDropdown";
import FAB from "./FAB";
import AddProjectModal from "/src/components/AddProject/AddProjectModal";
import TransactionModal from "/src/components/TransactionModal";
import CustomerModal from "/src/components/CustomerModal";
import UserProfileModal from "./UserProfileModal"; // Import the User Profile Modal
import { useProjects } from "../context/ProjectsContext";

const Navbar = () => {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();

  // State for Navbar Scroll Effect
  const [scrolling, setScrolling] = useState(false);

  // State for Modals
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false); // New state for Profile Modal

  const { projects } = useProjects(); // Get projects from context

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

  const handleSaveCustomer = async (customer) => {
    console.log("Saving Customer:", customer);
    try {
      const customersCollection = collection(db, "customers");
      await addDoc(customersCollection, {
        ...customer,
        createdAt: serverTimestamp(), // Timestamp for sorting
      });
      console.log("✅ Customer saved successfully!");
    } catch (error) {
      console.error("❌ Error saving customer:", error);
    }
  };

  return (
    <>
      {/* 🔹 Navbar */}
      <nav className={`navbar-glass ${scrolling ? "navbar-scroll" : ""}`}>
        {/* Left: Logo */}
        <div className="navbar-left">
          <a href="/Dashboard" className="logo">
            <ReactSVG
              src="/assets/svg/local-ledger-logo-rect-outline.svg"
              className="logo-svg"
            />
          </a>
        </div>

        {/* Right: Actions */}
        <div className="navbar-right d-flex align-items-center gap-3">
          <QuickActionsDropdown
            onAddProject={() => setShowProjectModal(true)}
            onAddTransaction={() => setShowTransactionModal(true)}
            onAddCustomer={() => setShowCustomerModal(true)}
          />

          {/* Profile Dropdown */}
          {currentUser ? (
            <UserDropdown
              onManageProfile={() => setShowProfileModal(true)} // Trigger the modal instead of navigating to /profile
              onLogout={handleLogout}
            />
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

      {/* 🔹 Floating Action Button (FAB) */}
      <div className="fab-wrapper">
        <FAB
          actions={[
            {
              onClick: () => setShowProjectModal(true),
              icon: "bi-folder-plus",
              variant: "success",
              tooltip: "Add New Project",
            },
            {
              onClick: () => setShowTransactionModal(true),
              icon: "bi-cash-stack",
              variant: "warning",
              tooltip: "Add Transaction",
            },
            {
              onClick: () => setShowCustomerModal(true),
              icon: "bi-person-plus",
              variant: "info",
              tooltip: "Add Customer",
            },
          ]}
        />
      </div>

      {/* 🔹 Modals */}
      <AddProjectModal
        show={showProjectModal}
        handleClose={() => setShowProjectModal(false)}
      />
      <TransactionModal
        show={showTransactionModal}
        handleClose={() => setShowTransactionModal(false)}
        projects={projects}
      />
      <CustomerModal
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={handleSaveCustomer}
        projects={projects}
      />
      <UserProfileModal
        show={showProfileModal}
        onClose={() => setShowProfileModal(false)}
      />
    </>
  );
};

export default Navbar;
