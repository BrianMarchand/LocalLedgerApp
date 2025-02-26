// File: src/components/UserProfileModal.jsx

import React, { useState, useEffect } from "react";
import GlobalModal from "./GlobalModal";
import { useAuth } from "../context/AuthContext";
import ProfilePictureUploader from "./ProfilePictureUploader";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@config"; // Firestore instance from your config
import "../styles/components/userProfileModal.css"; // Updated CSS is included below
import { updateProfile as firebaseUpdateProfile } from "firebase/auth";
import Swal from "sweetalert2";

const UserProfileModal = ({ show, onClose }) => {
  const { currentUser, refreshUser } = useAuth();

  // Active section of the modal
  const [activeSection, setActiveSection] = useState("profile");
  // Flag for unsaved changes
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  // Loading & error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Initial profile data using the nested schema
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
      email: "",
      password: "",
    },
    appearance: {
      theme: "light",
    },
    notifications: {
      emailNotifications: true,
      dashboardNotifications: true,
    },
    other: {
      displayName: "",
      role: "",
      email: "",
    },
  });

  // Fetch profile data when the modal opens and currentUser is available
  useEffect(() => {
    if (show && currentUser) {
      const fetchUserData = async () => {
        try {
          const docRef = doc(db, "users", currentUser.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const fetchedData = docSnap.data();
            const nestedData = {
              personalInfo: fetchedData.personalInfo || {
                firstName: fetchedData.firstName || "",
                lastName: fetchedData.lastName || "",
                nickname: fetchedData.nickname || "",
                shortBio: fetchedData.shortBio || "",
                profilePictureUrl: fetchedData.profilePictureUrl || "",
              },
              companyInfo: fetchedData.companyInfo || {
                companyName: fetchedData.company
                  ? fetchedData.company.companyName || ""
                  : "",
                businessAddress: fetchedData.company
                  ? fetchedData.company.businessAddress || ""
                  : "",
                businessPhone: fetchedData.company
                  ? fetchedData.company.businessPhone || ""
                  : "",
                businessEmail: fetchedData.company
                  ? fetchedData.company.businessEmail || ""
                  : "",
              },
              accountInfo: fetchedData.accountInfo
                ? { ...fetchedData.accountInfo, password: "" }
                : {
                    username: fetchedData.account
                      ? fetchedData.account.username || ""
                      : "",
                    email: fetchedData.email || "",
                    password: "",
                  },
              appearance: fetchedData.appearance || { theme: "light" },
              notifications: fetchedData.notifications || {
                emailNotifications: true,
                dashboardNotifications: true,
              },
              other: fetchedData.other || {
                displayName: fetchedData.displayName || "",
                role: fetchedData.role || "",
                email: fetchedData.email || "",
              },
            };
            setProfileData(nestedData);
            setUnsavedChanges(false);
          }
        } catch (err) {
          console.error("Error fetching user data:", err);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "Failed to fetch user data.",
          });
        }
      };
      fetchUserData();
    }
  }, [show, currentUser]);

  // Helper: update nested state
  const handleChange = (section, field, value) => {
    setProfileData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
    setUnsavedChanges(true);
  };

  // Wrap the close handler to check for unsaved changes.
  const handleModalClose = async () => {
    if (unsavedChanges) {
      const result = await Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Do you really want to close without saving?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, close it!",
        cancelButtonText: "No, keep editing",
      });
      if (result.isConfirmed) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  // Save profile changes
  const handleSave = async () => {
    setLoading(true);
    setError("");
    try {
      const docRef = doc(db, "users", currentUser.uid);
      const { password, ...accountInfoWithoutPassword } =
        profileData.accountInfo;
      await setDoc(
        docRef,
        {
          ...profileData,
          accountInfo: accountInfoWithoutPassword,
        },
        { merge: true }
      );
      // Always update Auth photoURL: if no image exists, pass null.
      await firebaseUpdateProfile(currentUser, {
        photoURL: profileData.personalInfo.profilePictureUrl
          ? profileData.personalInfo.profilePictureUrl
          : null,
      });
      // If available, force a reload of the currentUser before refreshing context.
      if (currentUser.reload) {
        await currentUser.reload();
      }
      await refreshUser();
      await Swal.fire({
        icon: "success",
        title: "Profile Updated",
        text: "Your profile has been successfully updated!",
        timer: 1500,
        showConfirmButton: false,
      });
      setUnsavedChanges(false);
      onClose();
    } catch (err) {
      console.error("Error updating profile:", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to update profile. Please try again.",
      });
      setError("Failed to update profile. Please try again.");
    }
    setLoading(false);
  };

  // Render section content based on activeSection
  const renderSectionContent = () => {
    switch (activeSection) {
      // Inside renderSectionContent() switch-case for "profile"
      case "profile":
        return (
          <div className="profile-section-content">
            <div className="row mb-3">
              {/* Left Column: Profile image uploader, centered both vertically and horizontally */}
              <div
                className="col-md-3 col-12 d-flex align-items-center justify-content-center mb-3 mb-md-0"
                style={{ minHeight: "150px" }}
              >
                <ProfilePictureUploader
                  currentUrl={profileData.personalInfo?.profilePictureUrl}
                  onUpload={(downloadURL) =>
                    handleChange(
                      "personalInfo",
                      "profilePictureUrl",
                      downloadURL
                    )
                  }
                  hidePreview={false} // Show the preview with overlay
                />
              </div>
              {/* Right Column: First Name, Last Name, Nickname */}
              <div className="col-md-9 col-12">
                <div className="form-group">
                  <label>First Name</label>
                  <div className="input-container">
                    <i className="bi bi-person input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.personalInfo?.firstName || ""}
                      onChange={(e) =>
                        handleChange(
                          "personalInfo",
                          "firstName",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <div className="input-container">
                    <i className="bi bi-person input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.personalInfo?.lastName || ""}
                      onChange={(e) =>
                        handleChange("personalInfo", "lastName", e.target.value)
                      }
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nickname</label>
                  <div className="input-container">
                    <i className="bi bi-person-badge input-icon"></i>
                    <input
                      type="text"
                      className="form-control"
                      value={profileData.personalInfo?.nickname || ""}
                      onChange={(e) =>
                        handleChange("personalInfo", "nickname", e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Full width: Short Bio */}
            <div className="form-group">
              <label>Short Bio</label>
              <div className="input-container textarea-container">
                <i className="bi bi-chat-left-text input-icon"></i>
                <textarea
                  className="form-control"
                  value={profileData.personalInfo?.shortBio || ""}
                  onChange={(e) =>
                    handleChange("personalInfo", "shortBio", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        );
      case "company":
        return (
          <div className="company-section-content">
            <div className="form-group">
              <label>Company Name</label>
              <div className="input-container">
                <i className="bi bi-building input-icon"></i>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.companyInfo?.companyName || ""}
                  onChange={(e) =>
                    handleChange("companyInfo", "companyName", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Business Address</label>
              <div className="input-container">
                <i className="bi bi-geo-alt input-icon"></i>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.companyInfo?.businessAddress || ""}
                  onChange={(e) =>
                    handleChange(
                      "companyInfo",
                      "businessAddress",
                      e.target.value
                    )
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Business Phone</label>
              <div className="input-container">
                <i className="bi bi-telephone input-icon"></i>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.companyInfo?.businessPhone || ""}
                  onChange={(e) =>
                    handleChange("companyInfo", "businessPhone", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Business Email</label>
              <div className="input-container">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className="form-control"
                  value={profileData.companyInfo?.businessEmail || ""}
                  onChange={(e) =>
                    handleChange("companyInfo", "businessEmail", e.target.value)
                  }
                />
              </div>
            </div>
          </div>
        );
      case "account":
        return (
          <div className="account-section-content">
            <div className="form-group">
              <label>Username</label>
              <div className="input-container">
                <i className="bi bi-person-check input-icon"></i>
                <input
                  type="text"
                  className="form-control"
                  value={profileData.accountInfo?.username || ""}
                  onChange={(e) =>
                    handleChange("accountInfo", "username", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-container">
                <i className="bi bi-envelope input-icon"></i>
                <input
                  type="email"
                  className="form-control"
                  value={
                    profileData.accountInfo?.email ||
                    profileData.other?.email ||
                    ""
                  }
                  onChange={(e) =>
                    handleChange("accountInfo", "email", e.target.value)
                  }
                />
              </div>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div className="input-container">
                <i className="bi bi-lock input-icon"></i>
                <input
                  type="password"
                  className="form-control"
                  placeholder="New password"
                  value={profileData.accountInfo?.password || ""}
                  onChange={(e) =>
                    handleChange("accountInfo", "password", e.target.value)
                  }
                />
              </div>
              <small className="form-text text-muted">
                Note: Updating your password requires a separate process.
              </small>
            </div>
          </div>
        );
      case "appearance":
        return (
          <div className="appearance-section-content">
            <div className="form-group">
              <label>Theme</label>
              <div className="input-container">
                <i className="bi bi-palette input-icon"></i>
                <select
                  className="form-control"
                  value={profileData.appearance?.theme || "light"}
                  onChange={(e) =>
                    handleChange("appearance", "theme", e.target.value)
                  }
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </div>
          </div>
        );
      case "notifications":
        return (
          <div className="notifications-section-content">
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="emailNotifications"
                checked={profileData.notifications?.emailNotifications || false}
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
                  profileData.notifications?.dashboardNotifications || false
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

  // Define left panel content (navigation sidebar and mobile nav)
  const leftContent = (
    <div className="user-profile-left">
      <div className="mobile-nav d-block d-md-none mb-3">
        <select
          className="form-select"
          value={activeSection}
          onChange={(e) => setActiveSection(e.target.value)}
        >
          <option value="profile">Profile</option>
          <option value="company">Company</option>
          <option value="account">Account</option>
          <option value="appearance">Appearance</option>
          <option value="notifications">Notifications</option>
        </select>
      </div>
      <div className="user-profile-sidebar d-none d-md-block">
        <ul className="sidebar-list navigation">
          <li
            className={`sidebar-list-item nav-item profile ${
              activeSection === "profile" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => setActiveSection("profile")}
            >
              <i className="bi bi-person"></i>
              <span>Profile</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item company ${
              activeSection === "company" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => setActiveSection("company")}
            >
              <i className="bi bi-building"></i>
              <span>Company</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item account ${
              activeSection === "account" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => setActiveSection("account")}
            >
              <i className="bi bi-person-check"></i>
              <span>Account</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item appearance ${
              activeSection === "appearance" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => setActiveSection("appearance")}
            >
              <i className="bi bi-palette"></i>
              <span>Appearance</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item notifications ${
              activeSection === "notifications" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => setActiveSection("notifications")}
            >
              <i className="bi bi-bell"></i>
              <span>Notifications</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  // Define right panel content (main content area)
  const rightContent = (
    <div className="user-profile-content">
      {error && <div className="alert alert-danger">{error}</div>}
      {renderSectionContent()}
      <div className="modal-footer">
        <button className="btn btn-secondary" onClick={handleModalClose}>
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
  );

  return (
    <GlobalModal
      show={show}
      onClose={handleModalClose}
      title="User Profile"
      disableBackdropClick={true}
      leftContent={leftContent}
      rightContent={rightContent}
      leftWidth="20%"
      rightWidth="80%"
      leftContainerPadding="0"
      leftPanelClass="user-profile-left-panel"
    />
  );
};

export default UserProfileModal;
