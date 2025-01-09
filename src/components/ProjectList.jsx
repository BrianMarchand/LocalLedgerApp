import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // <-- NEW
import { useNavigate } from "react-router-dom";
import { startTransition } from "react";
import { useTheme } from "../context/ThemeContext"; // Import Theme Hook
import { useProjects } from "../context/ProjectsContext"; // Import Projects Context
import { calculateProgress } from "../utils/progressUtils";
import { db } from "../firebaseConfig";
import Navbar from "../components/Navbar"; // Import the Navbar component
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "../ProjectList.css";
import AddProjectModal from "../components/AddProject/AddProjectModal";
import { Spinner } from "react-bootstrap";
import { toastSuccess, toastError } from "../utils/toastNotifications"; // Import toast utilities
import Swal from "sweetalert2"; // Import SweetAlert
import "sweetalert2/dist/sweetalert2.min.css"; // Import SweetAlert Default Styles
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { getBadgeClass, getBadgeLabel } from "../utils/badgeUtils";

import {
  collection,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  writeBatch,
  query,
  orderBy,
  runTransaction,
  // <--
} from "firebase/firestore";

function ProjectList() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- This MUST stay here at the top!
  const getProgressData = (project) => {
    const transactions = project.transactions || []; // Use project transactions if available
    return calculateProgress(project.budget, transactions); // Calculate using utility
  };

  // --- Load Projects Using Context ---
  const {
    projects, // Managed by context
    setProjects, // Managed by context
    loading, // Managed by context
    fetchProjectsWithTransactions, // Fetch Projects
    addProject, // Add project function
    updateProject, // Update project function
    deleteProject, // Delete project function
    fetchProjects, // Fetch projects
  } = useProjects(); // Use Projects Context

  // --- Loading Animation ---
  const [showLoading, setShowLoading] = useState(true); // Adds delay for animation

  // --- Modal Window: Projects ---
  const [showModal, setShowModal] = useState(false);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  // --- State Management ---
  const [editingProject, setEditingProject] = useState(null); // Track project being edited

  // --- Pause Fetching ---
  const [pauseFetching, setPauseFetching] = useState(false); // Must be at the top

  useEffect(() => {
    if (pauseFetching) return; // Skip fetching while paused

    const fetchProjectsFromDB = async () => {
      try {
        const snapshot = await getDocs(
          query(collection(db, "projects"), orderBy("order", "asc")),
        );
        const projectList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Always sort by 'order' field
        projectList.sort((a, b) => a.order - b.order);
        setProjects(projectList);
      } catch (error) {
        console.error("Error fetching projects:", error);
      }
    };

    fetchProjectsFromDB();

    return () => {}; // Cleanup function
  }, [pauseFetching, setProjects]); // Add all dependencies

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

  const { darkMode, toggleTheme } = useTheme(); // Get theme state and toggle function

  // --- Add New Project ---
  const addNewProject = async (newProject) => {
    try {
      // --- Step 1: Shift Existing Projects Down ---
      const snapshot = await getDocs(
        query(collection(db, "projects"), orderBy("order", "asc")),
      );
      const batch = writeBatch(db); // Initialize batch

      snapshot.docs.forEach((docSnap) => {
        const projRef = doc(db, "projects", docSnap.id);
        const currentOrder = docSnap.data().order || 0;
        batch.update(projRef, { order: currentOrder + 1 }); // Shift down
      });
      await batch.commit(); // Commit order changes first

      // --- Step 2: Add New Project at Top ---
      const newDoc = await addDoc(collection(db, "projects"), {
        ...newProject,
        order: 0, // Add at position 0
        createdAt: new Date(),
      });

      toastSuccess("Project added successfully!");
      fetchProjects(); // Refresh project list
    } catch (error) {
      console.error("Error adding project:", error);
      toastError("Failed to add project.");
    }
  };

  const fixOrderField = async () => {
    const querySnapshot = await getDocs(collection(db, "projects"));
    querySnapshot.forEach(async (docSnap, index) => {
      const project = docSnap.data();
      if (project.order !== index) {
        const projectRef = doc(db, "projects", docSnap.id);
        await updateDoc(projectRef, { order: index }); // Fix order dynamically
      }
    });
    console.log("Order field updated!");
  };

  // --- Reopen Project ---
  const reopenProject = async (project) => {
    startTransition(() => setPauseFetching(true)); // Batch update

    try {
      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, { status: "in-progress" });

      // Optimistic Update: Update local state directly
      setProjects((prevProjects) =>
        prevProjects.map((p) =>
          p.id === project.id ? { ...p, status: "in-progress" } : p,
        ),
      );

      // Fetch latest data to ensure consistency
      await fetchProjectsWithTransactions();
      toastSuccess("Reopened successfully!");
    } catch (error) {
      toastError("Failed to reopen.");
    } finally {
      startTransition(() => setPauseFetching(false)); // Resume updates
    }
  };

  // --- Edit Existing Project (For Inline Editing) ---
  const editProject = async (updatedProject) => {
    try {
      const docRef = doc(db, "projects", updatedProject.id);

      // Preserve existing 'order' field
      const docSnap = await getDoc(docRef);
      const existingOrder = docSnap.data()?.order || 0; // Keep current order

      await updateDoc(docRef, {
        ...updatedProject,
        order: existingOrder, // Maintain position
      });

      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      );

      toastSuccess("Project updated successfully!");
    } catch (error) {
      console.error("Error updating project:", error);
      toastError("Failed to update project.");
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
    // Step 1: Confirm the cancel action using SweetAlert2
    const result = await Swal.fire({
      title: "Cancel Project?",
      text: `Are you sure you want to cancel "${project.name}"? This cannot be undone.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33", // Red for destructive actions
      cancelButtonColor: "#3085d6", // Default blue
      confirmButtonText: "Yes, cancel it!",
      cancelButtonText: "No, keep it",
    });

    // Step 2: Check if the user confirmed the action
    if (result.isConfirmed) {
      try {
        // Step 3: Update Firestore to set status as 'cancelled'
        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "cancelled",
          statusDate: new Date(),
          statusNote: "Project cancelled by user.", // Optional note
        });

        // Step 4: Refresh the projects list after update
        fetchProjects();

        // Step 5: Show success feedback with SweetAlert2
        await Swal.fire({
          title: "Cancelled!",
          text: `Project "${project.name}" has been cancelled successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });
      } catch (error) {
        console.error("Error cancelling project:", error);

        // Step 6: Show error feedback with SweetAlert2
        await Swal.fire({
          title: "Error!",
          text: `Failed to cancel "${project.name}". Please try again.`,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } else {
      // Step 7: Show cancellation feedback if user backs out
      await Swal.fire({
        title: "Cancelled",
        text: "No changes were made to the project.",
        icon: "info",
        confirmButtonText: "OK",
      });
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
  const handleDeleteProject = async (id) => {
    try {
      await deleteProject(id); // Delete project
      await checkOrderFields(); // Debug order fields
      await fixOrderFields(); // Fix order fields if missing
      // Immediately remove the deleted project from local state
      setProjects((prevProjects) =>
        prevProjects.filter((project) => project.id !== id),
      );

      toastSuccess("Project deleted successfully!");
    } catch (error) {
      console.error("Error deleting project:", error);
      toastError("Failed to delete project.");
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
  if (loading) {
    return (
      <div className="text-center py-5">
        <Spinner animation="border" variant="primary" />
        <p>Loading Your Projects...</p>
      </div>
    );
  }
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
        await deleteProject(project.id); // Firestore delete
        await fetchProjects(); // Refresh after deletion

        // SweetAlert for success feedback
        await Swal.fire({
          title: "Deleted!",
          text: `Project "${project.name}" has been deleted successfully.`,
          icon: "success",
          confirmButtonText: "OK",
        });

        // Toast notification for subtle confirmation (step 6)
        toastSuccess(`Project "${project.name}" has been deleted.`);
      } catch (error) {
        console.error("Error deleting project:", error);

        // SweetAlert for error feedback
        await Swal.fire({
          title: "Error!",
          text: `Failed to delete "${project.name}". Please try again.`,
          icon: "error",
          confirmButtonText: "OK",
        });
      }
    } else {
      toastError("Delete action cancelled!"); // Toast for cancelled action
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
        const isValid = await validateStatusChange(project, "completed");
        if (!isValid) {
          toastError(`Cannot mark "${project.name}" as complete.`);
          return; // Block further execution
        }

        const docRef = doc(db, "projects", project.id);
        await updateDoc(docRef, {
          status: "completed",
          statusDate: new Date(),
        });

        await fetchProjects(); // Refresh list
        toastSuccess(`Project "${project.name}" marked as complete!`);
      } catch (error) {
        console.error("Error marking project as complete:", error);
        toastError(`Failed to complete "${project.name}".`);
      }
    } else {
      toastError("Action cancelled!");
    }
  };

  // --- Confirm Re-Open Project ---
  const handleReopen = async (project) => {
    setPauseFetching(true); // Ensure this is outside async calls

    try {
      const transactionsSnapshot = await getDocs(
        collection(db, `projects/${project.id}/transactions`),
      );
      const transactions = transactionsSnapshot.docs.map((doc) => doc.data());

      const hasDeposit = transactions.some(
        (t) =>
          t.category === "Client Payment" &&
          t.name.toLowerCase().includes("deposit"),
      );

      const updatedStatus = hasDeposit ? "in-progress" : "new";

      const docRef = doc(db, "projects", project.id);
      await updateDoc(docRef, {
        status: updatedStatus,
        statusDate: new Date(),
      });

      setProjects(reorderedProjects); // Force update local state first
      setTimeout(() => fetchProjects(), 500); // Refresh list after sync
      toastSuccess(`Project "${project.name}" reopened successfully.`);
    } catch (error) {
      console.error("Error reopening project:", error);
      toastError("Failed to reopen project.");
    } finally {
      setPauseFetching(false); // Always resume fetching
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

    if (!destination || destination.index === source.index) return;

    const reorderedProjects = Array.from(projects);
    const [movedProject] = reorderedProjects.splice(source.index, 1);
    reorderedProjects.splice(destination.index, 0, movedProject);

    setProjects(reorderedProjects); // Update UI immediately

    try {
      const batch = writeBatch(db);
      reorderedProjects.forEach((proj, index) => {
        const projRef = doc(db, "projects", proj.id);
        batch.update(projRef, { order: index });
      });

      await batch.commit();
      toastSuccess("Project order updated!"); // Success toast only here
    } catch (error) {
      console.error("Error saving order:", error);
      toastError("Failed to update order.");
    }
  };

  // --- Confirm Reopen ---
  const confirmReopen = async (project) => {
    console.log("Attempting to reopen project:", project.name);

    setPauseFetching(true); // Pause fetching to prevent listener conflicts

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

    if (!result.isConfirmed) {
      console.log("Reopen action cancelled.");
      toastError("Action cancelled!");
      setPauseFetching(false); // Resume fetching
      return; // Exit function
    }

    try {
      // --- Firestore Transaction ---
      await runTransaction(db, async (transaction) => {
        // <-- Fix Here
        const docRef = doc(db, "projects", project.id);

        // Fetch latest project snapshot inside transaction
        const docSnapshot = await transaction.get(docRef);
        const projectData = docSnapshot.data();

        // --- Fetch Transactions ---
        const transactionsSnapshot = await getDocs(
          collection(db, `projects/${project.id}/transactions`),
        );
        const transactions = transactionsSnapshot.docs.map((doc) => doc.data());

        // --- Validate Deposit ---
        const hasDeposit = transactions.some(
          (t) =>
            t.category === "Client Payment" &&
            t.name.toLowerCase().includes("deposit"),
        );

        // --- Determine New Status ---
        const updatedStatus = hasDeposit ? "in-progress" : "new";
        const updatedNote = hasDeposit
          ? "Reopened for further work."
          : "Reopened without deposit transaction.";

        // --- Apply Update in Transaction ---
        transaction.update(docRef, {
          status: updatedStatus,
          statusDate: new Date(),
          statusNote: updatedNote,
        });

        console.log("Firestore transaction committed.");
      });

      // --- Pause Warning if No Deposit ---
      const transactionsSnapshot = await getDocs(
        collection(db, `projects/${project.id}/transactions`),
      );
      const transactions = transactionsSnapshot.docs.map((doc) => doc.data());

      const hasDeposit = transactions.some(
        (t) =>
          t.category === "Client Payment" &&
          t.name.toLowerCase().includes("deposit"),
      );

      if (!hasDeposit) {
        await Swal.fire({
          title: "Important!",
          text: "This project does not have a 'deposit' transaction yet. It will remain in 'new' status until a deposit is added.",
          icon: "warning",
          confirmButtonText: "Understood",
        });
      }

      // Show Success Toast
      toastSuccess(`Project "${project.name}" reopened successfully!`);
    } catch (error) {
      console.error("Error reopening project:", error);
      toastError(`Failed to reopen "${project.name}". Please try again.`);
    } finally {
      setPauseFetching(false); // Resume fetching after operation
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
                  {combinedProjects.map((project, index) => {
                    // --- Calculate Progress for Each Project ---
                    const progressData = calculateProgress(
                      project.budget || 0,
                      project.transactions || [], // Fallback for empty transactions
                    );

                    // --- Return JSX for Each Project ---
                    return (
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
                              className={` shadow-sm clickable-card ${
                                project.status === "cancelled" ? "disabled" : ""
                              }`}
                            >
                              {/* --- HEADER --- */}
                              <div className="card-header d-flex justify-content-between align-items-center">
                                <span>{project.name || "Unnamed Project"}</span>
                                <div className={getBadgeClass(project.status)}>
                                  {getBadgeLabel(project.status)}
                                </div>
                              </div>
                              {/* --- BODY --- */}
                              <div className="card-body">
                                {/* Location */}
                                <p className="mb-3">
                                  <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                                  <strong>Location:</strong>{" "}
                                  {project.location || "N/A"}
                                </p>
                                {/* Budget */}
                                <p className="mb-3">
                                  <i className="bi bi-bank text-success me-2"></i>
                                  <strong>Budget:</strong> $
                                  {Number(project.budget)?.toLocaleString() ||
                                    "0"}
                                  {Number(project.budget) > 99999 && " 🎉"}{" "}
                                  {/* Emoji for budgets > $100,000 */}
                                </p>
                                {/* Created Date */}
                                <p className="mb-3">
                                  <i className="bi bi-calendar-check text-secondary me-2"></i>
                                  <strong>Created:</strong>{" "}
                                  {formatDate(project.createdAt)}
                                </p>
                                {/* Status Note */}
                                <p className="mb-3">
                                  <i className="bi bi-card-text text-secondary me-2"></i>
                                  <strong>Status Note:</strong>{" "}
                                  {project.statusNote || "No notes."}
                                </p>
                                {/* Progress Bar */}
                                <i className="bi bi-graph-up-arrow text text-secondary me-2 mb-3"></i>
                                <strong>Progress:</strong>
                                <div
                                  className="progress"
                                  style={{ height: "10px" }}
                                >
                                  <div
                                    className={`progress-bar ${
                                      progressData.status === "completed"
                                        ? "bg-success"
                                        : progressData.status === "over-budget"
                                          ? "bg-danger"
                                          : "bg-primary"
                                    }`}
                                    role="progressbar"
                                    style={{
                                      width: `${progressData.percentage}%`,
                                    }}
                                    aria-valuenow={progressData.percentage}
                                    aria-valuemin="0"
                                    aria-valuemax="100"
                                  >
                                    {`${progressData.percentage}%`}
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
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmReopen(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Context Immediately
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
                                      className="btn btn-warning"
                                      title="Reopen Project"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmReopen(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Context Immediately
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
                                        handleModalOpen();
                                      }}
                                      disabled={project.status === "completed"} // Disable edit for completed
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>

                                    <button
                                      className="btn btn-warning"
                                      title="Put on Hold"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmPutOnHold(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Context Immediately
                                      }}
                                    >
                                      <i className="bi bi-pause-circle"></i>
                                    </button>

                                    <button
                                      className="btn btn-success"
                                      title="Mark as Complete"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmComplete(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Context Immediately
                                      }}
                                      disabled={!project.meetsBudget} // Disable if budget not met
                                    >
                                      <i className="bi bi-check-circle"></i>
                                    </button>

                                    <button
                                      className="btn btn-danger"
                                      title="Cancel Project"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmCancel(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Context Immediately
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
                                        handleModalOpen();
                                      }}
                                    >
                                      <i className="bi bi-pencil-square"></i>
                                    </button>

                                    <button
                                      className="btn btn-danger"
                                      title="Cancel Project"
                                      onClick={async (e) => {
                                        e.stopPropagation();
                                        await confirmCancel(project); // Firestore update
                                        await fetchProjectsWithTransactions(); // <-- Refresh Immediately
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
                                  disabled={
                                    project.status === "completed" ||
                                    project.status === "cancelled"
                                  } // Disable delete for invalid cases
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    );
                  })}
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
