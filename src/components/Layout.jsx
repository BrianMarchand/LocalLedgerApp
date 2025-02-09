import React, { useState } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import ActivityTicker from "./ActivityTicker";
import NotesModal from "./Notes/NotesModal"; // Import the NotesModal component

const Layout = ({
  pageTitle,
  children,
  activities,
  formatActivity,
  onAddProject,
  onAddTransaction,
  onAddCustomer,
}) => {
  // State to manage the visibility of the global Notes modal.
  const [showNotes, setShowNotes] = useState(false);
  // Optionally preselect a project when opening the Notes modal.
  // For a global note, this can remain an empty string.
  const [notesProjectId, setNotesProjectId] = useState("");

  return (
    <div>
      {/* Shared Navbar */}
      <Navbar page={pageTitle} />

      <div className="dashboard-main-container">
        {/* Shared Sidebar with action handlers */}
        <Sidebar
          onAddProject={onAddProject}
          onAddTransaction={onAddTransaction}
          onAddCustomer={onAddCustomer}
          onAddNote={() => setShowNotes(true)} // Trigger the global Notes modal
        />

        <div className="dashboard-content-container">
          {/* Optional shared ActivityTicker */}
          {activities && formatActivity && (
            <ActivityTicker
              activities={activities}
              formatActivity={formatActivity}
            />
          )}
          <div className="dashboard-content">{children}</div>
        </div>
      </div>

      {/* Global Notes Modal */}
      <NotesModal
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        projectId={notesProjectId}
      />
    </div>
  );
};

export default Layout;
