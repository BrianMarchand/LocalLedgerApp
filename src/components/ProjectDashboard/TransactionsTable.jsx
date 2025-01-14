// -- Page: TransactionsTable.jsx --

import React, { useState } from "react";
import { useEffect } from "react"; // Ensure useEffect is imported
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@config";
import "../../styles/components/transactionTable.css";
import {
  toastSuccess,
  toastWarning,
  toastError,
} from "../../utils/toastNotifications"; // Import toast helpers

const TransactionsTable = ({ transactions, projectId, fetchTransactions }) => {
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "",
    type: "Cash",
  });

  // Sync localTransactions with prop whenever `transactions` changes
  useEffect(() => {
    console.log(
      "Syncing localTransactions with parent transactions:",
      transactions,
    );
    setLocalTransactions(transactions); // Sync local state with prop
  }, [transactions]);

  /**
   * Format a Firestore timestamp into yyyy-MM-dd for <input type="date">
   */
  const formatDateForInput = (timestamp) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp); // Handle Firestore Timestamp or Date
    if (isNaN(date.getTime())) return ""; // Handle invalid dates
    return date.toISOString().split("T")[0]; // Format as yyyy-MM-dd
  };

  /**
   * Format a Firestore timestamp into a readable date string
   */
  const formatDate = (timestamp) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp); // Handle Firestore Timestamp or Date
    if (isNaN(date.getTime())) return "Invalid Date"; // Fallback for invalid dates
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  };

  /**
   * Format an amount into currency
   */
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount || 0));
  };

  /**
   * Handle form input changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

  /**
   * Reset the form and cancel adding or editing
   */
  const resetForm = () => {
    setEditingTransaction(null);
    setTransactionForm({
      date: new Date().toISOString().split("T")[0],
      description: "",
      amount: "",
      category: "",
      type: "Cash",
    });
  };

  /**
   * Save a new transaction to Firestore
   */
  const handleSave = async () => {
    if (
      !transactionForm.description ||
      !transactionForm.amount ||
      !transactionForm.category
    ) {
      alert("All fields are required.");
      return;
    }

    try {
      const newTransaction = {
        ...transactionForm,
        date: Timestamp.fromDate(new Date(transactionForm.date)),
        order: transactions.length, // Ensure new transaction is ordered correctly
      };

      const transactionsRef = collection(
        db,
        `projects/${projectId}/transactions`,
      );
      await addDoc(transactionsRef, newTransaction);
      console.log("New transaction added:", newTransaction);

      // Trigger fetchTransactions to refresh parent state
      await fetchTransactions();
      resetForm();
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  /**
   * Save edits to an existing transaction
   */
  const handleSaveEdit = async () => {
    if (
      !transactionForm.date ||
      isNaN(new Date(transactionForm.date).getTime())
    ) {
      alert("Invalid date. Please select a valid date.");
      return;
    }

    try {
      const transactionDocRef = doc(
        db,
        `projects/${projectId}/transactions`,
        editingTransaction.id,
      );
      await updateDoc(transactionDocRef, {
        ...transactionForm,
        date: Timestamp.fromDate(new Date(transactionForm.date)), // Ensure Firestore Timestamp format
      });
      fetchTransactions(); // Refresh data
      resetForm();
    } catch (error) {
      console.error("Error saving transaction edit:", error);
    }
  };

  /**
   * Delete a transaction from Firestore
   */
  const handleDelete = async (transactionId) => {
    try {
      const transactionDocRef = doc(
        db,
        `projects/${projectId}/transactions`,
        transactionId,
      );

      // Fetch the transaction before deleting
      const transactionSnap = await getDoc(transactionDocRef);
      const transaction = transactionSnap.data();

      await deleteDoc(transactionDocRef);

      // If the transaction was a deposit, check the status
      if (
        transaction?.category?.toLowerCase() === "client payment" &&
        transaction?.description?.toLowerCase().includes("deposit")
      ) {
        const remainingTransactions = transactions.filter(
          (t) => t.id !== transactionId,
        );

        const hasDeposit = remainingTransactions.some(
          (t) =>
            t.category?.toLowerCase() === "client payment" &&
            t.description?.toLowerCase().includes("deposit"),
        );

        if (!hasDeposit) {
          const projectRef = doc(db, "projects", projectId);
          await updateDoc(projectRef, {
            status: "new",
            statusDate: new Date(),
          });

          // Show warning toast when deposit transaction is deleted
          toastWarning(
            "Deposit transaction deleted. Project reverted to 'New' status.",
          );
        }
      }

      // Show success toast after deletion
      toastSuccess("Transaction deleted successfully!");

      fetchTransactions(); // Refresh transactions
    } catch (error) {
      console.error("Error deleting transaction:", error);

      // Show error toast if deletion fails
      toastError("Failed to delete transaction. Please try again.");
    }
  };

  /**
   * Start editing a transaction
   */
  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      date: formatDateForInput(transaction.date), // Ensure correct date format
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
    });
  };

  return (
    <div className="global-card">
      <div className="transactions-container">
        {/* Header */}
        <div className="transactions-header">
          <div className="transaction-cell">Date</div>
          <div className="transaction-cell">Description</div>
          <div className="transaction-cell">Amount</div>
          <div className="transaction-cell">Category</div>
          <div className="transaction-cell">Type</div>
          <div className="transaction-cell">Actions</div>
        </div>

        {/* Add New Transaction Row */}
        <div className="transaction-row">
          <div className="transaction-cell">
            <input
              type="date"
              name="date"
              className="form-control"
              value={transactionForm.date}
              onChange={handleInputChange}
            />
          </div>
          <div className="transaction-cell">
            <input
              type="text"
              name="description"
              className="form-control"
              placeholder="Enter description"
              value={transactionForm.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="transaction-cell">
            <input
              type="number"
              name="amount"
              className="form-control"
              placeholder="Enter amount"
              value={transactionForm.amount}
              onChange={handleInputChange}
            />
          </div>
          <div className="transaction-cell">
            <select
              name="category"
              className="form-select"
              value={transactionForm.category}
              onChange={handleInputChange}
            >
              <option value="" disabled>
                Select Category
              </option>
              <option value="Client Payment">Client Payment</option>
              <option value="Labour">Labour</option>
              <option value="Materials">Materials</option>
              <option value="Miscellaneous">Miscellaneous</option>
            </select>
          </div>
          <div className="transaction-cell">
            <select
              name="type"
              className="form-select"
              value={transactionForm.type}
              onChange={handleInputChange}
            >
              <option value="Cash">Cash</option>
              <option value="VISA">VISA</option>
              <option value="Debit">Debit</option>
              <option value="E-Transfer">E-Transfer</option>
            </select>
          </div>
          <div className="transaction-cell">
            <button
              className="btn btn-success btn-sm me-2"
              onClick={handleSave}
            >
              Add
            </button>
            <button className="btn btn-secondary btn-sm" onClick={resetForm}>
              Clear
            </button>
          </div>
        </div>

        {/* Transactions Rows */}
        {localTransactions.map((transaction) =>
          editingTransaction?.id === transaction.id ? (
            <div key={transaction.id} className="transaction-row editing-row">
              {/* Inline Edit Row */}
              <div className="transaction-cell">
                <input
                  type="date"
                  name="date"
                  className="form-control"
                  value={transactionForm.date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="transaction-cell">
                <input
                  type="text"
                  name="description"
                  className="form-control"
                  value={transactionForm.description}
                  onChange={handleInputChange}
                />
              </div>
              <div className="transaction-cell">
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  value={transactionForm.amount}
                  onChange={handleInputChange}
                />
              </div>
              <div className="transaction-cell">
                <select
                  name="category"
                  className="form-select"
                  value={transactionForm.category}
                  onChange={handleInputChange}
                >
                  <option value="" disabled>
                    Select Category
                  </option>
                  <option value="Client Payment">Client Payment</option>
                  <option value="Labour">Labour</option>
                  <option value="Materials">Materials</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
              </div>
              <div className="transaction-cell">
                <select
                  name="type"
                  className="form-select"
                  value={transactionForm.type}
                  onChange={handleInputChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="Debit">Debit</option>
                  <option value="E-Transfer">E-Transfer</option>
                </select>
              </div>
              <div className="transaction-cell">
                <button
                  className="btn btn-success btn-sm me-2"
                  onClick={handleSaveEdit}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetForm}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div key={transaction.id} className="transaction-row">
              {/* Read-Only Row */}
              <div className="transaction-cell">
                {formatDate(transaction.date)}
              </div>
              <div className="transaction-cell">{transaction.description}</div>
              <div className="transaction-cell">
                {formatCurrency(transaction.amount)}
              </div>
              <div className="transaction-cell">{transaction.category}</div>
              <div className="transaction-cell">{transaction.type}</div>
              <div className="transaction-cell">
                <button
                  className="btn btn-warning btn-sm me-2"
                  onClick={() => handleEdit(transaction)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(transaction.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
