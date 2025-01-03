import React, { useState, useEffect } from "react";
import { db } from "../firebaseConfig"; // Adjust the path based on your project structure
import { Modal, Button, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { toastSuccess, toastError } from "../utils/toastNotifications";
import { useProjects } from "../context/ProjectsContext";
import {
  doc,
  setDoc,
  serverTimestamp,
  getDocs,
  collection,
} from "firebase/firestore";
const AddProjectModal = ({ show, handleClose, editingProject }) => {
  // --- State ---
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("new");
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(false);

  // Validation State
  const [errors, setErrors] = useState({});

  // Context methods
  const { addProject, updateProject, projects } = useProjects();

  // --- Pre-fill Fields if Editing ---
  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name || "");
      setLocation(editingProject.location || "");
      setBudget(editingProject.budget || "");
      setStatus(editingProject.status || "new");
      setStatusNote(editingProject.statusNote || "");
    } else {
      resetForm(); // Reset fields for new project
    }
  }, [editingProject, show]);

  // --- Dynamic Validation for Status Notes ---
  useEffect(() => {
    if (status === "cancelled" && !statusNote.trim()) {
      setErrors((prev) => ({
        ...prev,
        statusNote: "Reason for cancellation is required.",
      }));
    } else {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated.statusNote;
        return updated;
      });
    }
  }, [status, statusNote]);

  // --- Form Validation ---
  const validateForm = () => {
    const newErrors = {};

    if (!projectName.trim())
      newErrors.projectName = "Project Name is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!budget || isNaN(budget) || parseFloat(budget) <= 0)
      newErrors.budget = "Budget must be greater than 0.";
    if (!status) newErrors.status = "Status is required.";

    // Notes required for "cancelled" status
    if (status === "cancelled" && !statusNote.trim()) {
      newErrors.statusNote = "Reason for cancellation is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Return true if valid
  };

  // --- Handle Save ---
  const handleSave = async () => {
    try {
      setLoading(true);

      if (!validateForm()) {
        setLoading(false);
        return;
      }

      // Fetch existing projects to calculate order dynamically
      const querySnapshot = await getDocs(collection(db, "projects"));
      const maxOrder = querySnapshot.empty
        ? 0 // If no projects exist, default order to 0
        : Math.max(...querySnapshot.docs.map((doc) => doc.data().order || 0));

      const projectRef = editingProject
        ? doc(db, "projects", editingProject.id) // Use existing ID if editing
        : doc(collection(db, "projects")); // Auto-generate new Firestore ID

      // Save the new project with the order field
      await setDoc(
        projectRef,
        {
          name: projectName,
          location,
          budget: parseFloat(budget) || 0,
          status,
          statusNote,
          createdAt: editingProject?.createdAt || serverTimestamp(),
          order: maxOrder + 1,
        },
        { merge: true },
      );

      toastSuccess("Project saved successfully!");
      handleCloseModal();
    } catch (error) {
      console.error("Error saving project:", error);
      toastError(`Error saving project: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- Reset Form ---
  const resetForm = () => {
    setProjectName("");
    setLocation("");
    setBudget("");
    setStatus("new");
    setStatusNote("");
    setErrors({});
    setLoading(false);
  };

  // --- Close Modal and Reset ---
  const handleCloseModal = () => {
    handleClose(); // Close modal
    resetForm(); // Reset form fields
  };

  // --- Render Modal ---
  return (
    <Modal show={show} onHide={handleCloseModal} backdrop="static" centered>
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
            isInvalid={!!errors.projectName}
            onChange={(e) => setProjectName(e.target.value)}
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
            onChange={(e) => setLocation(e.target.value)}
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
            onChange={(e) => setBudget(e.target.value)}
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
            {["new", "in-progress", "completed", "on-hold", "cancelled"].map(
              (statusKey) => (
                <option key={statusKey} value={statusKey}>
                  {statusKey
                    .replace("-", " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ),
            )}
          </Form.Select>
          <Form.Control.Feedback type="invalid">
            {errors.status}
          </Form.Control.Feedback>
        </Form.Group>

        {/* Status Note */}
        <Form.Group className="mb-3">
          <Form.Label>Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder={
              status === "cancelled"
                ? "Provide reason for cancellation"
                : "Add notes (optional)"
            }
            value={statusNote}
            isInvalid={!!errors.statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />
          <Form.Control.Feedback type="invalid">
            {errors.statusNote}
          </Form.Control.Feedback>
        </Form.Group>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCloseModal}>
          Cancel
        </Button>
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
