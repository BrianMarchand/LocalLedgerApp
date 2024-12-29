import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // <-- NEW
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import Theme Hook
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import * as bootstrap from "bootstrap"; // Explicitly import Bootstrap JS
import AddProjectModal from "../components/AddProjectModal";

import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
} from "firebase/firestore";

function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- This MUST stay here at the top!

  // --- Modal Window: Projects ---
  const [showModal, setShowModal] = useState(false);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  // --- State Management ---
  const [projects, setProjects] = useState([]); // Store projects from Firestore
  const [editingProject, setEditingProject] = useState(null); // Track project being edited
  const [tempProjects, setTempProjects] = useState([]); // Store temporary projects

  // --- Update Status Dynamically Based on Transactions ---
  const determineStatus = (transactions) => {
    if (!transactions || transactions.length === 0) return "new";

    const hasDeposit = transactions.some((t) => t.category === "deposit");
    const hasFinalPayment = transactions.some(
      (t) => t.category === "final-payment",
    );

    if (hasFinalPayment) return "completed";
    if (hasDeposit) return "in-progress";

    return "new"; // Default fallback
  };

  // --- Fetch Projects ---
  const fetchProjects = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "projects")); // Query Firestore
      const projectList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList); // Update state
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  // --- Project Fetching Logic For Modal ---
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "projects"), (snapshot) => {
      const projectList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList); // Update state dynamically
    });

    return () => unsubscribe(); // Cleanup listener
  }, []);

  // --- Load Data on Component Mount ---
  useEffect(() => {
    fetchProjects(); // Fetch projects initially
  }, []);
  const { darkMode, toggleTheme } = useTheme(); // Get theme state and toggle function

  // --- Add New Project (For Modal) ---
  const addNewProject = async (newProject) => {
    try {
      // Add project to Firestore
      const docRef = await addDoc(collection(db, "projects"), newProject);

      // Add to local state immediately for instant UI update
      setProjects((prev) => [
        ...prev,
        { id: docRef.id, ...newProject }, // Include Firestore ID
      ]);

      handleModalClose(); // Close the modal
    } catch (error) {
      console.error("Error adding project: ", error);
    }
  };

  // --- Edit Existing Project (For Inline Editing) ---
  const editProject = async (updatedProject) => {
    try {
      // Update existing project in Firestore
      const docRef = doc(db, "projects", updatedProject.id);
      await updateDoc(docRef, updatedProject);

      // Update local state immediately for instant UI update
      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === updatedProject.id ? updatedProject : proj,
        ),
      );

      setEditingProject(null); // Exit edit mode
    } catch (error) {
      console.error("Error updating project: ", error);
    }
  };

  // --- Start New Project ---
  const startNewProject = () => {
    const tempProject = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: "",
      location: "",
      budget: "",
      status: "new",
      statusDate: new Date(),
      statusNote: "",
      isTemp: true, // Mark as temporary
    };
    setEditingProject(tempProject); // Start editing mode
    setTempProjects([tempProject]); // Add to temporary list
  };

  // --- Mark as Complete ---
  const markAsComplete = async (project) => {
    // --- Validate Status Change Dynamically ---
    const isValid = await validateStatusChange(project, "completed");
    if (!isValid) return; // Stop if validation fails

    const confirmed = window.confirm(
      "Are you sure you want to mark this project as Complete?",
    );
    if (!confirmed) return;

    try {
      // --- Update Status in Firestore ---
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: "completed",
        statusDate: new Date(),
      });

      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error("Error marking project as complete:", error);
      alert("Failed to update status. Please try again.");
    }
  };

  const calculateRemainingPayment = (transactions) => {
    if (!transactions || transactions.length === 0) return 0;

    const totalIncome = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    const totalExpenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + Number(t.amount), 0);

    return totalIncome - totalExpenses; // Remaining payment
  };

  // --- Cancel Project ---
  const cancelProject = async (project) => {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this project? This cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: "cancelled",
        statusDate: new Date(),
      });

      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error("Error cancelling project:", error);
    }
  };

  // --- Validate Status Check ---
  const validateStatusChange = async (project, targetStatus) => {
    try {
      // --- Fetch Latest Transactions ---
      const transactionsSnapshot = await getDocs(
        collection(db, `projects/${project.id}/transactions`),
      );
      const transactions = transactionsSnapshot.docs.map((doc) => doc.data());

      // --- Calculate Metrics Using Dashboard Rules ---
      const totalIncome = transactions
        .filter((t) => t.category === "Client Payment") // Matches Dashboard rule
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const totalExpenses = transactions
        .filter((t) => t.category !== "Client Payment") // Matches Dashboard rule
        .reduce((sum, t) => sum + Number(t.amount), 0);

      const remainingClientPayment = (project.budget || 0) - totalIncome; // Matches Dashboard rule
      const availableFunds = totalIncome - totalExpenses; // Matches Dashboard rule

      // --- Check for Completed Status ---
      if (targetStatus === "completed") {
        // 1. Block if remaining client payment > 0
        if (remainingClientPayment > 0) {
          alert(
            `Cannot complete project. Remaining client payment must be $0. Current balance: $${remainingClientPayment}`,
          );
          return false;
        }

        // 2. Check for a deposit transaction (category = "Client Payment")
        const hasDeposit = transactions.some(
          (t) =>
            t.category === "Client Payment" &&
            t.name.toLowerCase().includes("deposit"),
        );

        if (!hasDeposit) {
          alert(
            "Cannot complete project. At least one 'deposit' transaction is required.",
          );
          return false;
        }
      }

      return true; // Validation passed
    } catch (error) {
      console.error("Error validating status change:", error);
      alert("Validation failed. Please try again.");
      return false;
    }
  };
  // --- Save Project ---
  const saveProject = async () => {
    if (!editingProject.name || !editingProject.status) {
      alert("Please fill out all required fields.");
      return; // Prevent saving invalid data
    }

    try {
      if (editingProject.isTemp) {
        // Create a new project in Firestore
        const newDoc = await addDoc(collection(db, "projects"), {
          name: editingProject.name,
          location: editingProject.location,
          budget: editingProject.budget,
          status: editingProject.status,
          statusDate: new Date(),
          statusNote: editingProject.statusNote,
        });

        console.log("New project saved:", newDoc.id);
        setTempProjects([]); // Clear temporary projects
      } else {
        // Update existing project
        const docRef = doc(db, "projects", editingProject.id);
        await updateDoc(docRef, editingProject);
      }

      // Refresh the project list
      await fetchProjects(); // Important: Ensure all data reloads
      setEditingProject(null); // Exit edit mode
    } catch (error) {
      console.error("Error saving project:", error);
    }
  };

  // --- Cancel Button ---
  const cancelEdit = () => {
    if (editingProject.isTemp) {
      setTempProjects([]); // Remove temporary projects
    }
    setEditingProject(null); // Exit edit mode
  };

  // --- Delete Project ---
  const deleteProject = async (id) => {
    try {
      const docRef = doc(db, "projects", id);
      await deleteDoc(docRef); // Remove from Firestore
      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  };

  // --- Status Badge Styles ---
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return "badge bg-secondary"; // Gray
      case "in-progress":
        return "badge bg-primary"; // Blue
      case "completed":
        return "badge bg-success"; // Green
      case "on-hold":
        return "badge bg-warning"; // Yellow
      case "cancelled":
        return "badge bg-danger"; // Red
      default:
        return "badge bg-light"; // Default
    }
  };

  // --- Status Color Mapping ---
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "new":
        return "primary";
      case "in-progress":
        return "warning";
      case "completed":
        return "success";
      case "on-hold":
        return "secondary";
      case "cancelled":
        return "danger";
      default:
        return "light";
    }
  };

  // --- Format Timestamp ---
  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";

    // Handle Firestore Timestamp or JavaScript Date
    const date = timestamp.toDate ? timestamp.toDate() : timestamp;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const combinedProjects = [...tempProjects, ...projects]; // Merge temp and saved projects

  // --- Tooltip Initialization ---
  useEffect(() => {
    console.log("Initializing tooltips...");

    // Initialize tooltips after rendering
    requestAnimationFrame(() => {
      const tooltipTriggerList = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
      );
      console.log("Tooltip elements found:", tooltipTriggerList);

      tooltipTriggerList.forEach((tooltipTriggerEl) => {
        const existingTooltip = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (!existingTooltip) {
          // --- Initialize Tooltip ---
          const newTooltip = new bootstrap.Tooltip(tooltipTriggerEl);

          // --- FIX: Close Tooltip on Click or Focus Loss ---
          tooltipTriggerEl.addEventListener("click", () => {
            console.log("Tooltip clicked! Hiding...");
            newTooltip.hide(); // Force hide tooltip when clicked
          });

          tooltipTriggerEl.addEventListener("blur", () => {
            console.log("Focus lost! Hiding tooltip...");
            newTooltip.hide(); // Hide tooltip when focus is lost
          });
        }
      });
    });

    // Cleanup tooltips on unmount
    return () => {
      console.log("Cleaning up tooltips...");

      // --- Forcefully Hide & Dispose All Tooltips ---
      const allTooltips = document.querySelectorAll(
        '[data-bs-toggle="tooltip"]',
      );
      allTooltips.forEach((tooltipTriggerEl) => {
        const instance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
        if (instance) {
          instance.hide(); // <<< HIDE TOOLTIP FIRST
          console.log("Disposing Tooltip on Unmount:", tooltipTriggerEl);
          instance.dispose(); // <<< THEN DISPOSE TOOLTIP
        }
      });
    };
  }, [projects]); // Re-run when 'projects' change

  // --- Fix Stuck Tooltips on Route Changes ---
  useEffect(() => {
    console.log("Route changed! Cleaning up lingering tooltips...");

    // Cleanup tooltips when navigating away
    const allTooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    allTooltips.forEach((tooltipTriggerEl) => {
      const instance = bootstrap.Tooltip.getInstance(tooltipTriggerEl);
      if (instance) {
        instance.hide(); // <<< HIDE TOOLTIP FIRST
        console.log("Disposing Tooltip on Route Change:", tooltipTriggerEl);
        instance.dispose(); // <<< THEN DISPOSE TOOLTIP
      }
    });
  }, [location]); // Re-run whenever route changes

  return (
    <div>
      {/* --- Navbar --- */}
      <Navbar page="projectDashboard" />

      <div className="container mt-4">
        <h1 className="mb-4">Your current projects:</h1>

        {/* Show Projects */}
        {combinedProjects.length === 0 ? (
          <p>
            No projects available.{" "}
            <a href="#" onClick={startNewProject}>
              Start your first project!
            </a>
          </p>
        ) : (
          <div className="row">
            {combinedProjects.map((project) => (
              <div key={project.id} className="col-md-4 mb-4">
                <div className="card shadow-sm">
                  <div className="card-body">
                    {editingProject && editingProject.id === project.id ? (
                      // --- Inline Edit Mode ---
                      <>
                        <input
                          type="text"
                          placeholder="Project Name"
                          value={editingProject.name}
                          className="form-control mb-2"
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              name: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          placeholder="Location"
                          value={editingProject.location}
                          className="form-control mb-2"
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              location: e.target.value,
                            })
                          }
                        />
                        <input
                          type="number"
                          placeholder="Budget"
                          value={editingProject.budget}
                          className="form-control mb-2"
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              budget: e.target.value,
                            })
                          }
                        />
                        <select
                          className="form-select mb-2"
                          value={editingProject.status}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              status: e.target.value,
                            })
                          }
                        >
                          <option value="new">New</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="on-hold">On Hold</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                        <textarea
                          className="form-control mb-2"
                          placeholder="Notes (Optional)"
                          value={editingProject.statusNote}
                          onChange={(e) =>
                            setEditingProject({
                              ...editingProject,
                              statusNote: e.target.value,
                            })
                          }
                        ></textarea>
                        <div className="d-flex gap-2">
                          <button
                            className="btn btn-success"
                            onClick={saveProject}
                          >
                            Save
                          </button>
                          <button
                            className="btn btn-secondary"
                            onClick={cancelEdit}
                          >
                            Cancel
                          </button>
                        </div>
                      </>
                    ) : (
                      // --- View Mode ---
                      <>
                        <h5 className="card-title">
                          {project.name || "New Project"}
                        </h5>
                        <p className="card-text">
                          Location: {project.location || "N/A"} <br />
                          Budget: ${project.budget || 0} <br />
                          Status:{" "}
                          <span
                            className={`badge bg-${getStatusColor(project.status)} me-2`}
                          >
                            {project.status || "N/A"}
                          </span>
                          <br />
                          Created:{" "}
                          <span className="text-dark">
                            {formatDate(project.statusDate)}
                          </span>
                        </p>
                        <hr />

                        {/* --- Actions Button Group with Bootstrap Tooltips --- */}
                        <div className="btn-group d-flex flex-wrap gap-2">
                          {/* View Project */}
                          <button
                            className="btn btn-primary"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="View Project" // Tooltip text
                            onClick={() => navigate(`/project/${project.id}`)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>

                          {/* Edit Project */}
                          <button
                            className="btn btn-secondary"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Edit Project"
                            onClick={() => setEditingProject(project)}
                            disabled={project.status === "completed"}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>

                          {/* Mark as Complete */}
                          {project.status === "in-progress" && (
                            <button
                              className="btn btn-success"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Mark as Complete"
                              onClick={() => markAsComplete(project)}
                            >
                              <i className="bi bi-check-circle"></i>
                            </button>
                          )}

                          {/* Cancel Project */}
                          {project.status !== "completed" && (
                            <button
                              className="btn btn-danger"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Cancel Project"
                              onClick={() => {
                                if (
                                  validateStatusChange(project, "cancelled")
                                ) {
                                  cancelProject(project);
                                }
                              }}
                            >
                              <i className="bi bi-x-circle"></i>
                            </button>
                          )}

                          {/* Delete Project */}
                          <button
                            className="btn btn-danger"
                            data-bs-toggle="tooltip"
                            data-bs-placement="top"
                            title="Delete Project"
                            onClick={() => deleteProject(project.id)}
                            disabled={project.status === "completed"}
                          >
                            <i className="bi bi-trash"></i>
                          </button>

                          {/* Reopen Project */}
                          {project.status === "cancelled" && (
                            <button
                              className="btn btn-warning"
                              data-bs-toggle="tooltip"
                              data-bs-placement="top"
                              title="Reopen Project"
                              onClick={() =>
                                setEditingProject({
                                  ...project,
                                  status: "in-progress",
                                })
                              }
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <AddProjectModal
        show={showModal}
        handleClose={handleModalClose}
        saveProject={addNewProject}
      />
    </div>
  );
}

export default ProjectList;
