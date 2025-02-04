import React, { useState, useEffect } from "react";
import GlobalModal from "./GlobalModal";
import { useAuth } from "../context/AuthContext"; // Assumes currentUser is provided here
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@config"; // Firestore instance from your config
import "../styles/components/userProfileModal.css"; // Create or adjust this file as needed

const UserProfileModal = ({ show, onClose }) => {
  const { currentUser } = useAuth();

  // State for active section of the modal
  const [activeSection, setActiveSection] = useState("profile");

  // Profile data state; matches our nested schema in Firestore
  const [profileData, setProfileData] = useState({
    personalInfo: {
      firstName: "",
      lastName: "",
      nickname: "",
      shortBio: "",
      profilePictureUrl: "",
    },
    companyInfo: {
      companyName: "",
      businessAddress: "",
      businessPhone: "",
      businessEmail: "",
    },
    accountInfo: {
      username: "",
      email: "", // For updating email address (password updates require separate handling)
      // password field is not stored directly here
    },
    appearance: {
      theme: "light",
    },
    notifications: {
      emailNotifications: true,
      dashboardNotifications: true,
    },
    // 'other' could include additional fields like displayName, role, etc.
    other: {
      displayName: "",
      role: "",
      email: "",
    },
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch user profile data when modal opens and currentUser is available
  useEffect(() => {
    if (show && currentUser) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfileData(docSnap.data());
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
        }
      };
      fetchUserData();
    }
  }, [show, currentUser]);

  // Helper function to update nested state for a given section/field
  const handleChange = (section, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  // Save updated profile data to Firestore
  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      await updateDoc(docRef, profileData);
      alert("Profile updated successfully!");
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("Failed to update profile. Please try again.");
    }
    setLoading(false);
  };

  // Render the right-hand content based on the active section
  const renderSectionContent = () => {
    switch (activeSection) {
      case "profile":
        return (
          <div className="profile-section">
            <h4>Personal Information</h4>
            <div className="form-group">
              <label>Profile Picture URL</label>
              <input
                type="text"
                className="form-control"
                value={profileData.personalInfo.profilePictureUrl || ""}
                onChange={(e) =>
                  handleChange(
                    "personalInfo",
                    "profilePictureUrl",
                    e.target.value
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                className="form-control"
                value={profileData.personalInfo.firstName || ""}
                onChange={(e) =>
                  handleChange("personalInfo", "firstName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                className="form-control"
                value={profileData.personalInfo.lastName || ""}
                onChange={(e) =>
                  handleChange("personalInfo", "lastName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Nickname</label>
              <input
                type="text"
                className="form-control"
                value={profileData.personalInfo.nickname || ""}
                onChange={(e) =>
                  handleChange("personalInfo", "nickname", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Short Bio</label>
              <textarea
                className="form-control"
                value={profileData.personalInfo.shortBio || ""}
                onChange={(e) =>
                  handleChange("personalInfo", "shortBio", e.target.value)
                }
              />
            </div>
          </div>
        );
      case "company":
        return (
          <div className="company-section">
            <h4>Company Information</h4>
            <div className="form-group">
              <label>Company Name</label>
              <input
                type="text"
                className="form-control"
                value={profileData.companyInfo.companyName || ""}
                onChange={(e) =>
                  handleChange("companyInfo", "companyName", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Business Address</label>
              <input
                type="text"
                className="form-control"
                value={profileData.companyInfo.businessAddress || ""}
                onChange={(e) =>
                  handleChange("companyInfo", "businessAddress", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Business Phone</label>
              <input
                type="text"
                className="form-control"
                value={profileData.companyInfo.businessPhone || ""}
                onChange={(e) =>
                  handleChange("companyInfo", "businessPhone", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <input
                type="email"
                className="form-control"
                value={profileData.companyInfo.businessEmail || ""}
                onChange={(e) =>
                  handleChange("companyInfo", "businessEmail", e.target.value)
                }
              />
            </div>
          </div>
        );
      case "account":
        return (
          <div className="account-section">
            <h4>Account Information</h4>
            <div className="form-group">
              <label>Username</label>
              <input
                type="text"
                className="form-control"
                value={profileData.accountInfo.username || ""}
                onChange={(e) =>
                  handleChange("accountInfo", "username", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input
                type="email"
                className="form-control"
                value={
                  profileData.accountInfo.email || profileData.other.email || ""
                }
                onChange={(e) =>
                  handleChange("accountInfo", "email", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                className="form-control"
                placeholder="New password"
                onChange={(e) =>
                  handleChange("accountInfo", "password", e.target.value)
                }
              />
              <small className="form-text text-muted">
                Note: Updating your password requires a separate process.
              </small>
            </div>
          </div>
        );
      case "appearance":
        return (
          <div className="appearance-section">
            <h4>Appearance Settings</h4>
            <div className="form-group">
              <label>Theme</label>
              <select
                className="form-control"
                value={profileData.appearance.theme || "light"}
                onChange={(e) =>
                  handleChange("appearance", "theme", e.target.value)
                }
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
              </select>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="notifications-section">
            <h4>Notification Settings</h4>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="emailNotifications"
                checked={profileData.notifications.emailNotifications || false}
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "emailNotifications",
                    e.target.checked
                  )
                }
              />
              <label className="form-check-label" htmlFor="emailNotifications">
                Email Notifications
              </label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="dashboardNotifications"
                checked={
                  profileData.notifications.dashboardNotifications || false
                }
                onChange={(e) =>
                  handleChange(
                    "notifications",
                    "dashboardNotifications",
                    e.target.checked
                  )
                }
              />
              <label
                className="form-check-label"
                htmlFor="dashboardNotifications"
              >
                Dashboard Notifications
              </label>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <GlobalModal show={show} onClose={onClose} title="User Profile">
      <div className="user-profile-modal-container">
        {/* Sidebar Navigation */}
        <div className="user-profile-sidebar">
          <ul className="nav flex-column">
            <li
              className={`nav-item ${activeSection === "profile" ? "active" : ""}`}
            >
              <button
                className="btn btn-link"
                onClick={() => setActiveSection("profile")}
              >
                Profile
              </button>
            </li>
            <li
              className={`nav-item ${activeSection === "company" ? "active" : ""}`}
            >
              <button
                className="btn btn-link"
                onClick={() => setActiveSection("company")}
              >
                Company
              </button>
            </li>
            <li
              className={`nav-item ${activeSection === "account" ? "active" : ""}`}
            >
              <button
                className="btn btn-link"
                onClick={() => setActiveSection("account")}
              >
                Account
              </button>
            </li>
            <li
              className={`nav-item ${activeSection === "appearance" ? "active" : ""}`}
            >
              <button
                className="btn btn-link"
                onClick={() => setActiveSection("appearance")}
              >
                Appearance
              </button>
            </li>
            <li
              className={`nav-item ${activeSection === "notifications" ? "active" : ""}`}
            >
              <button
                className="btn btn-link"
                onClick={() => setActiveSection("notifications")}
              >
                Notifications
              </button>
            </li>
          </ul>
        </div>
        {/* Content Area */}
        <div className="user-profile-content">
          {error && <div className="alert alert-danger">{error}</div>}
          {renderSectionContent()}
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </div>
    </GlobalModal>
  );
};

export default UserProfileModal;
