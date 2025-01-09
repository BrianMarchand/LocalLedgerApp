import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import { useProjects } from "../../context/ProjectsContext";
import { useNavigate } from "react-router-dom";
import confetti from "canvas-confetti";

// Import Steps and Validation
import ProjectDetails from "./steps/ProjectDetails";
import CustomerDetails from "./steps/CustomerDetails";
import CustomerNotes from "./steps/CustomerNotes";
import {
  projectDetailsSchema,
  customerDetailsSchema,
} from "./utils/validationSchema";

const AddProjectModal = ({ show, handleClose, editingProject }) => {
  // --- State ---
  const [step, setStep] = useState(1); // Current step
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    projectName: "",
    location: "",
    budget: "",
    status: "new",
    notes: "",
    firstName: "",
    familyName: "",
    fullAddress: "",
    phone: "",
    email: "",
    customerNotes: "",
  });

  const { addProject, updateProject } = useProjects();
  const navigate = useNavigate();

  // --- Pre-fill Fields if Editing ---
  useEffect(() => {
    if (editingProject) {
      setFormData({
        projectName: editingProject.name || "",
        location: editingProject.location || "",
        budget: editingProject.budget || "",
        status: editingProject.status || "new",
        notes: editingProject.notes || "",
        firstName: editingProject.firstName || "",
        familyName: editingProject.familyName || "",
        fullAddress: editingProject.fullAddress || "",
        phone: editingProject.phone || "",
        email: editingProject.email || "",
        customerNotes: editingProject.customerNotes || "",
      });
    }
  }, [editingProject, show]);

  // --- Navigation ---
  const nextStep = async () => {
    let isValid = true;

    // Validate current step
    if (step === 1) isValid = await projectDetailsSchema.isValid(formData);
    if (step === 2) isValid = await customerDetailsSchema.isValid(formData);

    if (!isValid) {
      toastError("Please complete all required fields before proceeding.");
      return;
    }

    setStep(step + 1);
  };

  const prevStep = () => setStep(step - 1);

  const updateFormData = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      setLoading(true); // Show spinner

      // --- Validate Project Details ---
      const isProjectValid = await projectDetailsSchema.isValid(formData);
      const isCustomerValid = await customerDetailsSchema.isValid(formData);

      // --- Stop if Invalid ---
      if (!isProjectValid || !isCustomerValid) {
        console.warn("Validation Errors Detected - Check Form Inputs.");
        setLoading(false); // Reset loading
        return; // NO TOAST ERROR - RELY ON FIELD ERRORS
      }

      // --- Save Data ---
      const dataToSave = {
        ...formData,
        status: editingProject ? formData.status : "new", // Force 'new' for new projects
      };

      if (editingProject) {
        await updateProject(editingProject.id, dataToSave);
        toastSuccess("Project updated successfully!"); // Toast for success ONLY
      } else {
        await addProject(dataToSave);
        toastSuccess("Project created successfully!"); // Toast for success ONLY
      }

      // --- Confetti for Big Budgets 🎉 ---
      if (parseFloat(dataToSave.budget) > 99999) startConfetti();

      // --- Close Modal ---
      handleClose();
    } catch (error) {
      // --- Log Firestore Errors ONLY - No validation errors ---
      console.error("Firestore Save Error:", error);

      // --- Critical errors only - FIRESTORE, not validation ---
      toastError(
        "Something went wrong while saving your project. Please try again.",
      );
    } finally {
      setLoading(false); // Always stop spinner
    }
  };

  const startConfetti = () => {
    const canvas = document.createElement("canvas");
    canvas.id = "confetti-canvas";
    canvas.style.position = "fixed";
    canvas.style.top = "0";
    canvas.style.left = "0";
    canvas.style.width = "100vw";
    canvas.style.height = "100vh";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "9999";
    document.body.appendChild(canvas);

    const confettiInstance = confetti.create(canvas, {
      resize: true,
      useWorker: true,
    });

    confettiInstance({
      particleCount: 300,
      spread: 160,
      startVelocity: 40,
      scalar: 1.5,
      gravity: 0.8,
      ticks: 200,
      origin: { x: 0.5, y: 0.5 },
    });

    setTimeout(() => {
      document.body.removeChild(canvas);
    }, 5000);
  };

  // --- Render Steps ---
  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <ProjectDetails
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
          />
        );
      case 2:
        return (
          <CustomerDetails
            formData={formData}
            updateFormData={updateFormData}
            nextStep={nextStep}
            prevStep={prevStep}
          />
        );
      case 3:
        return (
          <CustomerNotes
            formData={formData}
            updateFormData={updateFormData}
            prevStep={prevStep}
            handleSave={handleSave}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Modal show={show} onHide={handleClose} backdrop="static" centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {editingProject ? "Edit Project" : "Add New Project"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="modal-slide-container">{renderStep()}</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleClose}>
          Cancel
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddProjectModal;
