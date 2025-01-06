import React, { useState } from "react";
import { Modal, Button, Tab, Tabs } from "react-bootstrap";
import FreeformNote from "./FreeformNote";
import ShoppingList from "./ShoppingList";

const NotesModal = ({ showNotes, setShowNotes, projectId }) => {
  const [activeTab, setActiveTab] = useState("freeform");

  // Placeholder for save functionality
  const handleSave = () => {
    console.log("Saving notes..."); // Replace with your save logic if needed
    setShowNotes(false); // Close modal after saving
  };

  return (
    <Modal
      show={showNotes}
      onHide={() => setShowNotes(false)}
      size="xl"
      backdrop="static" // Prevent accidental closing
      keyboard={false} // Disable ESC key to close
      className="modal-custom-size"
    >
      {/* Header */}
      <Modal.Header closeButton>
        <Modal.Title>Project Notes</Modal.Title>
      </Modal.Header>

      {/* Body */}
      <Modal.Body>
        <Tabs
          id="notes-tabs"
          activeKey={activeTab}
          onSelect={(tab) => setActiveTab(tab)}
          className="mb-3"
        >
          <Tab eventKey="freeform" title="Freeform Notes">
            <FreeformNote projectId={projectId} />
          </Tab>

          <Tab eventKey="shoppingList" title="Shopping List">
            <ShoppingList projectId={projectId} />
          </Tab>

          <Tab eventKey="miniNotes" title="Mini Notes">
            <div>
              <p>Mini Notes feature goes here!</p>
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>

      {/* Footer */}
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowNotes(false)}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          Save
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesModal;
