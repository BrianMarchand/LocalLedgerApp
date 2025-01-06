import React, { useState } from "react";
import { Modal, Button, Tab, Tabs } from "react-bootstrap";
import FreeformNote from "./FreeformNote"; // Existing component
import ShoppingList from "./ShoppingList";

const NotesModal = ({ showNotes, setShowNotes, projectId }) => {
  const [activeTab, setActiveTab] = useState("freeform"); // Default tab

  return (
    <Modal
      show={showNotes}
      onHide={() => setShowNotes(false)} // Exit button handles closing
      backdrop="static" // Prevents clicking outside to close
      keyboard={false} // Disables escape key to close
      size="xl"
      className="modal-custom-size"
    >
      <Modal.Header closeButton>
        <Modal.Title>Project Notes</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Tab Navigation */}
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
              {/* Placeholder for Mini Notes */}
            </div>
          </Tab>
        </Tabs>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowNotes(false)}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default NotesModal;
