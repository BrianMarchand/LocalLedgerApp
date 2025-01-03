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
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc, // <-- Keep the existing import
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch, // <--
} from "firebase/firestore";

function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- This MUST stay here at the top!
  const calculateProgress = (project) => {
    const totalBudget = project.budget || 0; // Fallback if budget is undefined
    const totalExpenses = project.totalExpenses || 0; // Add expenses to project data
    const progress = totalBudget > 0 ? (totalExpenses / totalBudget) * 100 : 0;

    return Math.min(Math.round(progress), 100); // Cap at 100%
  };

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

  // --- Save Project (Dynamic State Update) ---
  const addProjectToList = (newProject) => {
    setProjects((prevProjects) => {
      const exists = prevProjects.some((p) => p.id === newProject.id);
      if (exists) return prevProjects;

      return [...prevProjects, newProject]; // Add to state dynamically
    });

    // Reset parent loading spinner
    setLoading(false); // Spinner disappears
    setShowLoading(false); // Ensure animation stops
  };

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

  // --- Project Fetching Logic For Modal ---
  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "projects"), orderBy("order", "asc")), // Default sort by "order"
      async (snapshot) => {
        try {
          const projectList = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const project = { id: doc.id, ...doc.data() };

              // Fetch transactions for each project
              const transactionsSnapshot = await getDocs(
                collection(db, `projects/${project.id}/transactions`),
              );
              const transactions = transactionsSnapshot.docs.map((doc) =>
                doc.data(),
              );

              const totalExpenses = transactions
                .filter((t) => t.category !== "Client Payment")
                .reduce((sum, t) => sum + Number(t.amount), 0);

              return { ...project, totalExpenses };
            }),
          );

          // Combine Firestore projects with temporary ones
          setProjects(projectList);
        } catch (error) {
          console.error("Error fetching projects:", error);
          toastError("Failed to load projects.");
        } finally {
          setLoading(false);
          setShowLoading(false);
        }
      },
    );

    return () => unsubscribe();
  }, []);

  const { darkMode, toggleTheme } = useTheme(); // Get theme state and toggle function

  // --- Add New Project ---
  const addNewProject = async (newProject) => {
    try {
      // Determine the order based on the length of current projects
      const order = projects.length; // Sets the order as the last position

      // Add 'order' to the new project
      const projectWithOrder = {
        ...newProject,
        order, // Include order field
      };

      // Add the project to Firestore
      const docRef = await addDoc(collection(db, "projects"), projectWithOrder);

      // Update the local state with the new project
      setProjects((prev) => [
        ...prev,
        { id: docRef.id, ...projectWithOrder }, // Preserve Firestore ID
      ]);

      // Reset editing and temporary project states
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

  const fixOrderField = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach(async (docSnap, index) => {
      const project = docSnap.data();
      if (!project.order) {
        // Only fix missing order
        const projectRef = doc(db, "projects", docSnap.id);
        await updateDoc(projectRef, { order: index }); // Add incremental order
      }
    });
    console.log("Order field updated!");
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
        await markAsComplete(project); // Existing function
        toastSuccess(`Project "${project.name}" marked as complete!`);
      } else {
        toastError("Action cancelled!");
      }
    };

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
        await cancelProject(project); // Call existing function
        toastSuccess(`Project "${project.name}" has been cancelled.`);
      } else {
        toastError("Action cancelled!");
      }
    };

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
          await Swal.fire({
            title: "Cannot Complete Project",
            text: `Remaining client payment must be $0. Current balance: $${remainingClientPayment.toLocaleString()}`,
            icon: "error",
            confirmButtonText: "OK",
          });
          return false;
        }

        // 2. Check for a deposit transaction (category = "Client Payment")
        const hasDeposit = transactions.some(
          (t) =>
            t.category === "Client Payment" &&
            t.name.toLowerCase().includes("deposit"),
        );

        if (!hasDeposit) {
          await Swal.fire({
            title: "Cannot Complete Project",
            text: "At least one 'deposit' transaction is required.",
            icon: "error",
            confirmButtonText: "OK",
          });
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
  const [deleting, setDeleting] = useState(false);

  const deleteProject = async (id) => {
    if (deleting) return; // Prevent duplicate calls
    setDeleting(true); // Start deletion

    try {
      const docRef = doc(db, "projects", id);
      await deleteDoc(docRef);

      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== id),
      );
    } catch (error) {
      console.error("Error deleting project:", error);
      toastError("Failed to delete project. Please try again.");
    } finally {
      setDeleting(false); // Reset state after attempt
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
      try {
        await deleteProject(project.id); // Ensure this awaits completion

        toastSuccess(`Project "${project.name}" has been deleted.`);
      } catch (error) {
        console.error("Error deleting project:", error);
        toastError(`Failed to delete "${project.name}". Please try again.`);
      }
    } else {
      toastError("Action cancelled!"); // Feedback for cancelled operation
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
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "cancelled",
          statusDate: new Date(),
        });

        toastSuccess(`Project "${project.name}" has been cancelled.`);
      } catch (error) {
        console.error("Error cancelling project:", error);
        toastError(`Failed to cancel "${project.name}". Please try again.`);
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
        // Step 1: VALIDATE BEFORE ACTION
        const isValid = await validateStatusChange(project, "completed");
        if (!isValid) {
          // Validation failed—return early.
          toastError(`Cannot mark "${project.name}" as complete.`);
          return;
        }

        // Step 2: UPDATE FIRESTORE STATUS
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "completed",
          statusDate: new Date(),
        });

        // Step 3: SUCCESS MESSAGE
        toastSuccess(`Project "${project.name}" marked as complete!`);
      } catch (error) {
        console.error("Error marking project as complete:", error);

        // Step 4: ERROR MESSAGE (Only on actual failure)
        toastError(`Failed to mark "${project.name}" as complete.`);
      }
    } else {
      // Cancelled action
      toastError("Action cancelled!");
    }
  };

  // --- Confirm Re-Open Project ---
  const confirmReopen = async (project) => {
    console.log("Attempting to reopen project:", project.name); // Debugging log

    const result = await Swal.fire({
      title: "Reopen Project?",
      text: `Are you sure you want to reopen "${project.name}"?`,
      icon: "info",
      showCancelButton: true,
      confirmButtonColor: "#ffc107",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, reopen it!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // --- Optimistic UI Update ---
        console.log("Updating UI before Firestore..."); // Debugging
        const updatedProjects = projects.map((p) =>
          p.id === project.id
            ? { ...p, status: "in-progress", statusDate: new Date() }
            : p,
        );
        setProjects(updatedProjects); // Optimistic update for UI
        console.log("UI updated successfully."); // Debugging

        // --- Firestore Update ---
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "in-progress",
          statusDate: new Date(),
          statusNote: "Reopened for further work.",
        });
        console.log("Firestore updated successfully."); // Debugging

        // --- Success Toast ---
        toastSuccess(`Project "${project.name}" has been reopened!`);
      } catch (error) {
        console.error("Error during Firestore update:", error); // Debugging

        // --- Error Toast (only for true Firestore failures) ---
        toastError(`Failed to reopen "${project.name}". Please try again.`);
      }

      try {
        // --- Fetch Updated Projects in Background (No Errors Affect UI) ---
        console.log("Refreshing projects list..."); // Debugging
        await fetchProjects(); // Refresh data silently
        console.log("Projects refreshed successfully."); // Debugging
      } catch (fetchError) {
        console.warn(
          "Fetch projects failed, but Firestore update was successful.",
          fetchError,
        ); // Debugging
        // Avoid showing errors here – it doesn't block functionality
      }
    } else {
      console.log("Reopen action cancelled."); // Debugging
      toastError("Action cancelled!");
    }
  };

  // --- Confirm Put on Hold ---
  const confirmPutOnHold = async (project) => {
    const result = await Swal.fire({
      title: "Put Project on Hold?",
      text: `Are you sure you want to put "${project.name}" on hold?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#ffc107",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, put on hold!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "on-hold",
          statusDate: new Date(),
          statusNote: "Project paused by user.",
        });
        toastSuccess(`Project "${project.name}" is now on hold.`);
      } catch (error) {
        console.error("Error putting project on hold:", error);
        toastError(
          `Failed to put "${project.name}" on hold. Please try again.`,
        );
      }
    } else {
      toastError("Action cancelled!");
    }
  };

  // --- Drag & Drop Cards ---
  const handleDragEnd = async (result) => {
    const { source, destination } = result;

    // Debug Logs
    console.log("Drag Start Index:", source.index);
    console.log("Drop Destination Index:", destination?.index);
    console.log("Projects Before Move:", projects);

    // Cancel if dropped outside or at the same position
    if (!destination || destination.index === source.index) {
      console.log("Drop cancelled or same position.");
      return;
    }

    // Reorder the projects locally for immediate feedback
    const reorderedProjects = Array.from(projects);
    const [movedProject] = reorderedProjects.splice(source.index, 1);
    reorderedProjects.splice(destination.index, 0, movedProject);

    console.log("Projects After Move:", reorderedProjects);

    // Update local state (optimistic UI update)
    setProjects(reorderedProjects);

    try {
      // Update Firestore order
      const batch = writeBatch(db);

      reorderedProjects.forEach((proj, index) => {
        const projRef = doc(db, "projects", proj.id);
        batch.update(projRef, { order: index }); // Update order field
      });

      await batch.commit(); // Save to Firestore
      toastSuccess("Project order updated!");

      console.log("Firestore update successful!");
    } catch (error) {
      console.error("Batch Write Error:", error.message);
      toastError(`Failed to save project order: ${error.message}`);
    }
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
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="projects">
              {(provided) => (
                <div
                  className="row"
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                >
                  {combinedProjects.map((project, index) => (
                    <Draggable
                      key={project.id}
                      draggableId={project.id}
                      index={index}
                    >
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="col-md-4 mb-4"
                        >
                          {/* SINGLE CARD */}
                          <div
                            className={`card shadow-sm clickable-card ${
                              project.status === "cancelled" ? "disabled" : ""
                            }`}
                          >
                            {/* --- HEADER --- */}
                            <div className="card-header d-flex justify-content-between align-items-center">
                              <span>{project.name || "Unnamed Project"}</span>
                              <span
                                className={`badge bg-${getStatusColor(
                                  project.status,
                                )}`}
                              >
                                {project.status || "N/A"}
                              </span>
                            </div>

                            {/* --- BODY --- */}
                            <div className="card-body">
                              {/* Location */}
                              <p className="mb-2">
                                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                <strong>Location:</strong>{" "}
                                {project.location || "N/A"}
                              </p>

                              {/* Budget */}
                              <p className="mb-2">
                                <i className="bi bi-currency-dollar text-success me-2"></i>
                                <strong>Budget:</strong> $
                                {project.budget?.toLocaleString() || "0"}
                              </p>

                              {/* Created Date */}
                              <p className="mb-2">
                                <i className="bi bi-calendar-check text-secondary me-2"></i>
                                <strong>Created:</strong>{" "}
                                {formatDate(project.createdAt)}
                              </p>

                              {/* Progress Bar */}
                              <div className="custom-progress-bar mb-3">
                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <small className="text-muted">
                                    <i className="bi bi-graph-up-arrow me-1"></i>{" "}
                                    Progress:
                                  </small>
                                  <small className="text-muted">
                                    {calculateProgress(project)}%{" "}
                                    {/* Display percentage */}
                                  </small>
                                </div>

                                <div
                                  className="progress"
                                  style={{ height: "8px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      calculateProgress(project) >= 100
                                        ? "bg-success" // Green when complete
                                        : calculateProgress(project) > 80
                                          ? "bg-warning" // Yellow near budget
                                          : "bg-primary" // Blue otherwise
                                    }`}
                                    role="progressbar"
                                    style={{
                                      width: `${calculateProgress(project)}%`,
                                    }}
                                    aria-valuenow={calculateProgress(project)}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                              </div>
                            </div>

                            {/* --- FOOTER (BUTTON GROUP) --- */}
                            <div className="card-footer d-flex flex-wrap gap-2">
                              {/* Cancelled Projects */}
                              {project.status === "cancelled" && (
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

                                      console.log("Editing Project: ", project); // Log project details
                                      setEditingProject(project); // Set editing project
                                      console.log(
                                        "Editing state set:",
                                        project,
                                      ); // Confirm state

                                      setShowModal(true); // Open modal
                                      console.log(
                                        "Modal should be open now: ",
                                        true,
                                      ); // Confirm toggle
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
                                      handleModalOpen();
                                    }}
                                  >
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    className="btn btn-warning"
                                    title="Put on Hold"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      confirmPutOnHold(project); // <-- NEW FUNCTION TO HANDLE THIS ACTION
                                    }}
                                  >
                                    <i className="bi bi-pause-circle"></i>
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
                                      setEditingProject(project); // Sets the editing state
                                      handleModalOpen(); // FIX: Opens the modal immediately
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
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
        {/* Add Project Modal */}
        <AddProjectModal
          show={showModal}
          handleClose={handleModalClose}
          saveProject={addProjectToList} // Fix: Pass local update function
          editingProject={editingProject}
        />
      </div>
    </div>
  );
}

export default ProjectList;
