import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import { toastSuccess, toastError } from "../utils/toastNotifications"; // Import toast utilities

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

  // --- Validation State ---
  const [errors, setErrors] = useState({});

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
      setErrors({}); // Clear errors
    }
  }, [editingProject, show]);

  // --- Validation Function ---
  const validateForm = () => {
    const newErrors = {};

    if (!projectName.trim())
      newErrors.projectName = "Project Name is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!budget || parseFloat(budget) <= 0)
      newErrors.budget = "Budget must be greater than 0.";
    if (!status) newErrors.status = "Status is required.";

    // Validate notes if status is "cancelled"
    if (status === "cancelled" && !statusNote.trim()) {
      newErrors.statusNote = "Reason for cancellation is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if valid
  };

  // --- Handle Save ---
  const handleSave = async () => {
    if (!validateForm()) {
      toastWarning("Please check the input!");
      return;
    }

    setLoading(true);
    try {
      if (editingProject) {
        // Update existing project
        const projectRef = doc(db, "projects", editingProject.id);
        await updateDoc(projectRef, {
          name: projectName,
          location,
          budget: parseFloat(budget),
          status,
          statusNote,
          updatedAt: serverTimestamp(),
        });
        toastSuccess("Project updated successfully!");
      } else {
        // Add new project
        await addDoc(collection(db, "projects"), {
          name: projectName,
          location,
          budget: parseFloat(budget),
          status,
          statusNote,
          createdAt: serverTimestamp(),
        });
        toastSuccess("Project added successfully!");
      }

      handleClose();
    } catch (error) {
      console.error("Error saving project: ", error);
      toastError("Failed to save project. Please try again.");
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
        {/* Project Name */}
        <Form.Group className="mb-3">
          <Form.Label>Project Name</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter project name"
            value={projectName}
            isInvalid={!!errors.projectName} // Highlight invalid field
            onChange={(e) => {
              setProjectName(e.target.value);

              // Dynamic validation
              if (!e.target.value.trim()) {
                setErrors((prev) => ({
                  ...prev,
                  projectName: "Project Name is required.",
                }));
              } else {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.projectName; // Remove error if valid
                  return updated;
                });
              }
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errors.projectName}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Location */}
        <Form.Group className="mb-3">
          <Form.Label>Location</Form.Label>
          <Form.Control
            type="text"
            placeholder="Enter location"
            value={location}
            isInvalid={!!errors.location}
            onChange={(e) => {
              setLocation(e.target.value);
              if (!e.target.value.trim()) {
                setErrors((prev) => ({
                  ...prev,
                  location: "Location is required.",
                }));
              } else {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.location;
                  return updated;
                });
              }
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errors.location}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Budget */}
        <Form.Group className="mb-3">
          <Form.Label>Budget ($)</Form.Label>
          <Form.Control
            type="number"
            placeholder="Enter budget"
            value={budget}
            isInvalid={!!errors.budget}
            onChange={(e) => {
              setBudget(e.target.value);
              if (!e.target.value || parseFloat(e.target.value) <= 0) {
                setErrors((prev) => ({
                  ...prev,
                  budget: "Budget must be greater than 0.",
                }));
              } else {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.budget;
                  return updated;
                });
              }
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errors.budget}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Status */}
        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={status}
            isInvalid={!!errors.status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.status}
          </Form.Control.Feedback>
        </Form.Group>
        {/* Notes */}
        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Add notes (optional)"
            value={statusNote}
            isInvalid={!!errors.statusNote} // Validation for required notes
            onChange={(e) => {
              setStatusNote(e.target.value);

              // Validate dynamically for "Cancelled" status
              if (status === "cancelled" && !e.target.value.trim()) {
                setErrors((prev) => ({
                  ...prev,
                  statusNote: "Reason for cancellation is required.",
                }));
              } else {
                setErrors((prev) => {
                  const updated = { ...prev };
                  delete updated.statusNote; // Clear errors when valid
                  return updated;
                });
              }
            }}
          />
          <Form.Control.Feedback type="invalid">
            {errors.statusNote}
          </Form.Control.Feedback>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        {/* Cancel Button */}
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>

        {/* Save Button */}
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || Object.keys(errors).length > 0}
        >
          {loading ? "Saving..." : "Save Project"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProjectModal;
