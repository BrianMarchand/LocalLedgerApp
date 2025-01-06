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

// --- Bootstrap Core Styles and JS ---
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Include Bootstrap JS
import "bootstrap-icons/font/bootstrap-icons.css";

// --- Toast Notifications ---
import { ToastContainer, toast, Bounce } from "react-toastify"; // Toast notifications
import "react-toastify/dist/ReactToastify.css";

// --- Loader and Animations ---
import { motion } from "framer-motion"; // Animations
import { ProgressBar } from "react-loader-spinner"; // Progress bar loader

// --- Custom Context and Hooks ---
import { useTheme } from "../context/ThemeContext"; // Theme context

// --- Custom Components ---
import Navbar from "./Navbar"; // Reusable navbar component

// --- Import The Profress Details Card ---
import ProjectDetailsCard from "./ProjectDetailsCard";

// --- Format Utilities ---
import { formatCurrency } from "../utils/formatUtils";

// --- Import SweetAlert ---
import Swal from "sweetalert2"; // Import SweetAlert2

// --- Import Freeform Notes ---
import FreeformNote from "./Notes/FreeformNote";
import NotesModal from "./Notes/NotesModal";

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

  // --- Fetch Project Status Firestore ---
  const statusColor = (status) => {
    switch (status) {
      case "new":
        return "badge-primary"; // Blue
      case "in-progress":
        return "badge-success"; // Green
      case "on-hold":
        return "badge-warning"; // Orange
      case "cancelled":
        return "badge-danger"; // Red
      case "pending":
        return "badge-info"; // Light Blue
      case "completed":
        return "badge-secondary"; // Gray
      default:
        return "badge-dark"; // Fallback
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
  const checkAndUpdateStatus = async (newTransaction = null) => {
    // Prevent changes if status is locked
    const lockedStatuses = ["completed", "cancelled", "on-hold"]; // Add 'on-hold'
    if (lockedStatuses.includes(project.status)) {
      console.log(`Status is locked: ${project.status}`);
      return; // Do nothing if status is locked
    }

    // Check if a deposit exists either in existing transactions or the new one
    const hasDeposit =
      transactions.some(
        (t) =>
          t.category === "Client Payment" &&
          t.name.toLowerCase().includes("deposit"),
      ) ||
      (newTransaction &&
        newTransaction.category === "Client Payment" &&
        newTransaction.name.toLowerCase().includes("deposit")); // Check newTransaction

    // Update status to 'in-progress' if conditions are met
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
        toast.success("Project status updated to In Progress!"); // Add notification
      } catch (error) {
        console.error("Error updating status:", error);
        toast.error("Failed to update project status.");
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
  // --- Declare isMounted outside useEffect ---
  let isMounted = true; // Declare outside, accessible globally

  // --- Existing fetchProject function (keep only ONE definition) ---
  const fetchProject = async () => {
    setLoading(true); // Start loading

    try {
      const docRef = doc(db, "projects", id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("Firestore Data:", data);
        setProject({ id: docSnap.id, ...data }); // Update state
      } else {
        console.log("Document does NOT exist!");
        setError(true); // Set error
      }
    } catch (error) {
      console.error("Error fetching project:", error);
      setError(true); // Handle error
    } finally {
      setLoading(false); // Ensure we stop loading!
      setTimeout(() => setShowLoading(false), 1500); // Delayed stop
    }
  };

  // --- useEffect Hook ---
  useEffect(() => {
    console.log("useEffect triggered with ID:", id);

    const loadData = async () => {
      await fetchProject(); // Wait until project loads
      await fetchTransactions(); // Then fetch transactions
    };

    if (id) {
      loadData(); // Call the async function
    }

    return () => {
      isMounted = false; // Cleanup function
    };
  }, [id]); // Depend only on 'id'

  // --- Check Status After Transactions Are Loaded ---
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      setFilteredTransactions(transactions); // Only initialize after loading
    }
  }, [transactions]); // Depend on transactions data

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
      await checkAndUpdateStatus(newTrans); // Pass the new transaction to check status

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
    if (!editingTransaction || !project?.id) return; // Ensure valid project and transaction

    try {
      const docRef = doc(
        db,
        `projects/${id}/transactions`,
        editingTransaction.id,
      );

      await updateDoc(docRef, {
        ...editingTransaction,
        date: new Date(editingTransaction.date),
        amount: parseFloat(editingTransaction.amount),
      });

      await fetchTransactions();
      setEditingTransaction(null); // Clear edit mode
      toast.success("Transaction updated successfully!");
    } catch (error) {
      console.error("Error updating transaction:", error);
      toast.error("Failed to update transaction!");
    }
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null); // Cancel edit and reset editing state
  };

  // --- Check if a project is marked as completed while editing a transaction ---
  useEffect(() => {
    if (project?.status === "completed" && editingTransaction) {
      setEditingTransaction(null); // Exit edit mode
    }
  }, [project?.status]); // Reacts to status changes

  // State for storing filtered transactions
  const [filteredTransactions, setFilteredTransactions] = useState([]);

  // --- FILTERING LOGIC --------------------------------------------------------------------------

  // Function to filter transactions based on type (in or out)
  const handleFilter = (type) => {
    let filtered = [];

    if (type === "in") {
      // Filter IN transactions (income)
      filtered = transactions.filter((t) => {
        return (
          (t.type === "Cash" && t.amount > 0) || // Cash IN
          (t.type === "E-Transfer" && t.category === "Client Payment") // E-Transfer IN
        );
      });
    } else if (type === "out") {
      // Filter OUT transactions (expenses)
      filtered = transactions.filter((t) => {
        return (
          (t.type === "Cash" && t.amount < 0) || // Cash OUT
          t.type === "VISA" || // VISA OUT
          t.type === "Debit" || // Debit OUT
          (t.type === "E-Transfer" && t.category === "Trades Payment") // E-Transfer OUT
        );
      });
    } else {
      // Show all transactions
      filtered = transactions;
    }

    // --- END FILTERING LOGIC -----------------------------------------------------------------------

    // Update filtered transactions in state
    setFilteredTransactions(filtered);

    // Debugging
    console.log(`Filtered (${type}) Transactions:`, filtered);
  };

  // Default to show all transactions initially
  useEffect(() => {
    setFilteredTransactions(transactions);
  }, [transactions]);

  // --- Financial Summary Calculations ---
  // --- Income ---
  const income =
    project && transactions.length > 0
      ? transactions
          .filter(
            (t) =>
              project.id &&
              t.projectId === project.id &&
              t.category === "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // --- Expenses ---
  const expenses =
    project && transactions.length > 0
      ? transactions
          .filter(
            (t) =>
              project.id &&
              t.projectId === project.id &&
              t.category !== "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

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
  // Add safety checks for each calculation

  // Cash Received
  const cashReceived =
    project && project.id && Array.isArray(transactions)
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
  const cashSpent =
    project && project.id && Array.isArray(transactions)
      ? transactions
          .filter(
            (t) =>
              t.projectId === project.id &&
              t.type === "Cash" &&
              t.category !== "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // VISA Expenses
  const visaExpenses =
    project && project.id && Array.isArray(transactions)
      ? transactions
          .filter((t) => t.projectId === project.id && t.type === "VISA")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // Debit Expenses
  const debitExpenses =
    project && project.id && Array.isArray(transactions)
      ? transactions
          .filter((t) => t.projectId === project.id && t.type === "Debit")
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // E-Transfer Income
  const eTransferIncome =
    project && project.id && Array.isArray(transactions)
      ? transactions
          .filter(
            (t) =>
              t.projectId === project.id &&
              t.type === "E-Transfer" &&
              t.category === "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // E-Transfer Expenses
  const eTransferExpenses =
    project && project.id && Array.isArray(transactions)
      ? transactions
          .filter(
            (t) =>
              t.projectId === project.id &&
              t.type === "E-Transfer" &&
              t.category !== "Client Payment",
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // Payments Received
  const paidPercentage =
    project && project.budget && Array.isArray(transactions)
      ? Math.round((income / (project.budget || 1)) * 100)
      : 0;

  // Largest Payment Received
  const largestPayment =
    project && Array.isArray(transactions)
      ? transactions
          .filter((t) => t.category === "Client Payment")
          .reduce((max, t) => Math.max(max, Number(t.amount)), 0)
      : 0;

  // Average Payment Received
  const paymentTransactions =
    project && Array.isArray(transactions)
      ? transactions.filter((t) => t.category === "Client Payment")
      : [];

  const averagePayment =
    paymentTransactions.length > 0
      ? paymentTransactions.reduce((sum, t) => sum + Number(t.amount), 0) /
        paymentTransactions.length
      : 0;

  // Deposits Received
  const totalDeposits =
    project && Array.isArray(transactions)
      ? transactions
          .filter(
            (t) =>
              t.category === "Client Payment" &&
              t.name.toLowerCase().includes("deposit"),
          )
          .reduce((sum, t) => sum + Number(t.amount), 0)
      : 0;

  // Pending Payments Breakdown
  const expenseCategories =
    project && Array.isArray(transactions)
      ? transactions.reduce(
          (acc, t) => {
            if (t.category === "Labor") acc.labor += Number(t.amount);
            else if (t.category === "Materials")
              acc.materials += Number(t.amount);
            else acc.miscellaneous += Number(t.amount); // Catch-all
            return acc;
          },
          { labor: 0, materials: 0, miscellaneous: 0 },
        )
      : { labor: 0, materials: 0, miscellaneous: 0 };

  // --- End Payment Breakdown By Type ---

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

  // --- SweetAlert ---
  const deleteTransaction = async (transaction) => {
    // Ensure transaction exists
    if (!transaction) {
      Swal.fire("Error!", "Transaction details are missing.", "error");
      return;
    }

    // Safely extract values with defaults
    const name = transaction.name || "Unnamed Transaction";
    const date = transaction.date || "N/A";
    const amount = transaction.amount
      ? `$${parseFloat(transaction.amount).toFixed(2)}`
      : "$0.00";

    // Show confirmation with context
    Swal.fire({
      title: "Are you sure?",
      html: `<p>You are about to delete:</p>
           <strong>${name}</strong><br>
           <small>Date:</small> ${date}<br>
           <small>Amount:</small> ${amount}`, // Dynamic content
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // Delete the transaction from Firestore
          const docRef = doc(db, `projects/${id}/transactions`, transaction.id);
          await deleteDoc(docRef);

          // Refresh transactions
          fetchTransactions();

          // Success message
          Swal.fire(
            "Deleted!",
            `"${name}" has been successfully deleted.`,
            "success",
          );
        } catch (error) {
          console.error("Error deleting transaction:", error);
          Swal.fire("Error!", "Failed to delete the transaction.", "error");
        }
      }
    });
  };

  // --- Render Transactions Table ---
  const TransactionsTable = ({
    transactions = [], // Default to an empty array to avoid errors
    editingTransaction,
    setEditingTransaction,
    saveEditTransaction,
    cancelEditTransaction,
    deleteTransaction,
    isReadOnly,
    formatCurrency,
  }) => {
    // --- Handle Empty Transactions Early ---
    if (!Array.isArray(transactions) || transactions.length === 0) {
      return (
        <p className="text-center text-muted">No transactions available.</p>
      );
    }
    return (
      <div style={{ width: "100%" }}>
        <table className="table-glass">
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
                {/* Date Field */}
                <td>
                  {editingTransaction?.id === t.id ? (
                    <input
                      type="date"
                      value={editingTransaction.date || ""}
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

                {/* Description Field */}
                <td>
                  {editingTransaction?.id === t.id ? (
                    <input
                      type="text"
                      value={editingTransaction.name || ""}
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

                {/* Amount Field */}
                <td>
                  {editingTransaction?.id === t.id ? (
                    <input
                      type="number"
                      value={editingTransaction.amount || ""}
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

                {/* Category Field */}
                <td>
                  {editingTransaction?.id === t.id ? (
                    <select
                      className="form-select"
                      value={editingTransaction.category || ""}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          category: e.target.value,
                        })
                      }
                    >
                      <option value="Client Payment">Client Payment</option>
                      <option value="Labor">Labor</option>
                      <option value="Materials">Materials</option>
                      <option value="Miscellaneous">Miscellaneous</option>
                    </select>
                  ) : (
                    t.category || "N/A"
                  )}
                </td>

                {/* Type Field */}
                <td>
                  {editingTransaction?.id === t.id ? (
                    <select
                      className="form-select"
                      value={editingTransaction.type || ""}
                      onChange={(e) =>
                        setEditingTransaction({
                          ...editingTransaction,
                          type: e.target.value,
                        })
                      }
                    >
                      <option value="Cash">Cash</option>
                      <option value="VISA">VISA</option>
                      <option value="Debit">Debit</option>
                      <option value="E-Transfer">E-Transfer</option>
                    </select>
                  ) : (
                    t.type || "N/A"
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
                          title="Edit Transaction"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteTransaction(t)} // Pass the full transaction object
                          title="Delete Transaction"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // --- Progress Calculation ---
  const progress = project?.budget
    ? Math.round(((expenses || 0) / (project.budget || 1)) * 100)
    : 0;

  const cappedProgress = Math.min(progress, 100); // Ensure <= 100

  // --- State for Expanded Card ---
  const [showNotes, setShowNotes] = useState(false); // Control modal visibility

  // --- Render UI ---
  // --- Loading State with Spinner Delay ---
  if (loading || showLoading) return <LoadingSpinner />;
  if (error || !project) return <ErrorState fetchProject={fetchProject} />;

  return (
    <div>
      <Navbar page="projectDashboard" progress={cappedProgress} />

      <div className="container mt-5">
        <div className="row align-items-center mb-4">
          {/* Left Side - Title and Description */}
          <div className="col-md-6">
            <h1>Project Details Page</h1>
            <p>This is some placeholder copy for this page.</p>
          </div>

          {/* Right Side - Button */}
          <div className="col-md-6 d-flex justify-content-end">
            <button
              className="btn btn-outline-primary btn-lg"
              onClick={() => setShowNotes(true)} // Open modal
            >
              Open Notes
            </button>
          </div>
        </div>

        {/* Row for Side-by-Side Layout */}
        <div className="row g-4 mb-2">
          {/* Left Column: Project Details */}
          <div className="col-md-6">
            <ProjectDetailsCard
              project={project}
              handleStatusChange={handleStatusChange}
              transactions={transactions} // <-- Add this line
            />
          </div>

          {/* Right Column: Add Transaction */}
          {!isReadOnly && (
            <div className="col-md-6">
              <div className="global-card">
                {/* Card Header */}
                <div className="card-header d-flex align-items-center justify-content-between">
                  <h5 className="mb-2">Add Transaction</h5>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <form>
                    {/* Row 1: Date Field */}
                    <div className="row mb-4">
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
                    <div className="row g-2 mb-3 align-items-center">
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
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Transactions</h5>

            {/* Filter Buttons */}
            <div className="d-flex gap-2">
              <button
                className="btn btn-sm btn-success"
                onClick={() => handleFilter("in")} // Money In
              >
                Income
              </button>

              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleFilter("out")} // Money Out
              >
                Expense
              </button>

              <button
                className="btn btn-sm btn-secondary"
                onClick={() => handleFilter("all")} // Reset Filter
              >
                All
              </button>
            </div>
          </div>
          <div className="card-body">
            {loading || !project || !Array.isArray(filteredTransactions) ? (
              <p className="text-center text-muted">Loading transactions...</p>
            ) : filteredTransactions.length === 0 ? (
              <p className="text-center text-muted">
                No transactions available.
              </p>
            ) : (
              <>
                {/* Desktop View */}
                <div className="d-none d-md-block">
                  <TransactionsTable
                    transactions={filteredTransactions}
                    editingTransaction={editingTransaction}
                    setEditingTransaction={setEditingTransaction}
                    saveEditTransaction={saveEditTransaction}
                    cancelEditTransaction={cancelEditTransaction}
                    deleteTransaction={deleteTransaction}
                    isReadOnly={isReadOnly}
                    formatCurrency={formatCurrency}
                  />
                </div>

                {/* Mobile View */}
                <div className="d-md-none">
                  {filteredTransactions.map((t) => (
                    <div
                      key={t.id}
                      className={`mobile-card mb-3 p-3 border rounded shadow-sm ${
                        expandedId === t.id ? "expanded" : ""
                      } ${
                        t.category === "Client Payment"
                          ? "transaction-income"
                          : t.category === "Labor"
                            ? "transaction-expense"
                            : t.category === "Materials"
                              ? "transaction-materials"
                              : t.category === "Miscellaneous"
                                ? "transaction-misc"
                                : ""
                      } ${
                        t.type === "Cash"
                          ? "transaction-cash"
                          : t.type === "VISA"
                            ? "transaction-visa"
                            : t.type === "Debit"
                              ? "transaction-debit"
                              : t.type === "E-Transfer"
                                ? "transaction-etransfer"
                                : ""
                      }`}
                    >
                      {/* Collapsed View */}
                      <div
                        className="d-flex align-items-center justify-content-between"
                        onClick={() => toggleExpand(t.id)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="d-flex align-items-center">
                          <i
                            className={`bi ${
                              expandedId === t.id ? "bi-eye-slash" : "bi-eye"
                            } me-2`}
                          ></i>
                          <strong>{t.name || "Unnamed"}</strong>
                        </div>
                        <span className="text-end">
                          {formatCurrency(t.amount)}
                        </span>
                      </div>

                      {/* Expanded View */}
                      {expandedId === t.id && (
                        <div className="mt-3">
                          {/* Date */}
                          <p>
                            <i className="bi bi-calendar3 me-2"></i>
                            <strong>Date:</strong>{" "}
                            {editingTransaction?.id === t.id ? (
                              <input
                                type="date"
                                className="form-control"
                                value={editingTransaction.date || ""}
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
                          </p>

                          {/* Category */}
                          <p>
                            <i className="bi bi-tag-fill me-2"></i>
                            <strong>Category:</strong>{" "}
                            {editingTransaction?.id === t.id ? (
                              <select
                                className="form-select"
                                value={editingTransaction.category || ""}
                                onChange={(e) =>
                                  setEditingTransaction({
                                    ...editingTransaction,
                                    category: e.target.value,
                                  })
                                }
                              >
                                <option value="Client Payment">
                                  Client Payment
                                </option>
                                <option value="Labor">Labor</option>
                                <option value="Materials">Materials</option>
                                <option value="Miscellaneous">
                                  Miscellaneous
                                </option>
                              </select>
                            ) : (
                              t.category || "N/A"
                            )}
                          </p>

                          {/* Type */}
                          <p>
                            <i className="bi bi-credit-card me-2"></i>
                            <strong>Type:</strong>{" "}
                            {editingTransaction?.id === t.id ? (
                              <select
                                className="form-select"
                                value={editingTransaction.type || ""}
                                onChange={(e) =>
                                  setEditingTransaction({
                                    ...editingTransaction,
                                    type: e.target.value,
                                  })
                                }
                              >
                                <option value="Cash">Cash</option>
                                <option value="VISA">VISA</option>
                                <option value="Debit">Debit</option>
                                <option value="E-Transfer">E-Transfer</option>
                              </select>
                            ) : (
                              t.type || "N/A"
                            )}
                          </p>

                          {/* Amount */}
                          <p>
                            <i className="bi bi-currency-dollar me-2"></i>
                            <strong>Amount:</strong>{" "}
                            {editingTransaction?.id === t.id ? (
                              <input
                                type="number"
                                className="form-control"
                                value={editingTransaction.amount || ""}
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
                          </p>

                          {/* Actions */}
                          {!isReadOnly && (
                            <div className="d-flex align-items-center mt-2">
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
                                    <i className="bi bi-pencil-square"></i>
                                  </button>
                                  <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => deleteTransaction(t)} // Pass the full transaction object
                                  >
                                    <i className="bi bi-trash"></i>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
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
                        <span className="ms-2">{daysInProgress ?? 0}</span>
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
      {/* Notes Modal */}
      <NotesModal
        showNotes={showNotes} // Pass modal visibility state
        setShowNotes={setShowNotes} // Pass function to close modal
        projectId={id} // Pass project ID
      />
    </div>
  );
}

export default ProjectDashboard;
