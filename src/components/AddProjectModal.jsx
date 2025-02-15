// File: src/components/AddProjectModal.jsx
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import GlobalModal from "./GlobalModal";
import "../styles/components/projectModal.css";
import { getAuth } from "firebase/auth";
import { useProjects } from "../context/ProjectsContext";
import { toastSuccess, toastError } from "../utils/toastNotifications";
import confetti from "canvas-confetti";
import { logActivity } from "../utils/activityLogger";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { db } from "@config";
import CustomerCard from "./customerCardNewProject";

const AddProjectModal = ({ show, handleClose, editingProject }) => {
  // Step state for multi-step wizard
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 2;

  // Project form state
  const [projectName, setProjectName] = useState("");
  const [location, setLocation] = useState("");
  const [budget, setBudget] = useState("");
  const [projectType, setProjectType] = useState("fixed");
  const [dayRate, setDayRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  // Step Two fields
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [estimatedCompletionDate, setEstimatedCompletionDate] = useState("");
  const [status, setStatus] = useState("new");
  const [statusNote, setStatusNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Customer-related state
  const [customers, setCustomers] = useState([]);
  const [showCustomerCard, setShowCustomerCard] = useState(false);

  const auth = getAuth();
  const { addProject, updateProject } = useProjects();

  // Field-level validator
  const validateField = (field, value) => {
    let errorMsg = "";
    switch (field) {
      case "projectName":
        if (!value.trim()) errorMsg = "Project Name is required.";
        break;
      case "location":
        if (!value.trim()) errorMsg = "Location is required.";
        break;
      case "budget": {
        const raw = value.replace(/,/g, "");
        if (!raw || isNaN(raw) || parseFloat(raw) <= 0)
          errorMsg = "Budget must be greater than 0.";
        break;
      }
      case "dayRate": {
        const raw = value.replace(/,/g, "");
        if (!raw || isNaN(raw) || parseFloat(raw) <= 0)
          errorMsg = "Day rate must be greater than 0.";
        break;
      }
      case "hourlyRate": {
        const raw = value.replace(/,/g, "");
        if (!raw || isNaN(raw) || parseFloat(raw) <= 0)
          errorMsg = "Hourly rate must be greater than 0.";
        break;
      }
      default:
        break;
    }
    setErrors((prevErrors) => ({ ...prevErrors, [field]: errorMsg }));
  };

  // Simple step validation
  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!projectName.trim())
        newErrors.projectName = "Project Name is required.";
      if (!location.trim()) newErrors.location = "Location is required.";
      if (projectType === "fixed") {
        const rawBudget = budget.replace(/,/g, "");
        if (!rawBudget || isNaN(rawBudget) || parseFloat(rawBudget) <= 0)
          newErrors.budget = "Budget must be greater than 0.";
      } else if (projectType === "time_and_materials") {
        const rawDayRate = dayRate.replace(/,/g, "");
        const rawHourlyRate = hourlyRate.replace(/,/g, "");
        if (!rawDayRate || isNaN(rawDayRate) || parseFloat(rawDayRate) <= 0)
          newErrors.dayRate = "Day rate must be greater than 0.";
        if (
          !rawHourlyRate ||
          isNaN(rawHourlyRate) ||
          parseFloat(rawHourlyRate) <= 0
        )
          newErrors.hourlyRate = "Hourly rate must be greater than 0.";
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Helper to format currency
  const formatCurrencyValue = (value) => {
    const raw = value.replace(/,/g, "");
    const num = parseFloat(raw);
    if (isNaN(num)) return "";
    return num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Fetch existing customers from Firestore when the modal is shown
  useEffect(() => {
    if (show) {
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
    }
  }, [show]);

  // Pre-fill fields if editing an existing project
  useEffect(() => {
    if (editingProject) {
      setProjectName(editingProject.name || "");
      setLocation(editingProject.location || "");
      if (editingProject.projectType === "fixed") {
        setBudget(
          editingProject.budget
            ? parseFloat(editingProject.budget).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : ""
        );
      }
      setProjectType(editingProject.projectType || "fixed");
      if (editingProject.projectType === "time_and_materials") {
        setDayRate(
          editingProject.dayRate
            ? parseFloat(editingProject.dayRate).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : ""
        );
        setHourlyRate(
          editingProject.hourlyRate
            ? parseFloat(editingProject.hourlyRate).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })
            : ""
        );
      }
      setSelectedCustomer(editingProject.customerId || "");
      setEstimatedCompletionDate(editingProject.estimatedCompletionDate || "");
      setStatus(editingProject.status || "new");
      setStatusNote(editingProject.statusNote || "");
    } else {
      resetForm();
    }
  }, [editingProject, show]);

  const handleNext = () => {
    if (validateStep(1)) {
      setCurrentStep(2);
    } else {
      toastError("Please fix errors on this step before continuing.");
    }
  };

  const handleBack = () => {
    setCurrentStep(1);
  };

  const handleFinalSubmit = async () => {
    const step1Valid = validateStep(1);
    if (!step1Valid) {
      toastError("Please fix errors before saving.");
      return;
    }
    setLoading(true);
    try {
      if (
        projectType === "fixed" &&
        parseFloat(budget.replace(/,/g, "")) > 99999.99
      ) {
        startConfetti();
      }
      const projectData = {
        name: projectName,
        location,
        status: editingProject ? status : "new",
        estimatedCompletionDate,
        statusNote,
        ownerId: auth.currentUser?.uid,
        customerId: selectedCustomer || null,
        projectType,
        createdAt: editingProject?.createdAt || new Date(),
      };

      if (projectType === "fixed") {
        projectData.budget = parseFloat(budget.replace(/,/g, ""));
      } else if (projectType === "time_and_materials") {
        projectData.dayRate = parseFloat(dayRate.replace(/,/g, ""));
        projectData.hourlyRate = parseFloat(hourlyRate.replace(/,/g, ""));
      }

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

  const resetForm = () => {
    setProjectName("");
    setLocation("");
    setBudget("");
    setProjectType("fixed");
    setDayRate("");
    setHourlyRate("");
    setSelectedCustomer("");
    setEstimatedCompletionDate("");
    setStatus("new");
    setStatusNote("");
    setErrors({});
    setLoading(false);
    setCurrentStep(1);
  };

  const renderStepContent = () => {
    if (currentStep === 1) {
      return (
        <>
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
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={(e) => validateField("projectName", e.target.value)}
              />
            </div>
            {errors.projectName && (
              <div className="invalid-feedback">{errors.projectName}</div>
            )}
          </div>

          {/* Project Type Selection */}
          <div className="auth-form-group">
            <label htmlFor="projectType">Project Type</label>
            <div className="input-container">
              <span className="input-icon">
                <i className="bi bi-kanban"></i>
              </span>
              <select
                id="projectType"
                name="projectType"
                className="form-control"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
              >
                <option value="fixed">Fixed Budget</option>
                <option value="time_and_materials">Time &amp; Materials</option>
              </select>
            </div>
          </div>

          {/* Conditional Fields Based on Project Type */}
          {projectType === "fixed" ? (
            <div className="auth-form-group">
              <label htmlFor="budget">Budget ($)</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input
                  type="text"
                  id="budget"
                  name="budget"
                  className={`form-control ${errors.budget ? "is-invalid" : ""}`}
                  placeholder="Enter budget"
                  value={budget}
                  onChange={(e) => setBudget(e.target.value)}
                  onFocus={(e) => setBudget(e.target.value.replace(/,/g, ""))}
                  onBlur={(e) => {
                    const formatted = formatCurrencyValue(e.target.value);
                    setBudget(formatted);
                    validateField("budget", e.target.value);
                  }}
                />
              </div>
              {errors.budget && (
                <div className="invalid-feedback">{errors.budget}</div>
              )}
            </div>
          ) : (
            <>
              <div className="auth-form-group">
                <label htmlFor="dayRate">Day Rate ($)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="text"
                    id="dayRate"
                    name="dayRate"
                    className={`form-control ${errors.dayRate ? "is-invalid" : ""}`}
                    placeholder="Enter day rate"
                    value={dayRate}
                    onChange={(e) => setDayRate(e.target.value)}
                    onFocus={(e) =>
                      setDayRate(e.target.value.replace(/,/g, ""))
                    }
                    onBlur={(e) => {
                      const formatted = formatCurrencyValue(e.target.value);
                      setDayRate(formatted);
                      validateField("dayRate", e.target.value);
                    }}
                  />
                </div>
                {errors.dayRate && (
                  <div className="invalid-feedback">{errors.dayRate}</div>
                )}
              </div>
              <div className="auth-form-group">
                <label htmlFor="hourlyRate">Hourly Rate ($)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input
                    type="text"
                    id="hourlyRate"
                    name="hourlyRate"
                    className={`form-control ${errors.hourlyRate ? "is-invalid" : ""}`}
                    placeholder="Enter hourly rate"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    onFocus={(e) =>
                      setHourlyRate(e.target.value.replace(/,/g, ""))
                    }
                    onBlur={(e) => {
                      const formatted = formatCurrencyValue(e.target.value);
                      setHourlyRate(formatted);
                      validateField("hourlyRate", e.target.value);
                    }}
                  />
                </div>
                {errors.hourlyRate && (
                  <div className="invalid-feedback">{errors.hourlyRate}</div>
                )}
              </div>
            </>
          )}

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
                  if (e.target.value.trim()) {
                    setErrors((prev) => ({ ...prev, location: "" }));
                  }
                }}
                onBlur={(e) => validateField("location", e.target.value)}
              />
            </div>
            {errors.location && (
              <div className="invalid-feedback">{errors.location}</div>
            )}
          </div>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <>
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
                className="form-control"
                placeholder="Enter a status note (if applicable)"
                rows="2"
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              ></textarea>
            </div>
          </div>
        </>
      );
    }
  };

  return (
    <GlobalModal
      show={show}
      onClose={handleClose}
      title={editingProject ? "Edit Project" : "Add New Project"}
      leftContent={
        <div className="info-content">
          <h2>
            Step {currentStep} of {totalSteps}
          </h2>
          <p>
            {currentStep === 1
              ? "Enter basic project details."
              : "Enter additional project info."}
          </p>
          <div className="progress-indicator">
            <div
              className="progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      }
      rightContent={
        // Wrap rightContent in a container with position: relative so that
        // absolutely positioned children (CustomerCard) are relative to this container.
        <div style={{ position: "relative" }}>
          {renderStepContent()}
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button variant="secondary" type="button" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button variant="primary" type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                type="button"
                onClick={handleFinalSubmit}
                disabled={loading}
              >
                {loading
                  ? "Saving..."
                  : editingProject
                    ? "Save Changes"
                    : "Create Project"}
              </Button>
            )}
          </div>
          {/* Render the slide-in CustomerCard inside the modal container */}
          {showCustomerCard && (
            <CustomerCard
              onClose={() => setShowCustomerCard(false)}
              onSave={(newCustomer) => {
                (async () => {
                  try {
                    const docRef = await addDoc(
                      collection(db, "customers"),
                      newCustomer
                    );
                    const savedCustomer = { ...newCustomer, id: docRef.id };
                    // Immediately update the customers list and select the new customer
                    setCustomers((prev) => [...prev, savedCustomer]);
                    setSelectedCustomer(docRef.id);
                    setShowCustomerCard(false);
                    toastSuccess("New customer added successfully!");
                  } catch (error) {
                    console.error("Error adding new customer:", error);
                    toastError("Failed to add new customer.");
                  }
                })();
              }}
            />
          )}
        </div>
      }
    />
  );
};

export default AddProjectModal;
