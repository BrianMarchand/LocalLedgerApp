import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { ToastContainer, toast as notify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { db } from "../firebaseConfig";
import {
  addDoc,
  updateDoc,
  doc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

const AddProjectModal = ({
  show,
  handleClose,
  saveProject,
  editingProject,
}) => {
  // --- State ---
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("new"); // Default status is "new"
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    variant: "success",
  });

  // --- Pre-fill Fields if Editing ---
  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name || "");
      setLocation(editingProject.location || "");
      setBudget(editingProject.budget || "");
      setStatus(editingProject.status || "new");
      setStatusNote(editingProject.statusNote || "");
    } else {
      // Clear fields for new projects
      setProjectName("");
      setLocation("");
      setBudget("");
      setStatus("new");
      setStatusNote("");
    }
  }, [editingProject]);

  // --- Handle Save ---
  const handleSave = async () => {
    if (!projectName || !location || !budget) {
      toast.error("All fields are required!"); // Error toast
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "projects"), {
        name: projectName,
        location,
        budget: parseFloat(budget),
        status,
        createdAt: serverTimestamp(),
      });
      notify.success("Project added successfully!");
      handleClose(); // Close modal after saving
    } catch (error) {
      console.error("Error adding project: ", error);
      notify.error("Failed to add project. Please try again."); // Error toast
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingProject ? "Edit Project" : "Add New Project"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          {/* Project Name */}
          <Form.Group className="mb-3">
            <Form.Label>Project Name</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </Form.Group>

          {/* Location */}
          <Form.Group className="mb-3">
            <Form.Label>Location</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            />
          </Form.Group>

          {/* Budget */}
          <Form.Group className="mb-3">
            <Form.Label>Budget ($)</Form.Label>
            <Form.Control
              type="number"
              placeholder="Enter budget"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
            />
          </Form.Group>

          {/* Status */}
          <Form.Group className="mb-3">
            <Form.Label>Status</Form.Label>
            <Form.Select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="new">New</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </Form.Select>
          </Form.Group>

          {/* Notes */}
          <Form.Group className="mb-3">
            <Form.Label>Notes</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder="Add notes (optional)"
              value={statusNote}
              onChange={(e) => setStatusNote(e.target.value)}
            />
          </Form.Group>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        {/* Cancel Button */}
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>

        {/* Save Button */}
        <Button variant="primary" onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Project"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  <ToastContainer position="top-right" autoClose={3000} />;
};

export default AddProjectModal;
