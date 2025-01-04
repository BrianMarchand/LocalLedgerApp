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

// --- Import The Profress Details Card ---
import ProjectDetailsCard from "../components/ProjectDetailsCard";

// --- Format Utilities ---
import { formatCurrency } from "../utils/formatUtils";

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
  const income =
    project && project.id
      ? transactions
          .filter(
            (t) =>
              t.projectId === project.id && t.category === "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // --- Expenses ---
  const expenses = transactions
    .filter(
      (t) => t.projectId === project?.id && t.category !== "Client Payment",
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // --- Profit ---
  const profit = income - expenses; // FIX: Place this AFTER income and expenses

  // ---Percentage Spent ---
  const budgetSpentPercent =
    project?.budget && expenses !== undefined
      ? ((expenses / (project.budget || 1)) * 100).toFixed(2)
      : 0;

  console.log("Project Data:", project);
  console.log("Budget:", project?.budget);

  // --- Total Transactions ---
  const totalTransactions = transactions.length;

  // --- Normalize Dates to Midnight ---
  const normalizeDate = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0); // Set time to midnight (00:00:00)
    return d;
  };

  // --- Calculate Days in Progress ---
  const today = normalizeDate(new Date()); // Normalize today's date
  const startDate = project?.statusDate
    ? normalizeDate(
        project.statusDate.toDate
          ? project.statusDate.toDate() // Handle Firestore Timestamp
          : new Date(project.statusDate), // Handle string or ISO format
      )
    : today; // Default to today if no statusDate

  const daysInProgress = Math.max(
    0,
    Math.floor((today - startDate) / (1000 * 60 * 60 * 24)),
  );

  // --- Budget Metrics ---
  let remainingBudget = 0;
  let availableFunds = 0;
  let remainingClientPayment = 0;

  if (project && project.budget) {
    remainingBudget = ((project.budget || 0) - (expenses || 0)).toFixed(2);
    availableFunds = ((income || 0) - (expenses || 0)).toFixed(2);
    remainingClientPayment = ((project.budget || 0) - (income || 0)).toFixed(2);
  }

  // Calculate only if project exists
  if (project && project.budget !== undefined) {
    // Added check for project.budget
    remainingBudget = ((project.budget || 0) - (expenses || 0)).toFixed(2);
    availableFunds = ((income || 0) - (expenses || 0)).toFixed(2);
    remainingClientPayment = ((project.budget || 0) - (income || 0)).toFixed(2);
  }

  // --- Toast Notification Helpers ---
  const notifySuccess = (message) => toast.success(message);
  const notifyError = (message) => toast.error(message);

  // --- Payment Breakdown by Type ---

  // Cash Received
  const cashReceived =
    project && project.id
      ? transactions
          .filter(
            (t) =>
              t.projectId === project.id &&
              t.type === "Cash" &&
              t.category === "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

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

  // Payments Received
  const paidPercentage =
    project?.budget && income !== undefined
      ? Math.round((income / (project.budget || 1)) * 100)
      : 0;
  // Largest Payment Received
  const largestPayment = transactions
    .filter((t) => t.category === "Client Payment")
    .reduce((max, t) => Math.max(max, Number(t.amount)), 0);

  // Average Payment Received
  const paymentTransactions = transactions.filter(
    (t) => t.category === "Client Payment",
  );
  const averagePayment =
    paymentTransactions.length > 0
      ? paymentTransactions.reduce((sum, t) => sum + Number(t.amount), 0) /
        paymentTransactions.length
      : 0;

  // Deposits Received
  const totalDeposits = transactions
    .filter(
      (t) =>
        t.category === "Client Payment" &&
        t.name.toLowerCase().includes("deposit"),
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  //  Pending payments
  const expenseCategories = transactions.reduce(
    (acc, t) => {
      if (t.category === "Labor") acc.labor += Number(t.amount);
      else if (t.category === "Materials") acc.materials += Number(t.amount);
      else acc.miscellaneous += Number(t.amount); // Catch-all
      return acc;
    },
    { labor: 0, materials: 0, miscellaneous: 0 },
  );

  // ------------------ New Section ------------------

  // --- Loading Spinner ---
  const LoadingSpinner = () => (
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

  const isReadOnly = project?.status === "completed"; // Example: Lock editing for completed projects

  // --- Error State ---
  const ErrorState = ({ fetchProject }) => (
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
        onClick={fetchProject}
      >
        Retry
      </button>
    </motion.div>
  );

  // --- Render Transactions Table ---
  const TransactionsTable = ({
    transactions,
    editingTransaction,
    isReadOnly,
    setEditingTransaction,
    saveEditTransaction,
    cancelEditTransaction,
    deleteTransaction,
    formatCurrency,
  }) => {
    return transactions.map((t) => (
      <tr
        key={t.id}
        className={editingTransaction?.id === t.id ? "editing-row" : ""}
      >
        {/* Date */}
        <td>
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
                  date: e.target.value,
                })
              }
            />
          ) : (
            t.date || "N/A"
          )}
        </td>

        {/* Description */}
        <td>
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

        {/* Amount */}
        <td>
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
            formatCurrency(t.amount)
          )}
        </td>

        {/* Actions */}
        {!isReadOnly && (
          <td>
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
                  onClick={() => setEditingTransaction(t)}
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
    ));
  };

  // --- Progress Calculation ---
  const progress = project?.budget
    ? Math.round(((expenses || 0) / (project.budget || 1)) * 100) // Prevent divide by 0
    : 0;

  const cappedProgress = Math.min(progress, 100); // Ensure <= 100

  // --- Render UI ---
  // --- Loading State with Spinner Delay ---
  if (loading || showLoading) return <LoadingSpinner />;
  if (error || !project || !project.budget)
    return <ErrorState fetchProject={fetchProject} />;

  return (
    <div>
      <Navbar page="projectDashboard" progress={cappedProgress} />
      <div className="container mt-5">
        <h1>Project Details Page</h1>
        <p class="mb-5">This is some placeholder copy for this page.</p>
        {/* Row for Side-by-Side Layout */}
        <div className="row g-4 mb-2">
          {/* Left Column: Project Details */}
          <div className="col-md-6">
            <ProjectDetailsCard
              project={project}
              handleStatusChange={handleStatusChange}
            />
          </div>

          {/* Right Column: Add Transaction */}
          {!isReadOnly && (
            <div className="col-md-6">
              <div className="global-card">
                {/* Card Header */}
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="mb-0">Add Transaction</h5>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <form>
                    {/* Row 1: Date Field */}
                    <div className="row mb-2">
                      <div className="col-md-12">
                        <input
                          type="date"
                          className={`form-control ${
                            errors.date ? "is-invalid" : ""
                          }`}
                          value={newTransaction.date}
                          onChange={(e) =>
                            setNewTransaction({
                              ...newTransaction,
                              date: e.target.value,
                            })
                          }
                          placeholder="Date"
                        />
                      </div>
                    </div>

                    {/* Row 2: Description and Amount */}
                    <div className="row g-2 mb-2 align-items-center">
                      {/* Description Field */}
                      <div className="col-md-8">
                        <input
                          type="text"
                          className={`form-control ${
                            errors.name ? "is-invalid" : ""
                          }`}
                          placeholder="Description"
                          value={newTransaction.name}
                          onChange={(e) =>
                            setNewTransaction({
                              ...newTransaction,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>

                      {/* Amount Field */}
                      <div className="col-md-4">
                        <input
                          type="number"
                          className={`form-control ${
                            errors.amount ? "is-invalid" : ""
                          }`}
                          placeholder="Amount"
                          value={newTransaction.amount}
                          onChange={(e) =>
                            setNewTransaction({
                              ...newTransaction,
                              amount: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    {/* Row 3: Category, Type, and Add Button */}
                    <div className="row g-2 align-items-center">
                      {/* Category Field */}
                      <div className="col-md-5">
                        <select
                          className={`form-select ${
                            errors.category ? "is-invalid" : ""
                          }`}
                          value={newTransaction.category}
                          onChange={(e) =>
                            setNewTransaction({
                              ...newTransaction,
                              category: e.target.value,
                            })
                          }
                        >
                          <option value="">Category</option>
                          <option value="Client Payment">Client Payment</option>
                          <option value="Labor">Labor</option>
                          <option value="Materials">Materials</option>
                          <option value="Miscellaneous">Miscellaneous</option>
                        </select>
                      </div>

                      {/* Type Field */}
                      <div className="col-md-5">
                        <select
                          className={`form-select ${
                            errors.type ? "is-invalid" : ""
                          }`}
                          value={newTransaction.type}
                          onChange={(e) =>
                            setNewTransaction({
                              ...newTransaction,
                              type: e.target.value,
                            })
                          }
                        >
                          <option value="">Type</option>
                          <option value="Cash">Cash</option>
                          <option value="VISA">VISA</option>
                          <option value="Debit">Debit</option>
                          <option value="E-Transfer">E-Transfer</option>
                        </select>
                      </div>

                      {/* Add Transaction Button */}
                      <div className="col-md-2 d-flex align-items-center">
                        <button
                          type="button"
                          className="btn btn-success btn-md d-flex align-items-center justify-content-center w-100"
                          onClick={addTransaction}
                          title="Add Transaction"
                        >
                          <p>add</p>
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="global-card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Transactions</h5>
          </div>
          <div className="card-body">
            {project && Array.isArray(transactions) ? (
              transactions.length === 0 ? (
                // --- No Transactions Fallback ---
                <p className="text-center text-muted">
                  No transactions available.
                </p>
              ) : (
                <>
                  {/* --- Desktop Table View --- */}
                  <div className="d-none d-md-block">
                    <table className="table table-striped table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Description</th>
                          <th>Amount</th>
                          <th>Category</th>
                          <th>Type</th>
                          {!isReadOnly && <th>Actions</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((t) => (
                          <tr key={t.id}>
                            <td>{t.date || "N/A"}</td>
                            <td>{t.name || "Unnamed"}</td>
                            <td>{formatCurrency(t.amount)}</td>
                            <td>{t.category || "N/A"}</td>
                            <td>{t.type || "N/A"}</td>
                            {!isReadOnly && (
                              <td>
                                <button
                                  className="btn btn-warning btn-sm me-2"
                                  onClick={() => startEditTransaction(t)}
                                  title="Edit Transaction"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  className="btn btn-danger btn-sm"
                                  onClick={() => deleteTransaction(t.id)}
                                  title="Delete Transaction"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* --- Mobile Card View --- */}
                  <div className="d-md-none">
                    {transactions.map((t) => (
                      <div
                        key={t.id}
                        className="mobile-card mb-3 p-3 border rounded shadow-sm"
                      >
                        {/* Date */}
                        <p className="mb-2">
                          <i className="bi bi-calendar3 me-2"></i>
                          <strong>Date:</strong> {t.date || "N/A"}
                        </p>

                        {/* Description */}
                        <p className="mb-2">
                          <i className="bi bi-pencil me-2"></i>
                          <strong>Description:</strong> {t.name || "Unnamed"}
                        </p>

                        {/* Amount */}
                        <p className="mb-2">
                          <i className="bi bi-currency-dollar me-2"></i>
                          <strong>Amount:</strong> {formatCurrency(t.amount)}
                        </p>

                        {/* Category */}
                        <p className="mb-2">
                          <i className="bi bi-tag-fill me-2"></i>
                          <strong>Category:</strong> {t.category || "N/A"}
                        </p>

                        {/* Type */}
                        <p className="mb-2">
                          <i className="bi bi-credit-card me-2"></i>
                          <strong>Type:</strong> {t.type || "N/A"}
                        </p>

                        {/* Divider */}
                        <hr className="my-3" />

                        {/* Actions */}
                        {!isReadOnly && (
                          <div className="d-flex align-items-center">
                            <button
                              className="btn btn-warning btn-sm me-2"
                              onClick={() => startEditTransaction(t)}
                              title="Edit Transaction"
                            >
                              <i className="bi bi-pencil-square me-2"></i>
                              <span>Edit</span>
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => deleteTransaction(t.id)}
                              title="Delete Transaction"
                            >
                              <i className="bi bi-trash me-2"></i>
                              <span>Delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )
            ) : (
              // --- Loading State ---
              <p className="text-center text-muted">Loading transactions...</p>
            )}
          </div>
        </div>

        {/* Financial Summary and Payment Breakdown */}
        {project &&
          typeof project.budget === "number" && // Ensure project.budget exists
          Array.isArray(transactions) &&
          transactions.length > 0 &&
          typeof income === "number" &&
          typeof expenses === "number" && (
            <div className="row mb-4">
              {/* Financial Summary */}
              <div className="col-sm-12 col-md-6 mb-4">
                <div className="global-card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-graph-up-arrow me-2"></i>Financial
                      Summary
                    </h5>
                  </div>
                  <div className="card-body">
                    <ul className="mb-0">
                      <li>
                        <i className="bi bi-cash-coin me-2"></i>
                        <strong>Total Income:</strong>
                        <span className="ms-2 text-success">
                          {formatCurrency(income ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-cart-dash me-2"></i>
                        <strong>Total Expenses:</strong>
                        <span className="ms-2 text-danger">
                          {formatCurrency(expenses ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-wallet2 me-2"></i>
                        <strong>Remaining Budget:</strong>
                        <span className="ms-2">
                          {formatCurrency(remainingBudget ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-bank me-2"></i>
                        <strong>Available Funds:</strong>
                        <span className="ms-2">
                          {formatCurrency(availableFunds ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-cash-stack me-2"></i>
                        <strong>Remaining Client Payment:</strong>
                        <span className="ms-2">
                          {formatCurrency(remainingClientPayment ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-coin me-2"></i>
                        <strong>Profit (Net Balance):</strong>
                        <span
                          className={`ms-2 ${
                            profit >= 0 ? "text-success" : "text-danger"
                          }`}
                        >
                          {formatCurrency(profit ?? 0)}
                        </span>
                      </li>
                      <hr />
                      <li>
                        <i className="bi bi-bar-chart-line me-2"></i>
                        <strong>Budget Spent:</strong>
                        <span className="ms-2">{budgetSpentPercent ?? 0}%</span>
                      </li>
                      <li>
                        <i className="bi bi-list-check me-2"></i>
                        <strong>Total Transactions:</strong>
                        <span className="ms-2">{totalTransactions ?? 0}</span>
                      </li>
                      <li>
                        <i className="bi bi-calendar-check me-2"></i>
                        <strong>Days in Progress:</strong>
                        <span className="ms-2">{daysInProgress ?? 0}</span> days
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Payment Breakdown */}
              <div className="col-sm-12 col-md-6 mb-4">
                <div className="global-card">
                  <div className="card-header">
                    <h5 className="mb-0">
                      <i className="bi bi-cash-stack me-2"></i>Payment Breakdown
                    </h5>
                  </div>
                  <div className="card-body">
                    <ul className="mb-0">
                      <li>
                        <i className="bi bi-cash me-2"></i>
                        <strong>Cash Received:</strong>
                        <span className="ms-2">
                          {formatCurrency(cashReceived ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-wallet me-2"></i>
                        <strong>Cash Spent:</strong>
                        <span className="ms-2">
                          {formatCurrency(cashSpent ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-credit-card-2-back me-2"></i>
                        <strong>VISA Expenses:</strong>
                        <span className="ms-2">
                          {formatCurrency(visaExpenses ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-credit-card me-2"></i>
                        <strong>Debit Expenses:</strong>
                        <span className="ms-2">
                          {formatCurrency(debitExpenses ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-arrow-down-circle me-2"></i>
                        <strong>E-Transfer Income:</strong>
                        <span className="ms-2">
                          {formatCurrency(eTransferIncome ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-arrow-up-circle me-2"></i>
                        <strong>E-Transfer Expenses:</strong>
                        <span className="ms-2">
                          {formatCurrency(eTransferExpenses ?? 0)}
                        </span>
                      </li>
                      <hr />
                      <li>
                        <i className="bi bi-exclamation-circle me-2"></i>
                        <strong>Unpaid Balance:</strong>
                        <span className="ms-2">
                          {formatCurrency(remainingClientPayment ?? 0)}
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-bar-chart me-2"></i>
                        <strong>Payments Received:</strong>
                        <span className="ms-2">
                          {paidPercentage ?? 0}% of Budget
                        </span>
                      </li>
                      <li>
                        <i className="bi bi-piggy-bank-fill me-2"></i>
                        <strong>Largest Payment:</strong>
                        <span className="ms-2">
                          {formatCurrency(largestPayment ?? 0)}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
      </div>
    </div>
  );
}

export default ProjectDashboard;
