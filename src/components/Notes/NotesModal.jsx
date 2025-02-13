// File: src/components/Notes/NotesModal.jsx
import React, { useState, useEffect, useRef } from "react";
import GlobalModal from "../GlobalModal";
import FreeformNote from "./FreeformNote";
import ShoppingList from "./ShoppingList";
import Swal from "sweetalert2";
import { useProjects } from "../../context/ProjectsContext";
import "../../styles/components/notesModal.css";

const NotesModal = ({ showNotes, setShowNotes, projectId }) => {
  const { projects } = useProjects();

  // Active tab: "freeform", "shoppingList", or "miniNotes"
  const [activeTab, setActiveTab] = useState("freeform");
  // Selected project – always start fresh (even if a projectId is passed in, we want a new session)
  const [selectedProject, setSelectedProject] = useState("");
  // Unsaved flags for each section.
  const [unsaved, setUnsaved] = useState({
    freeform: false,
    shoppingList: false,
    miniNotes: false,
  });
  const overallUnsaved =
    unsaved.freeform || unsaved.shoppingList || unsaved.miniNotes;

  // Use separate saving states for each component.
  const [freeformSaving, setFreeformSaving] = useState(false);
  const [shoppingListSaving, setShoppingListSaving] = useState(false);
  const isSaving = freeformSaving || shoppingListSaving;

  // Refs for child components.
  const freeformRef = useRef(null);
  const shoppingListRef = useRef(null);

  useEffect(() => {
    if (showNotes) {
      setSelectedProject("");
      setActiveTab("freeform");
      setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
    }
  }, [showNotes]);

  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
  };

  const handleClose = async () => {
    if (overallUnsaved) {
      const result = await Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes. Do you really want to close without saving?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, close it!",
        cancelButtonText: "No, keep editing",
      });
      if (result.isConfirmed) {
        setShowNotes(false);
      }
    } else {
      setShowNotes(false);
    }
  };

  const handleSave = async () => {
    setFreeformSaving(true);
    setShoppingListSaving(true);
    try {
      // Always call freeform save to show its Swal, even if no changes.
      if (freeformRef.current) {
        await freeformRef.current.saveNote();
      }
      // Only trigger shopping list save if there are unsaved changes.
      if (unsaved.shoppingList && shoppingListRef.current) {
        await shoppingListRef.current.saveNote();
      }
      setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
      setShowNotes(false);
    } catch (error) {
      console.error("Error saving note:", error);
    } finally {
      setFreeformSaving(false);
      setShoppingListSaving(false);
    }
  };

  const freeformKey = `freeform-${selectedProject}`;
  const shoppingListKey = `shoppingList-${selectedProject}`;

  const rightContent = (
    <div className="notes-modal-content">
      <div className="notes-modal-header mb-3">
        <label htmlFor="projectSelect" className="form-label">
          Associate Note with Project
        </label>
        <select
          id="projectSelect"
          className="form-select"
          value={selectedProject}
          onChange={handleProjectChange}
        >
          <option value="">Select a project</option>
          {projects && projects.length > 0 ? (
            projects.map((proj) => (
              <option key={proj.id} value={proj.id}>
                {proj.name}
              </option>
            ))
          ) : (
            <option disabled>No projects available</option>
          )}
        </select>
      </div>
      <div className="notes-modal-body">
        <div style={{ display: activeTab === "freeform" ? "block" : "none" }}>
          <FreeformNote
            key={freeformKey}
            ref={freeformRef}
            projectId={selectedProject}
            onChange={(flag) =>
              setUnsaved((prev) => ({ ...prev, freeform: flag }))
            }
            onAutoSaving={setFreeformSaving}
          />
        </div>
        <div
          style={{ display: activeTab === "shoppingList" ? "block" : "none" }}
        >
          <ShoppingList
            key={shoppingListKey}
            ref={shoppingListRef}
            projectId={selectedProject}
            onChange={(flag) =>
              setUnsaved((prev) => ({ ...prev, shoppingList: flag }))
            }
            onAutoSaving={setShoppingListSaving}
          />
        </div>
        <div style={{ display: activeTab === "miniNotes" ? "block" : "none" }}>
          <p>Mini Notes feature coming soon.</p>
        </div>
      </div>
      {/* Only show the action buttons if a project is selected */}
      {selectedProject !== "" && (
        <div className="notes-modal-footer mt-3 d-flex justify-content-end align-items-center">
          <span
            style={{
              fontSize: "0.9rem",
              marginRight: "1rem",
              color: overallUnsaved ? "#d9534f" : "#5cb85c",
            }}
          >
            {overallUnsaved
              ? "You have unsaved changes!"
              : "All changes are saved."}
          </span>
          {activeTab === "freeform" && (
            <button
              className="btn btn-secondary me-2"
              onClick={() =>
                freeformRef.current && freeformRef.current.clearCanvas()
              }
              disabled={isSaving}
            >
              Erase Drawing
            </button>
          )}
          <button
            className="btn btn-secondary me-2"
            onClick={handleClose}
            disabled={isSaving}
          >
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Saving...
              </>
            ) : (
              "Save"
            )}
          </button>
        </div>
      )}
    </div>
  );

  const leftContent = (
    <div className="notes-modal-left">
      <div className="mobile-nav d-block d-md-none mb-3">
        <select
          className="form-select"
          value={activeTab}
          onChange={(e) => handleTabSwitch(e.target.value)}
        >
          <option value="freeform">Freeform</option>
          <option value="shoppingList">Shopping List</option>
          <option value="miniNotes">Mini Notes</option>
        </select>
      </div>
      <div className="notes-modal-sidebar d-none d-md-block">
        <ul className="sidebar-list navigation">
          <li
            className={`sidebar-list-item nav-item freeform ${
              activeTab === "freeform" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => handleTabSwitch("freeform")}
            >
              <i className="bi bi-pencil-square"></i>
              <span>Freeform</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item shoppingList ${
              activeTab === "shoppingList" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => handleTabSwitch("shoppingList")}
            >
              <i className="bi bi-list-task"></i>
              <span>Shopping List</span>
            </button>
          </li>
          <li
            className={`sidebar-list-item nav-item miniNotes ${
              activeTab === "miniNotes" ? "active" : ""
            }`}
          >
            <button
              className="sidebar-link"
              onClick={() => handleTabSwitch("miniNotes")}
            >
              <i className="bi bi-stickies"></i>
              <span>Mini Notes</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );

  return (
    <GlobalModal
      show={showNotes}
      onClose={handleClose}
      title="Project Notes"
      disableBackdropClick={true}
      leftContent={leftContent}
      rightContent={rightContent}
      leftWidth="20%"
      rightWidth="80%"
      leftContainerPadding="0"
      leftPanelClass="notes-modal-left-panel"
    />
  );
};

export default NotesModal;
