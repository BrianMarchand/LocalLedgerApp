// File: src/pages/TransactionSummary.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collectionGroup,
  getDocs,
  collection,
  query,
  orderBy,
  limit,
  addDoc,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@config";
import { toastError, toastSuccess } from "../../utils/toastNotifications";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "../../styles/components/Dashboard.css";

// Modals for quick actions
import AddProjectModal from "../../components/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import CustomerModal from "../../components/CustomerModal";

// Import centralized customer API functions for the CustomerModal
import {
  saveNewCustomer,
  updateExistingCustomer,
} from "../../../firebase/customerAPI";

// Import the shared Layout and ActivityTicker components
import Layout from "../../components/Layout";
import { formatFirestoreTimestamp } from "../../utils/formatUtils";
import { useProjects } from "../../context/ProjectsContext";

const TransactionSummary = () => {
  // State for transactions & loading
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Modal State Variables ---
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // Get projects from the ProjectsContext
  const { projects } = useProjects();

  // Fetch all transactions (across projects) using a collectionGroup query
  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(
          collectionGroup(db, "transactions")
        );
        const transactionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Extract the projectId from the parent document (if available)
          projectId: doc.ref.parent.parent
            ? doc.ref.parent.parent.id
            : "Unknown",
        }));
        setTransactions(transactionsList);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        toastError("Failed to fetch transactions.");
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  // Group transactions by projectId
  const groupedTransactions = useMemo(() => {
    const groups = {};
    transactions.forEach((txn) => {
      const key = txn.projectId || "Unknown";
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(txn);
    });
    return groups;
  }, [transactions]);

  // Map project IDs to project names for display
  const projectMapping = useMemo(() => {
    const mapping = {};
    if (projects && projects.length > 0) {
      projects.forEach((proj) => {
        mapping[proj.id] = proj.name || proj.projectName || "Unnamed Project";
      });
    }
    return mapping;
  }, [projects]);

  // Handler for saving a new transaction via the TransactionModal
  const handleTransactionSave = async (newTransaction) => {
    if (!newTransaction.projectId) {
      toastError("Please select a project first.");
      return;
    }
    try {
      const transactionsRef = collection(
        db,
        `projects/${newTransaction.projectId}/transactions`
      );
      await addDoc(transactionsRef, {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: new Date(),
      });
      toastSuccess("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      toastError("Failed to add transaction.");
    }
  };

  return (
    <Layout
      pageTitle="Transaction Summary"
      onAddProject={() => setShowProjectModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
        <div className="dashboard-header mb-4 d-flex justify-content-between align-items-center">
          <h1 className="dashboard-title">Transaction Summary</h1>

          <button
            className="btn btn-primary"
            onClick={() => setShowTransactionModal(true)}
          >
            <i className="bi bi-plus-lg"></i> Add New Transaction
          </button>
        </div>
        {loading ? (
          <p>Loading transactions...</p>
        ) : Object.keys(groupedTransactions).length > 0 ? (
          Object.keys(groupedTransactions).map((projectId) => (
            <div key={projectId} className="mb-5">
              <h3>
                {projectMapping[projectId]
                  ? projectMapping[projectId]
                  : `Project: ${projectId}`}
              </h3>
              <table className="table table-striped">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Category</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedTransactions[projectId].map((txn) => (
                    <tr key={txn.id}>
                      <td>{formatFirestoreTimestamp(txn.date)}</td>
                      <td>{txn.description}</td>
                      <td>{txn.amount}</td>
                      <td>{txn.category}</td>
                      <td>{txn.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))
        ) : (
          <p className="text-muted">No transactions found.</p>
        )}
      </div>

      {/* Quick Action Modals */}
      <AddProjectModal
        show={showProjectModal}
        handleClose={() => setShowProjectModal(false)}
      />
      <TransactionModal
        show={showTransactionModal}
        handleClose={() => setShowTransactionModal(false)}
        handleSave={handleTransactionSave}
        projects={projects}
      />
      <CustomerModal
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={saveNewCustomer}
        handleEditCustomer={updateExistingCustomer}
      />
    </Layout>
  );
};

export default TransactionSummary;
