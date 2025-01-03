// --- React Core Imports ---
import React, { useState, useEffect, useContext } from "react";

// --- Firebase Imports ---
import { db } from "../firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";

// --- React Router Imports ---
import { useParams, useNavigate } from "react-router-dom";

// --- UI/Styling Imports ---
import "bootstrap/dist/css/bootstrap.min.css"; // Core Bootstrap styles
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Bootstrap JS components
import "bootstrap-icons/font/bootstrap-icons.css"; // Bootstrap Icons
import * as bootstrap from "bootstrap"; // Explicit Bootstrap JS utilities

// --- Toast Notifications ---
import { ToastContainer, toast, Bounce } from "react-toastify"; // Toast notifications
import "react-toastify/dist/ReactToastify.css";

// --- Loader and Animations ---
import { motion } from "framer-motion"; // Animations
import { ProgressBar } from "react-loader-spinner"; // Progress bar loader

// --- Custom Context and Hooks ---
import { useTheme } from "../context/ThemeContext"; // Theme context

// --- Custom Components ---
import Navbar from "../components/Navbar"; // Reusable navbar component

// --- Debugging Mode ---
const DEBUG_MODE = true; // Enable console logging for debugging

function ProjectDashboard() {
  // --- Hooks for Routing and Theme ---
  const { id } = useParams(); // Get project ID from URL parameters
  const navigate = useNavigate(); // Handle navigation
  const { darkMode, toggleTheme } = useTheme(); // Theme toggle hook

  // --- State Management ---
  const [project, setProject] = useState(null); // Store project data
  const [transactions, setTransactions] = useState([]); // Store project transactions
  const [loading, setLoading] = useState(true); // Track loading state
  const [error, setError] = useState(false); // Handle errors
  const [showLoading, setShowLoading] = useState(true); // Spinner visibility
  const [errors, setErrors] = useState({}); // Validation errors for forms
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split("T")[0], // Default date as today
    name: "",
    amount: "",
    category: "",
    type: "",
  });

  // --- Fetch Project from Firestore ---
  const fetchProject = async () => {
    setLoading(true); // Start loading
    setError(false); // Reset errors

    try {
      const docRef = doc(db, "projects", id); // Reference Firestore
      const docSnap = await getDoc(docRef); // Fetch data

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Firestore Data:", data);
        setProject({ id: docSnap.id, ...data }); // Set project data
      } else {
        console.log("Document does NOT exist!");
        setError(true); // Trigger error
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError(true); // Handle error
    } finally {
      setLoading(false); // Stop loading after fetch

      // Force spinner visibility for at least 1.5 seconds
      setTimeout(() => {
        setShowLoading(false); // Stop delay after timeout
      }, 1500);
    }
  };

  // --- Fetch Project Status Firestore ---
  const statusColor = (status) => {
    switch (status) {
      case "new":
        return "primary"; // Blue
      case "in-progress":
        return "success"; // Green
      case "on-hold":
        return "warning"; // Orange
      case "cancelled":
        return "danger"; // Red
      case "pending":
        return "info"; // Light Blue
      case "completed":
        return "secondary"; // Gray
      default:
        return "dark";
    }
  };

  // --- Fetch Transactions from Firestore ---
  const fetchTransactions = async () => {
    try {
      const querySnapshot = await getDocs(
        collection(db, `projects/${id}/transactions`),
      );
      const transactionsList = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date:
            data.date && data.date.toDate instanceof Function
              ? data.date.toDate().toISOString().split("T")[0] // Firestore Timestamp
              : data.date || "N/A", // Fallback for string or invalid dates // Convert Firestore Timestamp
        };
      });
      console.log("Fetched Transactions:", transactionsList); // Log updated transactions
      setTransactions(transactionsList);
    } catch (error) {
      console.error("Error fetching transactions: ", error);
    }
  };

  // --- Check and Update Status Based on Transactions ---
  const checkAndUpdateStatus = async () => {
    // Prevent changes if status is locked
    const lockedStatuses = ["completed", "cancelled", "on-hold"]; // Add 'on-hold'
    if (lockedStatuses.includes(project.status)) {
      console.log(`Status is locked: ${project.status}`);
      return; // Do nothing if status is locked
    }

    // Check if a deposit exists
    console.log("Transactions:", transactions);
    const hasDeposit = transactions.some(
      (t) =>
        t.category === "Client Payment" &&
        t.name.toLowerCase().includes("deposit"), // Look for 'deposit'
    );

    // Update status to 'in-progress' if no manual override and conditions are met
    if (hasDeposit && project.status !== "in-progress") {
      try {
        // Update Firestore
        await updateDoc(doc(db, "projects", project.id), {
          status: "in-progress",
          statusDate: new Date(),
        });

        // Update local state
        setProject((prev) => ({
          ...prev,
          status: "in-progress",
          statusDate: new Date(),
        }));

        console.log("Status updated to In Progress.");
      } catch (error) {
        console.error("Error updating status:", error);
      }
    }
  };

  // --- Handle Manual Status Change ---
  const handleStatusChange = async (newStatus) => {
    let note = ""; // Optional status notes
    let confirmed = true; // Default to allow status change

    try {
      // --- Fetch Latest Transactions --- (Ensure data is fresh)
      const querySnapshot = await getDocs(
        collection(db, `projects/${project.id}/transactions`),
      );
      const latestTransactions = querySnapshot.docs.map((doc) => doc.data());

      // --- Validation Logic ---

      // 'In-Progress' Validation: Check for a 'Deposit'
      if (newStatus === "in-progress") {
        const hasDeposit = latestTransactions.some(
          (t) =>
            t.category === "Client Payment" &&
            t.name.toLowerCase().includes("deposit"),
        );
        if (!hasDeposit) {
          toast.error("Cannot mark as 'In Progress'. A deposit is required!");
          return; // Stop status change
        }
      }

      // 'Completed' Validation: Ensure Client Paid in Full
      if (newStatus === "completed") {
        const totalIncome = latestTransactions
          .filter((t) => t.category === "Client Payment")
          .reduce((sum, t) => sum + Number(t.amount), 0);

        if (totalIncome < project.budget) {
          toast.error(
            `Cannot mark as 'Completed'. Client still owes $${
              project.budget - totalIncome
            }!`,
          );
          return; // Stop status change
        }
      }

      // --- Handle Special Cases ---
      if (newStatus === "cancelled") {
        note = prompt("Reason for cancellation:"); // Ask for cancellation note
        confirmed = window.confirm(
          "Are you sure you want to cancel this project?",
        );
      } else if (newStatus === "on-hold") {
        note = prompt("Add a note for placing the project on hold:"); // Optional note
      }

      // --- Proceed with Update if Confirmed ---
      if (confirmed) {
        await updateDoc(doc(db, "projects", project.id), {
          status: newStatus,
          statusDate: new Date(),
          statusNote: note || "",
        });

        // --- Update Local State ---
        setProject((prev) => ({
          ...prev,
          status: newStatus,
          statusDate: new Date(),
          statusNote: note || "",
        }));

        toast.success(`Status updated to: ${newStatus}`);
        console.log(`Status updated to: ${newStatus}`);

        // --- Redirect if 'Cancelled' ---
        if (newStatus === "cancelled") {
          navigate("/"); // Go back to the project list
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status. Please try again.");
    }
  };

  // --- Load Data When Component Mounts ---
  useEffect(() => {
    console.log("useEffect triggered with ID:", id);

    if (id) {
      fetchProject(); // Fetch project details
      fetchTransactions(); // Fetch transactions
    }
  }, [id]); // Only run when 'id' changes

  // --- Check Status After Transactions Are Loaded ---
  useEffect(() => {
    if (!loading && transactions.length > 0) {
      console.log("Transactions loaded. Running status check...");
      checkAndUpdateStatus(); // Status update
    }
  }, [transactions]); // Depend only on 'transactions'

  // --- Navigation Function ---
  const goBack = () => navigate("/"); // Navigate back to the projects list  //

  const [editingTransaction, setEditingTransaction] = useState(null); // Tracks transaction being edited

  // --- Validate The Transaction Form! ---
  const validateForm = () => {
    let validationErrors = {}; // Fresh validation object

    // Check for empty or invalid fields
    if (!newTransaction.date) validationErrors.date = "Date is required";
    if (!newTransaction.name.trim())
      validationErrors.name = "Description is required";
    if (!newTransaction.amount || Number(newTransaction.amount) <= 0)
      validationErrors.amount = "Please enter an amount";
    if (!newTransaction.category)
      validationErrors.category = "Select a category";
    if (!newTransaction.type) validationErrors.type = "Select a payment type";

    setErrors(validationErrors); // Apply only final errors
    return Object.keys(validationErrors).length === 0; // True if no errors
  };

  // --- Add Transaction with Validation ---
  const addTransaction = async () => {
    // Perform validation before submission
    if (!validateForm()) return; // Stop if validation fails

    const newTrans = {
      ...newTransaction,
      projectId: id,
      createdAt: new Date(), // Timestamp
      date: new Date(newTransaction.date), // Ensure date formatting
      category: newTransaction.category, // Use user-selected category
      type: newTransaction.type, // Use user-selected type
      // Handle 'Deposit' labeling dynamically
      name: newTransaction.name.toLowerCase().includes("deposit")
        ? "Deposit" // Enforce "Deposit" label if it includes "deposit"
        : newTransaction.name, // Otherwise, keep original name
    };

    try {
      // Add transaction to Firestore
      await addDoc(collection(db, `projects/${id}/transactions`), newTrans);
      notifySuccess("Transaction added successfully!"); // Success toast
      console.log("New Transaction Added:", newTrans);

      // Refresh transactions and check status
      await fetchTransactions(); // Refresh transactions
      await checkAndUpdateStatus(); // Immediately check and update status

      // Reset form and errors
      setNewTransaction({
        date: new Date().toISOString().split("T")[0],
        name: "",
        amount: "",
        category: "",
        type: "",
      });
      setErrors({}); // Clear errors after successful submission
    } catch (error) {
      console.error("Error adding transaction:", error);
      notifyError("Failed to add transaction."); // Error toast
    }
  };

  // --- Start Edit Transaction ---
  const startEditTransaction = (transaction) => {
    console.log("Editing Transaction:", transaction); // Debug log
    console.log("Editing Transaction Selected:", transaction); // Extra debug log for tracking
    setEditingTransaction(transaction); // Set the transaction being edited
  };

  // --- Save Edited Transaction ---
  const saveEditTransaction = async () => {
    // Ensure there's a transaction being edited
    if (editingTransaction) {
      try {
        // Reference the specific transaction in Firestore
        const docRef = doc(
          db,
          `projects/${id}/transactions`,
          editingTransaction.id,
        );

        // Update the transaction document with the edited data
        await updateDoc(docRef, editingTransaction); // Save to Firestore

        // Refresh transactions to reflect the edit
        fetchTransactions();

        // Exit edit mode
        setEditingTransaction(null); // Reset editing state
      } catch (error) {
        console.error("Error updating transaction:", error); // Handle errors
      }
    }
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null); // Cancel edit and reset editing state
  };

  // --- Delete Transaction ---
  const deleteTransaction = async (transactionId) => {
    try {
      // Reference the specific transaction in Firestore
      const docRef = doc(db, `projects/${id}/transactions`, transactionId);

      // Delete the transaction document
      await deleteDoc(docRef);

      // Refresh the transactions list after deletion
      fetchTransactions();
    } catch (error) {
      // Log any errors during Firestore delete
      console.error("Error deleting transaction:", error);
    }
  };

  // --- Check if a project is marked as completed while editing a transaction ---
  useEffect(() => {
    if (project?.status === "completed" && editingTransaction) {
      setEditingTransaction(null); // Exit edit mode
    }
  }, [project?.status]); // Reacts to status changes

  // --- Financial Summary Calculations ---

  // --- Income ---
  const income = transactions
    .filter(
      (t) => t.projectId === project?.id && t.category === "Client Payment",
    ) // Filter for client payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up payment amounts

  // --- Expenses ---
  const expenses = transactions
    .filter(
      (t) => t.projectId === project?.id && t.category !== "Client Payment",
    ) // Exclude client payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up expenses

  // --- Budget Metrics ---
  const remainingBudget = (project?.budget || 0) - expenses; // Remaining budget based on project allocation
  const availableFunds = income - expenses; // Available funds after deducting expenses
  const remainingClientPayment = project?.budget - income; // Remaining amount client still owes

  // --- Toast Notification Helpers ---
  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  // --- Payment Breakdown by Type ---

  // Cash Received
  const cashReceived = transactions
    .filter(
      (t) =>
        t.projectId === project.id &&
        t.type === "Cash" &&
        t.category === "Client Payment",
    ) // Cash payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up cash received

  // Cash Spent
  const cashSpent = transactions
    .filter(
      (t) =>
        t.projectId === project.id &&
        t.type === "Cash" &&
        t.category !== "Client Payment",
    ) // Cash expenses
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up cash spent

  // VISA Expenses
  const visaExpenses = transactions
    .filter((t) => t.projectId === project.id && t.type === "VISA") // VISA expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Debit Expenses
  const debitExpenses = transactions
    .filter((t) => t.projectId === project.id && t.type === "Debit") // Debit expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // E-Transfer Income
  const eTransferIncome = transactions
    .filter(
      (t) =>
        t.projectId === project.id &&
        t.type === "E-Transfer" &&
        t.category === "Client Payment",
    ) // E-Transfer income
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // E-Transfer Expenses
  const eTransferExpenses = transactions
    .filter(
      (t) =>
        t.projectId === project.id &&
        t.type === "E-Transfer" &&
        t.category !== "Client Payment",
    ) // E-Transfer expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // --- Render UI ---

  // Loading State
  console.log("Render Debug - Loading:", loading);
  console.log("Render Debug - Project:", project);
  console.log("Render Debug - Transactions:", transactions);

  // --- Loading State with Spinner Delay ---
  // Handle loading and missing project data
  if (loading || showLoading || !project) {
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
        <p style={{ marginTop: "10px" }}>Loading project details...</p>
      </div>
    );
  }

  // --- Error State ---
  if (error || !project) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginTop: "20px" }}
      >
        <p style={{ color: "red" }}>Project not found!</p>
        <button
          style={{
            padding: "10px 20px",
            backgroundColor: "#007BFF",
            color: "#FFF",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            marginTop: "10px",
          }}
          onClick={fetchProject} // Retry button
        >
          Retry
        </button>
      </motion.div>
    );
  }

  // --- Utility to Render Transactions ---
  const renderTransactions = (isMobile) => {
    return transactions.map((t) =>
      isMobile ? (
        // --- MOBILE VIEW: Stacked Cards ---
        <div key={t.id} className="card mb-2">
          <div className="card-body">
            {editingTransaction?.id === t.id ? (
              // Edit Mode - Mobile
              <>
                <input
                  type="date"
                  className="form-control mb-2"
                  value={
                    editingTransaction.date
                      ? new Date(editingTransaction.date)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      date: new Date(e.target.value).toISOString(),
                    })
                  }
                />
                <input
                  type="text"
                  className="form-control mb-2"
                  value={editingTransaction.name}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      name: e.target.value,
                    })
                  }
                />
                <input
                  type="number"
                  className="form-control mb-2"
                  value={editingTransaction.amount}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      amount: e.target.value,
                    })
                  }
                />
                <select
                  className="form-select mb-2"
                  value={editingTransaction.category}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      category: e.target.value,
                    })
                  }
                >
                  <option value="Client Payment">Client Payment</option>
                  <option value="Labour">Labour</option>
                  <option value="Materials">Materials</option>
                  <option value="Misc Expense">Misc Expense</option>
                </select>
                <select
                  className="form-select mb-2"
                  value={editingTransaction.type}
                  onChange={(e) =>
                    setEditingTransaction({
                      ...editingTransaction,
                      type: e.target.value,
                    })
                  }
                >
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="E-Transfer">E-Transfer</option>
                  <option value="Debit">Debit</option>
                </select>
                <div className="mt-2">
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={saveEditTransaction}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={cancelEditTransaction}
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              // View Mode - Mobile
              <>
                <h6 className="card-title">{t.name || "Unnamed"}</h6>
                <p className="card-text">
                  <strong>Date:</strong> {t.date || "N/A"} <br />
                  <strong>Amount:</strong> ${t.amount || 0} <br />
                  <strong>Category:</strong> {t.category || "N/A"} <br />
                  <strong>Type:</strong> {t.type || "N/A"}
                </p>
                <div>
                  <div className="mt-2">
                    {!isReadOnly && (
                      <button
                        className="btn btn-warning btn-sm me-2"
                        onClick={() => startEditTransaction(t)}
                      >
                        Edit
                      </button>
                    )}

                    {!isReadOnly && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => deleteTransaction(t.id)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        // --- DESKTOP VIEW: Table Rows ---
        <tr
          key={t.id}
          className={editingTransaction?.id === t.id ? "editing-row" : ""}
        >
          {/* Date Cell */}
          <td className={editingTransaction?.id === t.id ? "editing-cell" : ""}>
            {editingTransaction?.id === t.id ? (
              <input
                type="date"
                value={
                  editingTransaction.date
                    ? new Date(editingTransaction.date)
                        .toISOString()
                        .split("T")[0]
                    : ""
                }
                className="form-control"
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    date: new Date(e.target.value).toISOString(),
                  })
                }
              />
            ) : (
              t.date // Show date in view mode
            )}
          </td>

          {/* Description Cell */}
          <td className={editingTransaction?.id === t.id ? "editing-cell" : ""}>
            {editingTransaction?.id === t.id ? (
              <input
                type="text"
                value={editingTransaction.name}
                className="form-control"
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    name: e.target.value,
                  })
                }
              />
            ) : (
              t.name || "Unnamed"
            )}
          </td>

          {/* Amount Cell */}
          <td className={editingTransaction?.id === t.id ? "editing-cell" : ""}>
            {editingTransaction?.id === t.id ? (
              <input
                type="number"
                value={editingTransaction.amount}
                className="form-control"
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    amount: e.target.value,
                  })
                }
              />
            ) : (
              `$${t.amount || 0}`
            )}
          </td>

          {/* Category Cell */}
          <td className={editingTransaction?.id === t.id ? "editing-cell" : ""}>
            {editingTransaction?.id === t.id ? (
              <select
                className="form-select"
                value={editingTransaction.category}
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    category: e.target.value,
                  })
                }
              >
                <option value="Client Payment">Client Payment</option>
                <option value="Labour">Labour</option>
                <option value="Materials">Materials</option>
                <option value="Misc Expense">Misc Expense</option>
              </select>
            ) : (
              t.category || "N/A"
            )}
          </td>

          {/* Type Cell */}
          <td className={editingTransaction?.id === t.id ? "editing-cell" : ""}>
            {editingTransaction?.id === t.id ? (
              <select
                className="form-select"
                value={editingTransaction.type}
                onChange={(e) =>
                  setEditingTransaction({
                    ...editingTransaction,
                    type: e.target.value,
                  })
                }
              >
                <option value="Cash">Cash</option>
                <option value="VISA">VISA</option>
                <option value="E-Transfer">E-Transfer</option>
                <option value="Debit">Debit</option>
              </select>
            ) : (
              t.type || "N/A"
            )}
          </td>

          {/* Actions */}
          {!isReadOnly && (
            <td
              className={editingTransaction?.id === t.id ? "editing-cell" : ""}
            >
              {editingTransaction?.id === t.id ? (
                <>
                  <button
                    className="btn btn-success btn-sm me-2"
                    onClick={saveEditTransaction}
                  >
                    Save
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={cancelEditTransaction}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => startEditTransaction(t)}
                  >
                    Edit
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteTransaction(t.id)}
                  >
                    Delete
                  </button>
                </>
              )}
            </td>
          )}
        </tr>
      ),
    );
  };

  // Calculate progress dynamically
  const progress = project?.budget
    ? Math.round((expenses / project.budget) * 100)
    : 0;

  const cappedProgress = Math.min(progress, 100); // Prevent exceeding 100%
  // Place this after loading and project are finalized, before the return
  const isReadOnly = project?.status === "completed";

  return (
    <div>
      {/* --- Navbar --- */}
      <Navbar page="projectDashboard" progress={progress} />

      <div className="container py-4 mt-5">
        {/* --- Project Details Card --- */}
        <div className="card mb-4 position-relative">
          {" "}
          {/* Enables relative positioning for ribbon */}
          {/* Ribbon for Status */}
          <div
            className={`position-absolute top-0 end-0 mt-2 me-2 badge bg-${statusColor(
              project?.status || "new", // Default status to 'new'
            )}`}
          >
            {project?.status?.toUpperCase() || "NEW"}
          </div>
          {/* Header */}
          <div className="card-header bg-primary">
            <h5 className="mb-0">Project Details</h5>
          </div>
          {/* Body */}
          <div className="card-body">
            {/* Project Info */}
            <p className="mb-2">
              <strong>Project:</strong> {project.name}
            </p>
            <p className="mb-2">
              <strong>Location:</strong> {project.location}
            </p>
            <p className="mb-2">
              <strong>Budget:</strong> ${project?.budget ?? "N/A"}
            </p>

            {/* Status Dropdown - Inline */}
            <div className="d-flex align-items-center">
              <strong className="me-2">Status:</strong>
              <select
                className="form-select form-select-sm me-2"
                value={project?.status || "new"}
                onChange={(e) => handleStatusChange(e.target.value)}
                style={{
                  width: "130px",
                  fontSize: "0.9rem",
                  padding: "0.25rem 0.5rem",
                }}
                disabled={["cancelled", "completed"].includes(project?.status)} // Lock these statuses
              >
                <option value="new">New</option>
                <option
                  value="in-progress"
                  disabled={
                    transactions.length === 0 || // Disable if no transactions exist
                    !transactions.some(
                      (t) =>
                        t.category === "Client Payment" &&
                        t.name.toLowerCase().includes("deposit"),
                    )
                  }
                >
                  In Progress
                </option>
                <option
                  value="completed"
                  disabled={
                    income < project?.budget // Disable if client hasn't paid in full
                  }
                >
                  Completed
                </option>
                <option value="on-hold">On Hold</option>
                <option value="cancelled">Cancelled</option>
              </select>
              {project.status === "cancelled" && (
                <button
                  className="btn btn-warning btn-sm ms-3"
                  onClick={() => handleStatusChange("in-progress")} // Reopen project
                >
                  Reopen
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- Add Transaction Form --- */}
        {!isReadOnly && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Add New Transaction</h5>
            </div>
            <div className="card-body">
              <div className="row g-2 align-items-center">
                {/* Date Input */}
                <div className="col-lg-2 col-md-3 col-6">
                  <input
                    type="date"
                    className={`form-control ${errors.date ? "is-invalid" : ""}`}
                    value={newTransaction.date}
                    onChange={(e) => {
                      setNewTransaction({
                        ...newTransaction,
                        date: e.target.value,
                      });

                      // Dynamic validation
                      setErrors((prev) => ({
                        ...prev,
                        date: !e.target.value ? "Date is required" : "", // Clear error if valid
                      }));
                    }}
                  />
                  {errors.date && (
                    <div className="invalid-feedback">{errors.date}</div>
                  )}
                </div>

                {/* Description Input */}
                <div className="col-lg-3 col-md-3 col-6">
                  <input
                    type="text"
                    className={`form-control ${errors.name ? "is-invalid" : ""}`}
                    placeholder="Description"
                    value={newTransaction.name}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Update the description in state
                      setNewTransaction({
                        ...newTransaction,
                        name: value,
                      });

                      // Dynamic validation - Add or remove error
                      setErrors((prev) => {
                        const updatedErrors = { ...prev };
                        if (!value.trim())
                          updatedErrors.name = "Description is required";
                        else delete updatedErrors.name; // Remove error if valid
                        return updatedErrors;
                      });
                    }}
                  />
                  {errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                {/* Amount Input */}
                <div className="col-lg-2 col-md-2 col-6">
                  <input
                    type="number"
                    className={`form-control ${errors.amount ? "is-invalid" : ""}`}
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Update the amount in state
                      setNewTransaction({
                        ...newTransaction,
                        amount: value,
                      });

                      // Dynamic validation - Add or remove error
                      setErrors((prev) => {
                        const updatedErrors = { ...prev };
                        if (!value || Number(value) <= 0)
                          updatedErrors.amount = "Please enter an amount";
                        else delete updatedErrors.amount; // Remove error if valid
                        return updatedErrors;
                      });
                    }}
                  />
                  {errors.amount && (
                    <div className="invalid-feedback">{errors.amount}</div>
                  )}
                </div>

                {/* Category Dropdown */}
                <div className="col-lg-2 col-md-3 col-6">
                  <select
                    className={`form-select ${errors.category ? "is-invalid" : ""}`}
                    value={newTransaction.category || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Update the selected category
                      setNewTransaction({
                        ...newTransaction,
                        category: value,
                      });

                      // Dynamic validation - Add or remove error
                      setErrors((prev) => {
                        const updatedErrors = { ...prev };
                        if (!value)
                          updatedErrors.category = "Select a category";
                        else delete updatedErrors.category; // Remove error if valid
                        return updatedErrors;
                      });
                    }}
                  >
                    <option value="">Select Category</option>
                    <option value="Client Payment">Client Payment</option>
                    <option value="Labour">Labour</option>
                    <option value="Materials">Materials</option>
                    <option value="Misc Expense">Misc Expense</option>
                  </select>
                  {errors.category && (
                    <div className="invalid-feedback">{errors.category}</div>
                  )}
                </div>
                {/* Payment Type Dropdown */}
                <div className="col-lg-2 col-md-3 col-6">
                  <select
                    className={`form-select ${errors.type ? "is-invalid" : ""}`}
                    value={newTransaction.type || ""}
                    onChange={(e) => {
                      const value = e.target.value;

                      // Update the selected payment type
                      setNewTransaction({
                        ...newTransaction,
                        type: value,
                      });

                      // Dynamic validation - Add or remove error
                      setErrors((prev) => {
                        const updatedErrors = { ...prev };
                        if (!value)
                          updatedErrors.type = "Select a payment type";
                        else delete updatedErrors.type; // Remove error if valid
                        return updatedErrors;
                      });
                    }}
                  >
                    <option value="">Select Type</option>
                    <option value="Cash">Cash</option>
                    <option value="VISA">VISA</option>
                    <option value="E-Transfer">E-Transfer</option>
                    <option value="Debit">Debit</option>
                  </select>
                  {errors.type && (
                    <div className="invalid-feedback">{errors.type}</div>
                  )}
                </div>

                {/* Add Button */}
                <div className="col-lg-1 col-md-3 col-6 text-end">
                  {!isReadOnly && (
                    <button
                      className="btn btn-primary btn-sm w-100"
                      onClick={addTransaction} // Rely on validateForm() instead
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* --- Transactions Section --- */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Current Transactions</h5>
          </div>
          <div className="card-body">
            {transactions.length === 0 || !project?.id ? (
              <p className="text-center text-muted">
                There are no transactions to display.
              </p>
            ) : (
              <>
                {/* --- Desktop View --- */}
                <div className="d-none d-md-block table-responsive">
                  <table className="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Description</th>
                        <th>Amount</th>
                        <th>Category</th>
                        <th>Type</th>
                        {!isReadOnly && <th>Actions</th>}{" "}
                        {/* Only show if editable */}
                      </tr>
                    </thead>
                    <tbody>{renderTransactions(false)}</tbody>
                  </table>
                </div>
                {/* --- Mobile View --- */}
                <div className="d-block d-md-none">
                  {renderTransactions(true)}
                </div>
              </>
            )}
          </div>
        </div>

        {/* --- Financial Summary - Dynamic Visibility --- */}
        {transactions.length > 0 && (
          <div className="card mb-4 financial-summary-container">
            <div className="card-header">
              <h5 className="mb-0">Financial Summary</h5>
            </div>
            <div className="card-body">
              <div className="row mb-3">
                {/* Overview */}
                <div className="col-md-6">
                  <h6 className="text-primary mb-3">Overview</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <strong>Total Income:</strong> ${income}
                    </li>
                    <li className="mb-2">
                      <strong>Total Expenses:</strong> ${expenses}
                    </li>
                    <li className="mb-2">
                      <strong>Remaining Budget:</strong> ${remainingBudget}
                    </li>
                    <li className="mb-2">
                      <strong>Available Funds:</strong> ${availableFunds}
                    </li>
                    <li className="mb-2">
                      <strong>Remaining Client Payment:</strong> $
                      {remainingClientPayment}
                    </li>
                  </ul>
                </div>

                {/* Payment Breakdown */}
                <div className="col-md-6">
                  <h6 className="text-success mb-3">Payment Breakdown</h6>
                  <ul className="list-unstyled mb-0">
                    <li className="mb-2">
                      <strong>Cash Received: </strong> ${cashReceived}
                    </li>
                    <li className="mb-2">
                      <strong>Cash Spent: </strong> ${cashSpent}
                    </li>
                    <li className="mb-2">
                      <strong>VISA Expenses: </strong> ${visaExpenses}
                    </li>
                    <li className="mb-2">
                      <strong>Debit Expenses: </strong> ${debitExpenses}
                    </li>
                    <li className="mb-2">
                      <strong>E-Transfer Income: </strong> ${eTransferIncome}
                    </li>
                    <li className="mb-2">
                      <strong>E-Transfer Expenses: </strong> $
                      {eTransferExpenses}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
        <ToastContainer
          position="top-center"
          autoClose={3000}
          hideProgressBar={true}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
          transition={Bounce}
        />
      </div>
    </div>
  );
}

export default ProjectDashboard;
