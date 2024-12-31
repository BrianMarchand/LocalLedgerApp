import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // <-- NEW
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext"; // Import Theme Hook
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import * as bootstrap from "bootstrap"; // Explicitly import Bootstrap JS
import "../ProjectList.css";
import AddProjectModal from "../components/AddProjectModal";
import { ProgressBar } from "react-loader-spinner";
import { toastSuccess, toastError } from "../utils/toastNotifications"; // Import toast utilities
import Swal from "sweetalert2"; // Import SweetAlert
import "sweetalert2/dist/sweetalert2.min.css"; // Import SweetAlert Default Styles
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
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

  // --- Loading Animation ---
  const [loading, setLoading] = useState(true); // Tracks loading state
  const [showLoading, setShowLoading] = useState(true); // Adds delay for animation

  // --- Modal Window: Projects ---
  const [showModal, setShowModal] = useState(false);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  // --- State Management ---
  const [projects, setProjects] = useState([]); // Store projects from Firestore
  const [editingProject, setEditingProject] = useState(null); // Track project being edited

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
    setLoading(true); // Start loading
    try {
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projectList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(projectList); // Update project state
    } catch (error) {
      console.error("Error fetching projects:", error);
    } finally {
      setLoading(false); // Stop loading after fetch

      // Force spinner visibility for at least 1.5 seconds
      setTimeout(() => {
        setShowLoading(false); // Stop delay
      }, 1500);
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

  // --- Add New Project ---
  const addNewProject = async (newProject) => {
    try {
      const docRef = await addDoc(collection(db, "projects"), newProject);
      setProjects((prev) => [...prev, { id: docRef.id, ...newProject }]);
      setEditingProject(null);
      setTempProjects([]);
      handleModalClose();

      // Toast Notification (Success)
      toastSuccess("Project added successfully!");
    } catch (error) {
      console.error("Error adding project: ", error);

      // Toast Notification (Error)
      toastError("Failed to add project. Please try again.");
    }
  };

  // --- Edit Existing Project (For Inline Editing) ---
  const editProject = async (updatedProject) => {
    try {
      const docRef = doc(db, "projects", updatedProject.id);
      await updateDoc(docRef, updatedProject);

      setProjects((prev) =>
        prev.map((proj) =>
          proj.id === updatedProject.id ? updatedProject : proj,
        ),
      );
      setEditingProject(null);

      // Toast Notification (Success)
      toastSuccess("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project: ", error);

      // Toast Notification (Error)
      toastError("Failed to update project. Please try again.");
    }
  };

  // --- Start New Project ---
  const startNewProject = () => {
    const tempProject = {
      id: `temp-${Date.now()}`, // Keep this for immediate UI rendering
      name: "",
      location: "",
      budget: "",
      status: "new",
      statusDate: new Date(),
      statusNote: "",
      isTemp: true,
    };

    setEditingProject(tempProject); // Only keep this for the modal form
    handleModalOpen(); // Open modal
  };

  // --- Mark as Complete ---
  const markAsComplete = async (project) => {
    const isValid = await validateStatusChange(project, "completed");
    if (!isValid) return;

    const confirmed = window.confirm(
      "Are you sure you want to mark this project as Complete?",
    );
    if (!confirmed) return;

    try {
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: "completed",
        statusDate: new Date(),
      });

      fetchProjects();

      // Toast Notification (Success)
      toastSuccess(`Project "${project.name}" marked as complete!`);
    } catch (error) {
      console.error("Error marking project as complete:", error);

      // Toast Notification (Error)
      toastError(`Failed to mark "${project.name}" as complete.`);
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

      fetchProjects();

      // Toast Notification (Success)
      toastSuccess(`Project "${project.name}" has been cancelled.`);
    } catch (error) {
      console.error("Error cancelling project:", error);

      // Toast Notification (Error)
      toastError(`Failed to cancel "${project.name}". Please try again.`);
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

  // --- Delete Project with Confirmation ---
  const deleteProject = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project? This action cannot be undone.",
    );
    if (!confirmed) return;

    try {
      const docRef = doc(db, "projects", id);
      await deleteDoc(docRef);
      fetchProjects();

      // Toast Notification (Success)
      toastSuccess("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);

      // Toast Notification (Error)
      toastError("Failed to delete project. Please try again.");
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

    // Check if the timestamp is a Firestore Timestamp and convert it
    const date =
      timestamp.toDate?.() ?? // Firestore Timestamp
      new Date(timestamp); // Fallback for JS Date or string

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const combinedProjects = projects; // Use only saved projects

  // --- Check Loading State ---
  if (loading || showLoading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          flexDirection: "column",
        }}
      >
        <ProgressBar
          height="80"
          width="200"
          ariaLabel="progress-bar-loading"
          borderColor="#4A90E2"
          barColor="#4A90E2"
        />
        <p style={{ marginTop: "10px" }}>Loading Your Projects...</p>
      </div>
    );
  }
  // --- Custom SweetAlert Confirmation Messages ---
  // --- Confirm Delete Project ---
  const confirmDelete = async (project) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `This will permanently delete the project "${project.name}".`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      deleteProject(project.id); // Call your delete function
    } else {
      toastError("Action cancelled!"); // Optional feedback
    }
  };

  // --- Confirm Cancel Project ---
  const confirmCancel = async (project) => {
    const result = await Swal.fire({
      title: "Cancel Project?",
      text: `Are you sure you want to cancel "${project.name}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep it",
    });

    if (result.isConfirmed) {
      try {
        await cancelProject(project); // Call existing cancel function
        toastSuccess(`Project "${project.name}" has been cancelled.`);
      } catch (error) {
        toastError(`Failed to cancel "${project.name}".`);
      }
    } else {
      toastError("Action cancelled!");
    }
  };

  // --- Confirm Mark Project As Complete ---
  const confirmComplete = async (project) => {
    const result = await Swal.fire({
      title: "Mark as Complete?",
      text: `Mark "${project.name}" as complete? This action cannot be undone.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#28a745",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, complete it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        await markAsComplete(project); // Call existing complete function
        toastSuccess(`Project "${project.name}" marked as complete!`);
      } catch (error) {
        toastError(`Failed to complete "${project.name}".`);
      }
    } else {
      toastError("Action cancelled!");
    }
  };

  // --- Confirm Re-Open Project ---
  const confirmReopen = async (project) => {
    const result = await Swal.fire({
      title: "Reopen Project?",
      text: `Are you sure you want to reopen "${project.name}"? This will reset its status.`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#ffc107",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reopen it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setEditingProject({
          ...project,
          status: "in-progress",
          statusDate: new Date(),
          statusNote: "Reopened for further work",
        });
        toastSuccess(`Project "${project.name}" has been reopened.`);
      } catch (error) {
        toastError(`Failed to reopen "${project.name}".`);
      }
    } else {
      toastError("Action cancelled!");
    }
  };

  // --- Drag & Drop Cards ---
  const handleDragEnd = (result) => {
    const { destination, source } = result;

    // If there is no destination (the item is dropped outside)
    if (!destination) return;

    // If the item is dropped in the same position
    if (destination.index === source.index) return;

    // Reorder the projects array
    const reorderedProjects = Array.from(combinedProjects);
    const [removed] = reorderedProjects.splice(source.index, 1);
    reorderedProjects.splice(destination.index, 0, removed);

    // Update the state with the new order
    setCombinedProjects(reorderedProjects);
  };

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
                {/* SINGLE CARD - NO NESTED STRUCTURE */}
                <div
                  className={`card shadow-sm clickable-card ${
                    project.status === "cancelled" ? "disabled" : ""
                  }`}
                  onClick={() => {
                    if (project.status !== "cancelled") {
                      navigate(`/project/${project.id}`);
                    }
                  }}
                >
                  {/* --- HEADER --- */}
                  <div className="card-header d-flex justify-content-between align-items-center">
                    <span>{project.name || "Unnamed Project"}</span>
                    <span
                      className={`badge bg-${getStatusColor(project.status)}`}
                    >
                      {project.status || "N/A"}
                    </span>
                  </div>

                  {/* --- BODY --- */}
                  <div className="card-body">
                    <p>
                      <i className="bi bi-geo-alt"></i>{" "}
                      {project.location || "Location: N/A"}
                    </p>
                    <p>
                      <i className="bi bi-currency-dollar"></i> Budget: $
                      {project.budget || 0}
                    </p>
                    <p>
                      <i className="bi bi-calendar"></i> Created:{" "}
                      {formatDate(project.createdAt)}
                    </p>
                  </div>

                  {/* --- FOOTER (BUTTON GROUP) --- */}
                  <div className="card-footer d-flex flex-wrap gap-2">
                    {/* Cancelled Projects */}
                    {project.status === "cancelled" && (
                      <button
                        className="btn btn-warning"
                        title="Reopen Project"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent card click
                          confirmReopen(project);
                        }}
                      >
                        <i className="bi bi-arrow-repeat"></i>
                      </button>
                    )}

                    {/* Completed Projects */}
                    {project.status === "completed" && (
                      <>
                        <button
                          className="btn btn-primary"
                          title="View Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}`);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-warning"
                          title="Reopen Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmReopen(project);
                          }}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </>
                    )}

                    {/* On-Hold Projects */}
                    {project.status === "on-hold" && (
                      <>
                        <button
                          className="btn btn-primary"
                          title="View Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}`);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-secondary"
                          title="Edit Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-warning"
                          title="Reopen Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmReopen(project);
                          }}
                        >
                          <i className="bi bi-arrow-repeat"></i>
                        </button>
                      </>
                    )}

                    {/* In-Progress Projects */}
                    {project.status === "in-progress" && (
                      <>
                        <button
                          className="btn btn-primary"
                          title="View Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}`);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-secondary"
                          title="Edit Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-success"
                          title="Mark as Complete"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmComplete(project);
                          }}
                        >
                          <i className="bi bi-check-circle"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          title="Cancel Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmCancel(project);
                          }}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </>
                    )}

                    {/* New Projects */}
                    {project.status === "new" && (
                      <>
                        <button
                          className="btn btn-primary"
                          title="View Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/project/${project.id}`);
                          }}
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                        <button
                          className="btn btn-secondary"
                          title="Edit Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingProject(project);
                          }}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-danger"
                          title="Cancel Project"
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmCancel(project);
                          }}
                        >
                          <i className="bi bi-x-circle"></i>
                        </button>
                      </>
                    )}

                    {/* Always Show Delete Button */}
                    <button
                      className="btn btn-danger"
                      title="Delete Project"
                      onClick={(e) => {
                        e.stopPropagation();
                        confirmDelete(project);
                      }}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectList;
