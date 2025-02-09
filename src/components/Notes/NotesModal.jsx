// File: src/components/Notes/NotesModal.jsx
import React, { useState, useEffect } from "react";
import GlobalModal from "../GlobalModal";
import FreeformNote from "./FreeformNote";
import ShoppingList from "./ShoppingList";
import Swal from "sweetalert2";
import { useProjects } from "../../context/ProjectsContext";
import "../../styles/components/notesModal.css";

const NotesModal = ({ showNotes, setShowNotes, projectId }) => {
  // Retrieve projects from context
  const { projects } = useProjects();

  // Track which tab is active
  const [activeTab, setActiveTab] = useState("freeform");
  // Track the currently selected project (may be passed as a prop)
  const [selectedProject, setSelectedProject] = useState(projectId || "");

  // Store note data for each tab in state so unsaved changes persist
  const [freeformContent, setFreeformContent] = useState("");
  const [shoppingListItems, setShoppingListItems] = useState([]);
  // (Assume miniNotes is not yet implemented)
  const [miniNotesContent, setMiniNotesContent] = useState("");

  // Track unsaved (dirty) status for each tab
  const [unsaved, setUnsaved] = useState({
    freeform: false,
    shoppingList: false,
    miniNotes: false,
  });

  // Compute an overall unsaved flag
  const overallUnsaved =
    unsaved.freeform || unsaved.shoppingList || unsaved.miniNotes;

  // When the projectId prop changes, update the selectedProject.
  useEffect(() => {
    if (projectId) {
      setSelectedProject(projectId);
      // (You might also want to load the existing note data from the DB here.)
      // For now, we simply reset the unsaved flags.
      setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
    }
  }, [projectId]);

  // Handler for when the project selection dropdown changes.
  const handleProjectChange = (e) => {
    setSelectedProject(e.target.value);
    // Optionally, load the note data for the new project.
    // Reset unsaved flags (or decide how you want to handle unsaved data).
    setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
  };

  // When switching tabs, check if the current tab has unsaved changes.
  // If so, prompt the user before switching.
  const handleTabSwitch = async (newTab) => {
    if (activeTab !== newTab && unsaved[activeTab]) {
      const result = await Swal.fire({
        title: "Unsaved Changes",
        text: "You have unsaved changes in this tab. Do you want to save them before switching?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Yes, save",
        cancelButtonText: "Cancel",
      });
      if (result.isConfirmed) {
        // Call the appropriate save function
        if (activeTab === "freeform") {
          await saveFreeformNote();
        } else if (activeTab === "shoppingList") {
          await saveShoppingList();
        }
        // Mark the current tab as saved
        setUnsaved((prev) => ({ ...prev, [activeTab]: false }));
      } else {
        // Do not switch if the user cancels
        return;
      }
    }
    setActiveTab(newTab);
  };

  // When the user clicks the overall Cancel button.
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

  // The overall Save button saves changes from all tabs that are marked unsaved.
  const handleSave = async () => {
    if (unsaved.freeform) {
      await saveFreeformNote();
    }
    if (unsaved.shoppingList) {
      await saveShoppingList();
    }
    // (Add miniNotes save if implemented.)
    setUnsaved({ freeform: false, shoppingList: false, miniNotes: false });
    setShowNotes(false);
  };

  // Dummy save functions – replace these with your Firestore update calls.
  const saveFreeformNote = async () => {
    console.log(
      "Saving freeform note for project:",
      selectedProject,
      freeformContent
    );
    // For example, update Firestore with freeformContent for this project.
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  const saveShoppingList = async () => {
    console.log(
      "Saving shopping list for project:",
      selectedProject,
      shoppingListItems
    );
    // For example, update Firestore with shoppingListItems for this project.
    await new Promise((resolve) => setTimeout(resolve, 500));
  };

  // LEFT PANEL: Navigation (mobile dropdown and desktop sidebar)
  const leftContent = (
    <div className="notes-modal-left">
      {/* Mobile navigation */}
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
      {/* Desktop sidebar navigation */}
      <div className="notes-modal-sidebar d-none d-md-block">
        <ul className="sidebar-list navigation">
          <li
            className={`sidebar-list-item nav-item freeform ${activeTab === "freeform" ? "active" : ""}`}
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
            className={`sidebar-list-item nav-item shoppingList ${activeTab === "shoppingList" ? "active" : ""}`}
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
            className={`sidebar-list-item nav-item miniNotes ${activeTab === "miniNotes" ? "active" : ""}`}
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

  // RIGHT PANEL: Header with project selection, the note content for the active tab, and a footer with the unsaved message plus Cancel/Save buttons.
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
        {activeTab === "freeform" && (
          <FreeformNote
            projectId={selectedProject}
            content={freeformContent}
            onContentChange={(newContent) => {
              setFreeformContent(newContent);
              setUnsaved((prev) => ({ ...prev, freeform: true }));
            }}
          />
        )}
        {activeTab === "shoppingList" && (
          <ShoppingList
            projectId={selectedProject}
            items={shoppingListItems}
            onItemsChange={(newItems) => {
              setShoppingListItems(newItems);
              setUnsaved((prev) => ({ ...prev, shoppingList: true }));
            }}
          />
        )}
        {activeTab === "miniNotes" && (
          <div>
            <p>Mini Notes feature goes here!</p>
          </div>
        )}
      </div>
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
        <button className="btn btn-secondary me-2" onClick={handleClose}>
          Cancel
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          Save
        </button>
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
