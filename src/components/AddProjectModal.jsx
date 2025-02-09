import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import GlobalModal from "./GlobalModal";
import "../styles/components/projectModal.css";
import { getAuth } from "firebase/auth";
import { useProjects } from "../context/ProjectsContext";
import { toastSuccess, toastError } from "../utils/toastNotifications";
import confetti from "canvas-confetti";
import { logActivity } from "../utils/activityLogger";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@config";
import CustomerCard from "./customerCardNewProject";

const AddProjectModal = ({ show, handleClose, editingProject }) => {
  // Project form state
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [status, setStatus] = useState("new");
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [isFormValid, setIsFormValid] = useState(false);

  // Customer-related state
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [showCustomerCard, setShowCustomerCard] = useState(false);

  const auth = getAuth();
  const { addProject, updateProject } = useProjects();

  // Fetch existing customers from Firestore
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersSnapshot = await getDocs(collection(db, "customers"));
        const customersList = customersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCustomers(customersList);
      } catch (err) {
        console.error("Error fetching customers:", err);
      }
    };
    fetchCustomers();
  }, []);

  // Pre-fill fields if editing an existing project
  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name || "");
      setLocation(editingProject.location || "");
      setBudget(editingProject.budget ? editingProject.budget.toString() : "");
      setStatus(editingProject.status || "new");
      setStatusNote(editingProject.statusNote || "");
      setEstimatedCompletionDate(editingProject.estimatedCompletionDate || "");
      if (editingProject.customerId) {
        setSelectedCustomer(editingProject.customerId);
      }
    } else {
      resetForm();
    }
  }, [editingProject, show]);

  // Validate form fields (simplified)
  useEffect(() => {
    const valid =
      projectName.trim() &&
      location.trim() &&
      parseFloat(budget) > 0 &&
      Object.keys(errors).length === 0;
    setIsFormValid(valid);
  }, [projectName, location, budget, errors]);

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
    return Object.keys(newErrors).length === 0;
  };

  const validateField = (fieldName, value) => {
    const newErrors = { ...errors };
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
      case "statusNote":
        if (status === "cancelled" && !value.trim())
          newErrors.statusNote = "Reason for cancellation is required.";
        else delete newErrors.statusNote;
        break;
      default:
        break;
    }
    setErrors(newErrors);
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

  const handleSaveProject = async () => {
    if (loading) return;
    setLoading(true);
    try {
      if (!validateForm()) {
        toastError("Please fix errors before saving.");
        setLoading(false);
        return;
      }

      if (parseFloat(budget) > 99999.99) {
        startConfetti();
      }

      const projectData = {
        name: projectName,
        location,
        budget: parseFloat(budget),
        status: editingProject ? status : "new",
        estimatedCompletionDate,
        statusNote,
        createdAt: editingProject?.createdAt || new Date(),
        ownerId: auth.currentUser?.uid,
        customerId: selectedCustomer || null,
      };

      if (editingProject?.id) {
        await updateProject({ ...editingProject, ...projectData });
        toastSuccess("Project updated successfully!");
      } else {
        await addProject(projectData);
        toastSuccess("Project created successfully!");
        await logActivity(
          `Project Added - ${projectData.name}`,
          "A new project was created.",
          { projectName: projectData.name }
        );
      }
      handleClose();
      resetForm();
    } catch (error) {
      console.error("Error saving project:", error);
      toastError("Failed to save project.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setProjectName("");
    setLocation("");
    setBudget("");
    setStatus("new");
    setStatusNote("");
    setErrors({});
    setEstimatedCompletionDate("");
    setLoading(false);
    setSelectedCustomer("");
  };

  // Handle saving a new customer from the inline customer card
  const handleSaveNewCustomer = (newCustomer) => {
    setCustomers((prev) => [...prev, newCustomer]);
    setSelectedCustomer(newCustomer.id);
    setShowCustomerCard(false);
  };

  return (
    <>
      <GlobalModal
        show={show}
        onClose={handleClose}
        title={editingProject ? "Edit Project" : "Add New Project"}
        leftContent={
          <div className="info-content">
            <h2>Step 1 of 1</h2>
            <p>Please fill in the project details below.</p>
            <div className="progress-indicator">
              <div className="progress-bar" style={{ width: "100%" }}></div>
            </div>
          </div>
        }
        rightContent={
          <div className="project-modal-content-wrapper">
            <div className="project-form">
              {/* Project Name Field */}
              <div className="auth-form-group">
                <label htmlFor="projectName">Project Name</label>
                <div className="input-container">
                  <span className="input-icon">
                    {errors.projectName ? (
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    ) : (
                      <i className="bi bi-folder"></i>
                    )}
                  </span>
                  <input
                    type="text"
                    id="projectName"
                    name="projectName"
                    className={`form-control ${errors.projectName ? "is-invalid" : ""}`}
                    placeholder="Enter project name"
                    value={projectName}
                    onChange={(e) => {
                      setProjectName(e.target.value);
                      validateField("projectName", e.target.value);
                    }}
                    onBlur={(e) => validateField("projectName", e.target.value)}
                  />
                </div>
                {errors.projectName && (
                  <div className="invalid-feedback">{errors.projectName}</div>
                )}
              </div>

              {/* Customer Dropdown Field */}
              <div className="auth-form-group">
                <label htmlFor="customer">Customer</label>
                <div className="input-container">
                  <span className="input-icon">
                    <i className="bi bi-person"></i>
                  </span>
                  <select
                    id="customer"
                    name="customer"
                    className="form-control"
                    value={selectedCustomer}
                    onChange={(e) => {
                      if (e.target.value === "add-new") {
                        setShowCustomerCard(true);
                        setSelectedCustomer("");
                      } else {
                        setSelectedCustomer(e.target.value);
                      }
                    }}
                  >
                    <option value="">Select a customer</option>
                    {customers.map((cust) => (
                      <option key={cust.id} value={cust.id}>
                        {cust.firstName} {cust.lastName}
                      </option>
                    ))}
                    <option value="add-new">+ Add New Customer</option>
                  </select>
                </div>
              </div>

              {/* Location Field */}
              <div className="auth-form-group">
                <label htmlFor="location">Location</label>
                <div className="input-container">
                  <span className="input-icon">
                    {errors.location ? (
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    ) : (
                      <i className="bi bi-geo-alt"></i>
                    )}
                  </span>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    className={`form-control ${errors.location ? "is-invalid" : ""}`}
                    placeholder="Enter location"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      validateField("location", e.target.value);
                    }}
                    onBlur={(e) => validateField("location", e.target.value)}
                  />
                </div>
                {errors.location && (
                  <div className="invalid-feedback">{errors.location}</div>
                )}
              </div>

              {/* Budget Field */}
              <div className="auth-form-group">
                <label htmlFor="budget">Budget ($)</label>
                <div className="input-container">
                  <span className="input-icon">
                    {errors.budget ? (
                      <i className="bi bi-exclamation-triangle-fill"></i>
                    ) : (
                      <i className="bi bi-currency-dollar"></i>
                    )}
                  </span>
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    className={`form-control ${errors.budget ? "is-invalid" : ""}`}
                    placeholder="Enter budget"
                    value={budget}
                    onChange={(e) => {
                      setBudget(e.target.value);
                      validateField("budget", e.target.value);
                    }}
                    onBlur={(e) => validateField("budget", e.target.value)}
                  />
                </div>
                {errors.budget && (
                  <div className="invalid-feedback">{errors.budget}</div>
                )}
              </div>

              {/* Estimated Completion Date Field */}
              <div className="auth-form-group">
                <label htmlFor="estimatedCompletionDate">
                  Estimated Completion Date
                </label>
                <div className="input-container">
                  <span className="input-icon">
                    <i className="bi bi-calendar"></i>
                  </span>
                  <input
                    type="date"
                    id="estimatedCompletionDate"
                    name="estimatedCompletionDate"
                    className="form-control"
                    value={
                      estimatedCompletionDate
                        ? estimatedCompletionDate.split("T")[0]
                        : ""
                    }
                    onChange={(e) => setEstimatedCompletionDate(e.target.value)}
                  />
                </div>
              </div>

              {/* Status Field */}
              <div className="auth-form-group">
                <label htmlFor="status">Status</label>
                <div className="input-container">
                  <span className="input-icon">
                    <i className="bi bi-info-circle"></i>
                  </span>
                  <select
                    id="status"
                    name="status"
                    className="form-control"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    disabled={
                      !editingProject ||
                      ["completed", "cancelled"].includes(status) ||
                      (status === "new" && !editingProject?.hasDeposit) ||
                      (!editingProject && status !== "new")
                    }
                  >
                    {[
                      "new",
                      "in-progress",
                      "completed",
                      "on-hold",
                      "cancelled",
                    ].map((statusKey) => (
                      <option key={statusKey} value={statusKey}>
                        {statusKey
                          .replace("-", " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Status Note Field */}
              <div className="auth-form-group">
                <label htmlFor="statusNote">Status Note</label>
                <div className="input-container">
                  <span className="input-icon">
                    <i className="bi bi-pencil"></i>
                  </span>
                  <textarea
                    id="statusNote"
                    name="statusNote"
                    className={`form-control ${errors.statusNote ? "is-invalid" : ""}`}
                    placeholder="Enter a status note (if applicable)"
                    rows="2"
                    value={statusNote}
                    onChange={(e) => {
                      setStatusNote(e.target.value);
                      validateField("statusNote", e.target.value);
                    }}
                    onBlur={(e) => validateField("statusNote", e.target.value)}
                  ></textarea>
                </div>
                {errors.statusNote && (
                  <div className="invalid-feedback">{errors.statusNote}</div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  type="button"
                  onClick={handleSaveProject}
                  disabled={loading || !isFormValid}
                >
                  {loading
                    ? "Saving..."
                    : editingProject
                      ? "Save Changes"
                      : "Create Project"}
                </Button>
              </div>
            </div>

            {/* Inline Sliding Customer Card */}
            {showCustomerCard && (
              <CustomerCard
                onClose={() => setShowCustomerCard(false)}
                onSave={handleSaveNewCustomer}
              />
            )}
          </div>
        }
      />
    </>
  );
};

export default AddProjectModal;
