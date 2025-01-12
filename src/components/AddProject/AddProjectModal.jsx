import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  orderBy,
  query,
} from "firebase/firestore";

import { getAuth } from "firebase/auth";

import { db } from "../../firebaseConfig"; // Ensure Firestore DB is imported
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom"; // <-- React Router Hook
import {
  toastSuccess,
  toastError, // Correctly import as named exports
} from "../../utils/toastNotifications";

import { useProjects } from "../../context/ProjectsContext";
import confetti from "canvas-confetti"; // Import confetti 🎉

const AddProjectModal = ({ show, handleClose, editingProject }) => {
  // --- State ---
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("new"); // Default status
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(false);
  const auth = getAuth();

  // Validation Errors
  const [errors, setErrors] = useState({});

  // Context Methods
  const { addProject, updateProject } = useProjects();
  const { fetchProjects } = useProjects(); // Get fetchProjects
  const [isFormValid, setIsFormValid] = useState(false);
  const navigate = useNavigate(); // <-- Use navigate directly here!

  // --- Pre-fill Fields if Editing ---
  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name || "");
      setLocation(editingProject.location || "");
      setBudget(editingProject.budget || "");
      setStatus(editingProject?.status ?? "new"); // Keep status undefined if not set!
      setStatusNote(editingProject.statusNote || "");
    } else {
      resetForm(); // Reset fields for new project
    }
  }, [editingProject, show]);

  // --- Check is the form valid to effect button ---
  useEffect(() => {
    const isValid =
      !!projectName.trim() &&
      !!location.trim() &&
      parseFloat(budget) > 0 &&
      Object.keys(errors).length === 0;

    setIsFormValid(isValid); // Update form validity state
  }, [projectName, location, budget, errors]); // Run whenever these change

  // --- Form Validation ---
  const validateForm = () => {
    const newErrors = {};
    if (!projectName.trim())
      newErrors.projectName = "Project Name is required.";
    if (!location.trim()) newErrors.location = "Location is required.";
    if (!budget || isNaN(budget) || parseFloat(budget) <= 0)
      newErrors.budget = "Budget must be greater than 0.";
    if (status === "cancelled" && !statusNote.trim())
      newErrors.statusNote = "Reason for cancellation is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0; // Valid if no errors
  };

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors }; // Copy current errors

    switch (fieldName) {
      case "projectName":
        if (!value.trim()) newErrors.projectName = "Project Name is required.";
        else delete newErrors.projectName;
        break;

      case "location":
        if (!value.trim()) newErrors.location = "Location is required.";
        else delete newErrors.location;
        break;

      case "budget":
        if (!value || isNaN(value) || parseFloat(value) <= 0)
          newErrors.budget = "Budget must be greater than 0.";
        else delete newErrors.budget;
        break;

      default:
        break;
    }

    setErrors(newErrors); // Update error state
  };

  // --- Handle Save ---
  const handleSave = async () => {
    try {
      setLoading(true);

      // --- Validate Form First ---
      const isValid = validateForm(); // Use existing validation function
      if (!isValid) {
        setLoading(false); // Stop loading spinner
        toastError("Please fix errors before saving."); // Notify user
        return; // Exit early if invalid
      }

      // --- Prepare Project Data ---
      const projectData = {
        name: projectName,
        location,
        budget: parseFloat(budget),
        status: editingProject ? status : "new", // Force 'new' for new projects
        statusNote,
        order: 0,
        createdAt: new Date(),
        ownerId: auth.currentUser.uid, // Include ownerId
      };

      // --- Confetti Trigger Logic ---
      let triggerConfetti = false;
      if (projectData.budget > 99999) {
        triggerConfetti = true; // Confetti trigger
        console.log("Confetti Triggered!"); // Debugging log
      }

      // --- Handle Editing Mode ---
      const isTempId = editingProject?.id?.startsWith("temp-");

      if (editingProject && !isTempId) {
        console.log("EDIT MODE: Updating existing project...");

        await updateProject(editingProject.id, projectData);
        toastSuccess("Project updated successfully!");

        await fetchProjects(); // Refresh project list
        if (triggerConfetti) await startConfetti(); // Confetti animation
        handleClose(); // Close modal
        resetForm(); // Reset form
      } else {
        // --- Handle Create Mode ---
        console.log("CREATE MODE: Adding new project...");

        const snapshot = await getDocs(
          query(collection(db, "projects"), orderBy("order", "asc")),
        );

        const batch = writeBatch(db);

        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data();
          const projRef = doc(db, "projects", docSnap.id);
          batch.update(projRef, { order: data.order + 1 });
        });

        const newProjectRef = doc(collection(db, "projects"));
        batch.set(newProjectRef, projectData);
        await batch.commit();

        toastSuccess("Project created successfully!");
        if (triggerConfetti) await startConfetti();
        handleClose();
        resetForm();

        setTimeout(() => {
          console.log(`Navigating to new project: ${newProjectRef.id}`);
          navigate(`/project/${newProjectRef.id}`, { replace: true });
        }, 500);
      }

      // --- Additional Status Validation Rules ---
      if (
        status === "completed" &&
        parseFloat(budget) > 0 &&
        progressData.percentage < 100
      ) {
        toastError(
          "Cannot mark project as completed until the budget has been met.",
        );
        setLoading(false);
        return;
      }

      if (status === "in-progress" && !editingProject?.hasDeposit) {
        toastError(
          "Cannot mark as in-progress until a client payment is received.",
        );
        setLoading(false);
        return;
      }
    } catch (error) {
      console.error("Error saving project:", error);
      toastError(`Error saving project: ${error.message}`);
    } finally {
      setLoading(false); // Ensure loading spinner resets
    }
    console.log("Status Before Save:", status);
    console.log("Editing Project:", editingProject);
    console.log("Transactions:", editingProject?.transactions);
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

  const startConfetti = () => {
    // Create a full-screen canvas dynamically
    const canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.position = "fixed"; // Stay fixed on screen
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw"; // Full viewport width
    canvas.style.height = "100vh"; // Full viewport height
    canvas.style.pointerEvents = "none"; // Don't block clicks
    canvas.style.zIndex = "9999"; // Always on top

    // Append canvas to body
    document.body.appendChild(canvas);

    // Initialize confetti on this canvas
    const confettiInstance = confetti.create(canvas, {
      resize: true, // Dynamically resize with window
      useWorker: true, // Boost performance
    });

    // Launch the confetti
    confettiInstance({
      particleCount: 300, // Number of particles
      spread: 160, // Spread angle
      startVelocity: 40, // Launch speed
      scalar: 1.5, // Size of particles
      gravity: 0.8, // Falling speed
      ticks: 200, // Duration before particles disappear
      origin: { x: 0.5, y: 0.5 }, // Start at the center
    });

    // Auto-remove canvas after 5 seconds
    setTimeout(() => {
      document.body.removeChild(canvas);
    }, 5000); // 5 seconds
  };

  // --- Render Modal ---
  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      {" "}
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
            onChange={(e) => {
              setProjectName(e.target.value);
              validateField("projectName", e.target.value);
            }}
            onBlur={(e) => validateField("projectName", e.target.value)}
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
              validateField("location", e.target.value);
            }}
            onBlur={(e) => validateField("location", e.target.value)}
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
              validateField("budget", e.target.value);
            }}
            onBlur={(e) => validateField("budget", e.target.value)}
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
            disabled={
              !editingProject ||
              ["completed", "cancelled"].includes(status) ||
              (status === "new" && !editingProject?.hasDeposit) || // Guard against reload cases
              (!editingProject && status !== "new") // Lock dropdown for new projects
            }
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
      </Modal.Body>
      <Modal.Footer>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={loading || !isFormValid} // Use centralized validity state
        >
          {loading
            ? "Saving..."
            : editingProject
              ? "Save Changes"
              : "Create Project"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProjectModal;
