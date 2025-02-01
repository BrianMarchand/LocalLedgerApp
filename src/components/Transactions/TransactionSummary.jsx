// File: src/pages/TransactionSummary.jsx

import React, { useEffect, useState, useMemo } from "react";
import { collectionGroup, getDocs } from "firebase/firestore";
import { db } from "@config";
import { toastError } from "../../utils/toastNotifications";
import Navbar from "../../components/Navbar";
import { useProjects } from "../../context/ProjectsContext"; // Assumes you have a projects context
import { formatFirestoreTimestamp } from "../../utils/formatUtils";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";

const TransactionSummary = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get the list of projects (assumes your useProjects context returns an array of projects)
  const { projects } = useProjects();

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        // Query all transactions across projects using collectionGroup
        const querySnapshot = await getDocs(collectionGroup(db, "transactions"));
        const transactionsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Extract projectId from the document reference
          projectId: doc.ref.parent.parent ? doc.ref.parent.parent.id : "Unknown",
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

  // Create a mapping from project ID to project name for display purposes.
  // If a project name is not available, we can fallback to showing the ID.
  const projectMapping = useMemo(() => {
    const mapping = {};
    if (projects && projects.length > 0) {
      projects.forEach((proj) => {
        mapping[proj.id] = proj.name;
      });
    }
    return mapping;
  }, [projects]);

  return (
    <div>
      <Navbar page="transaction-summary" />
      <div className="container mt-5">
        <h1 className="text-center mb-4">Transaction Summary</h1>
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
        {/* Optional: Add a link to refresh or go back */}
        <div className="text-center mt-4">
          <Link to="/dashboard" className="btn btn-secondary">
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TransactionSummary;