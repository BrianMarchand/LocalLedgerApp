import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { Dropdown } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Navbar.css";
import AddProjectModal from "./AddProjectModal";

// Firebase Imports
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
} from "firebase/firestore";

const Navbar = ({ page }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  // --- Modal Window: Projects ---
  const [showModal, setShowModal] = useState(false);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  // --- State for Search ---
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [projects, setProjects] = useState([]);

  // --- Fetch Projects from Firestore ---
  useEffect(() => {
    const fetchProjects = async () => {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList);
    };
    fetchProjects();
  }, []);

  // --- Filter Suggestions ---
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.length > 0) {
      const filtered = projects.filter((p) =>
        p.name.toLowerCase().includes(query.toLowerCase()),
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  // =======================
  // NOTIFICATIONS STATE & LOGIC
  // =======================
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- Fetch Notifications ---
  useEffect(() => {
    const q = query(
      collection(db, "notifications"),
      orderBy("timestamp", "desc"),
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notifList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setNotifications(notifList);
      setUnreadCount(notifList.filter((n) => !n.read).length); // Count unread
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  // --- Mark Notification as Read ---
  const markAsRead = async (id) => {
    await updateDoc(doc(db, "notifications", id), { read: true });
  };

  // --- Navigate to Project ---
  const selectProject = (id) => {
    navigate(`/project/${id}`);
    setSearchQuery(""); // Clear search
    setSuggestions([]); // Clear suggestions
  };

  // --- Handle Logout ---
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout Error:", error.message);
    }
  };

  // --- Render Buttons ---
  const renderButtons = () => {
    switch (page) {
      case "dashboard":
        return (
          <button
            className={`btn btn-outline-primary me-2 ${
              location.pathname === "/" ? "active" : ""
            }`}
            onClick={() => navigate("/")}
          >
            <i className="bi bi-arrow-left me-1"></i> View Projects
          </button>
        );
      case "projectDashboard":
        return (
          <button
            className={`btn btn-outline-primary me-2 ${
              location.pathname === "/dashboard" ? "active" : ""
            }`}
            onClick={() => navigate("/dashboard")}
          >
            <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
          </button>
        );
      default:
        return null;
    }
  };

  // --- Dynamic Highlighting For Search Bar ---
  const highlightSearch = (text, query) => {
    const regex = new RegExp(`(${query})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={index} style={{ fontWeight: "bold", color: "#007bff" }}>
          {part}
        </span>
      ) : (
        part
      ),
    );
  };

  const [selectedIndex, setSelectedIndex] = useState(-1); // Highlighted suggestion
  const [focus, setFocus] = useState(false); // Track focus state

  // --- Keyboard Navigation For Search Suggestion ---
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      setSelectedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : 0,
      );
    } else if (e.key === "ArrowUp") {
      setSelectedIndex((prev) =>
        prev > 0 ? prev - 1 : suggestions.length - 1,
      );
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      selectProject(suggestions[selectedIndex].id);
    }
  };

  // --- Format Time Ago ---
  const formatTimeAgo = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000); // Firestore Timestamp
    const diff = Date.now() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  // --- Check If Today ---
  const isToday = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // --- Check If This Week ---
  const isThisWeek = (timestamp) => {
    const date = new Date(timestamp.seconds * 1000);
    const today = new Date();
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);
    return date > oneWeekAgo && !isToday(timestamp);
  };

  return (
    <>
      <nav
        className={`navbar navbar-expand-lg ${
          darkMode ? "bg-dark navbar-dark" : "bg-light navbar-light"
        } sticky-top shadow-sm`}
      >
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

          <div
            className={`collapse navbar-collapse ${menuOpen ? "show" : ""}`}
            id="navbarNav"
          >
            <ul className="navbar-nav ms-auto">
              {/* Search Bar */}
              <li className="nav-item position-relative me-3">
                <input
                  type="text"
                  className={`form-control shadow-sm ${
                    searchQuery || focus ? "border-primary" : "border-light"
                  }`} // ✅ Dynamic Border
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  onFocus={() => setFocus(true)} // ✅ Focus State
                  onBlur={() => setFocus(false)} // ✅ Blur State
                  style={{
                    transition: "border-color 0.2s ease-in-out", // ✅ Smooth Animation
                  }}
                />
                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <ul className="list-group position-absolute z-index-3 mt-2 w-100 shadow-sm">
                    {suggestions.map((project) => (
                      <li
                        key={project.id}
                        className="list-group-item list-group-item-action"
                        onClick={() => selectProject(project.id)}
                        style={{ cursor: "pointer" }}
                      >
                        {project.name}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
              {/* Theme Toggle */}
              <li className="nav-item">
                <button
                  className="btn btn-outline-secondary me-2"
                  onClick={toggleTheme}
                >
                  {darkMode ? (
                    <i className="bi bi-moon-stars-fill"></i>
                  ) : (
                    <i className="bi bi-brightness-high-fill"></i>
                  )}
                </button>
              </li>
              {/* Dynamic Buttons */}
              <li className="nav-item">{renderButtons()}</li>
              {/* QUICK ACTIONS MENU */}
              <li className="nav-item dropdown me-3">
                <Dropdown>
                  <Dropdown.Toggle variant="primary" id="dropdown-actions">
                    <i className="bi bi-lightning-fill me-2"></i> Quick Actions
                  </Dropdown.Toggle>

                  <Dropdown.Menu className="dropdown-animated">
                    {/* Section: Actions */}
                    <Dropdown.Header>Actions</Dropdown.Header>
                    <Dropdown.Item onClick={handleModalOpen}>
                      <i className="bi bi-plus-circle-fill me-2 text-success"></i>
                      Add New Project
                    </Dropdown.Item>
                    <Dropdown.Item onClick={() => navigate("/reports")}>
                      <i className="bi bi-bar-chart-line-fill me-2 text-info"></i>
                      View Reports
                    </Dropdown.Item>
                    <Dropdown.Divider />

                    {/* Section: Recent Activity */}
                    <Dropdown.Header>Recent Activity</Dropdown.Header>
                    {notifications.slice(0, 5).map((notif) => (
                      <Dropdown.Item
                        key={notif.id}
                        onClick={() => {
                          markAsRead(notif.id); // Mark as read
                          navigate(`/project/${notif.projectId}`); // Redirect
                        }}
                      >
                        <i className="bi bi-clock-history me-2 text-warning"></i>
                        {notif.title}
                      </Dropdown.Item>
                    ))}

                    {notifications.length === 0 && (
                      <Dropdown.Item disabled>No recent activity</Dropdown.Item>
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </li>
              {/* Profile Dropdown */}
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

              {/* Notification Dropdown */}
              <li className="nav-item dropdown me-3">
                <Dropdown>
                  <Dropdown.Toggle
                    variant="warning"
                    id="dropdown-notifications"
                  >
                    <i className="bi bi-bell"></i>
                    {unreadCount > 0 && (
                      <span className="badge bg-danger ms-2">
                        {unreadCount}
                      </span>
                    )}
                  </Dropdown.Toggle>

                  <Dropdown.Menu style={{ width: "350px" }}>
                    {/* GROUP: TODAY */}
                    <Dropdown.Header>Today</Dropdown.Header>
                    {notifications
                      .filter((notif) => isToday(notif.timestamp)) // Filter today's notifications
                      .map((notif) => (
                        <Dropdown.Item
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(`/project/${notif.projectId}`);
                          }}
                          style={{
                            fontWeight: notif.read ? "normal" : "bold", // Bold for unread
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          {/* Title */}
                          <span>{notif.title}</span>
                          {/* Timestamp */}
                          <small className="text-muted ms-2">
                            {formatTimeAgo(notif.timestamp)}
                          </small>
                          {/* Unread Dot */}
                          {!notif.read && (
                            <i className="bi bi-circle-fill text-danger ms-2"></i>
                          )}
                        </Dropdown.Item>
                      ))}

                    {/* GROUP: THIS WEEK */}
                    <Dropdown.Header>This Week</Dropdown.Header>
                    {notifications
                      .filter((notif) => isThisWeek(notif.timestamp)) // Filter this week's notifications
                      .map((notif) => (
                        <Dropdown.Item
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(`/project/${notif.projectId}`);
                          }}
                          style={{
                            fontWeight: notif.read ? "normal" : "bold",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{notif.title}</span>
                          <small className="text-muted ms-2">
                            {formatTimeAgo(notif.timestamp)}
                          </small>
                          {!notif.read && (
                            <i className="bi bi-circle-fill text-danger ms-2"></i>
                          )}
                        </Dropdown.Item>
                      ))}

                    {/* GROUP: EARLIER */}
                    <Dropdown.Header>Earlier</Dropdown.Header>
                    {notifications
                      .filter(
                        (notif) =>
                          !isToday(notif.timestamp) &&
                          !isThisWeek(notif.timestamp),
                      ) // Older notifications
                      .map((notif) => (
                        <Dropdown.Item
                          key={notif.id}
                          onClick={() => {
                            markAsRead(notif.id);
                            navigate(`/project/${notif.projectId}`);
                          }}
                          style={{
                            fontWeight: notif.read ? "normal" : "bold",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>{notif.title}</span>
                          <small className="text-muted ms-2">
                            {formatTimeAgo(notif.timestamp)}
                          </small>
                          {!notif.read && (
                            <i className="bi bi-circle-fill text-danger ms-2"></i>
                          )}
                        </Dropdown.Item>
                      ))}
                  </Dropdown.Menu>
                </Dropdown>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      {/* FLOATING ACTION BUTTON */}
      {/* FLOATING ACTION BUTTON */}
      <div className="fab-container">
        {/* Add Transaction */}
        <button
          className="fab-btn btn btn-success"
          onClick={() => navigate("/add-transaction")}
        >
          <i className="bi bi-plus-circle"></i>
        </button>

        {/* Edit Project */}
        <button
          className="fab-btn btn btn-warning"
          onClick={() => navigate("/edit-project")}
        >
          <i className="bi bi-pencil-square"></i>
        </button>

        {/* Scroll to Top */}
        <button
          className="fab-btn btn btn-primary"
          onClick={() => {
            console.log("Scroll to Top Clicked!");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          <i className="bi bi-arrow-up-circle"></i>
        </button>
      </div>
      <AddProjectModal show={showModal} handleClose={handleModalClose} />;
    </>
  );
};

export default Navbar;
