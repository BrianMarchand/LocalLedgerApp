// --- React Imports ---
import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../firebaseConfig"; // Adjust the path based on your structure

// --- Transactions Table Component ---
const TransactionsTable = ({ transactions, projectId, fetchTransactions }) => {
  // --- State for Adding New Transaction ---
  const [isAdding, setIsAdding] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "Cash",
  });

  // --- Handle Input Change ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  // --- Save New Transaction ---
  const handleSave = async () => {
    try {
      const transactionsRef = collection(
        db,
        `projects/${projectId}/transactions`,
      );
      await addDoc(transactionsRef, newTransaction);

      // Refresh transactions after adding
      fetchTransactions();

      // Reset form and exit add mode
      setIsAdding(false);
      setNewTransaction({
        date: "",
        description: "",
        amount: "",
        category: "",
        type: "Cash",
      });
    } catch (error) {
      console.error("Error adding transaction:", error);
    }
  };

  // --- Cancel Adding Transaction ---
  const handleCancel = () => {
    setIsAdding(false);
    setNewTransaction({
      date: "",
      description: "",
      amount: "",
      category: "",
      type: "Cash",
    });
  };

  return (
    <div className="global-card">
      <table className="table table-glass">
        <thead>
          <tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
            <th>Category</th>
            <th>Type</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* --- Add Transaction Row --- */}
          {isAdding ? (
            <tr className="editing-row">
              <td>
                <input
                  type="date"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleInputChange}
                />
              </td>
              <td>
                <input
                  type="text"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                />
              </td>
              <td>
                <input
                  type="number"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                />
              </td>
              <td>
                <input
                  type="text"
                  name="category"
                  value={newTransaction.category}
                  onChange={handleInputChange}
                />
              </td>
              <td>
                <select
                  name="type"
                  value={newTransaction.type}
                  onChange={handleInputChange}
                >
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="Debit">Debit</option>
                  <option value="E-Transfer">E-Transfer</option>
                </select>
              </td>
              <td>
                <button className="btn btn-success btn-sm" onClick={handleSave}>
                  Save
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={handleCancel}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ) : (
            <tr onClick={() => setIsAdding(true)} className="editing-cell">
              <td
                colSpan="6"
                style={{ textAlign: "center", cursor: "pointer" }}
              >
                + Add New Transaction
              </td>
            </tr>
          )}

          {/* --- Existing Transactions --- */}
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.date}</td>
              <td>{transaction.description}</td>
              <td>${transaction.amount}</td>
              <td>{transaction.category}</td>
              <td>{transaction.type}</td>
              <td>
                <button className="btn btn-warning btn-sm">Edit</button>
                <button className="btn btn-danger btn-sm">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;
