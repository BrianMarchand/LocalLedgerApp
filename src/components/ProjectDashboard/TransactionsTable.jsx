import React, { useState, useEffect } from "react";
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
} from "../../utils/toastNotifications";

const TransactionsTable = ({ transactions, projectId, fetchTransactions }) => {
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [transactionForm, setTransactionForm] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    amount: "",
    category: "",
    type: "Cash",
  });

  useEffect(() => {
    setLocalTransactions(transactions);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [transactions]);

  const formatDateForInput = (timestamp) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp);
    return isNaN(date.getTime())
      ? "Invalid Date"
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(parseFloat(amount || 0));

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setTransactionForm((prev) => ({ ...prev, [name]: value }));
  };

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

  const handleSave = async () => {
    if (
      !transactionForm.description ||
      !transactionForm.amount ||
      !transactionForm.category
    ) {
      toastError("All fields are required.");
      return;
    }

    try {
      const newTransaction = {
        ...transactionForm,
        date: Timestamp.fromDate(new Date(transactionForm.date)),
      };

      await addDoc(
        collection(db, `projects/${projectId}/transactions`),
        newTransaction,
      );
      toastSuccess("Transaction added!");
      setIsAddingTransaction(false);
      resetForm();
      fetchTransactions();
    } catch (error) {
      console.error("Error adding transaction:", error);
      toastError("Failed to add transaction.");
    }
  };

  const handleSaveEdit = async () => {
    try {
      await updateDoc(
        doc(db, `projects/${projectId}/transactions`, editingTransaction.id),
        {
          ...transactionForm,
          date: Timestamp.fromDate(new Date(transactionForm.date)),
        },
      );
      toastSuccess("Transaction updated!");
      setEditingTransaction(null);
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction:", error);
      toastError("Failed to update transaction.");
    }
  };

  const handleDelete = async (transactionId) => {
    try {
      await deleteDoc(
        doc(db, `projects/${projectId}/transactions`, transactionId),
      );
      toastSuccess("Transaction deleted!");
      fetchTransactions();
    } catch (error) {
      console.error("Error deleting transaction:", error);
      toastError("Failed to delete transaction.");
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      date: formatDateForInput(transaction.date),
      description: transaction.description,
      amount: transaction.amount,
      category: transaction.category,
      type: transaction.type,
    });
  };

  return (
    <div className="global-card">
      <div className="transactions-container">
        {isMobile ? (
          <>
            {/* Add New Transaction Card */}
            <div className="transaction-card">
              <div className="transaction-card-header">
                <div className="transaction-header-left">
                  <span>Add New Transaction</span>
                </div>
                <i
                  className={`bi ${isAddingTransaction ? "bi-dash-circle-fill" : "bi-plus-circle-fill"} expand-icon`}
                  onClick={() => setIsAddingTransaction(!isAddingTransaction)}
                ></i>
              </div>
              {isAddingTransaction && (
                <div className="transaction-card-body">
                  <input
                    type="date"
                    name="date"
                    className="form-control"
                    value={transactionForm.date}
                    onChange={handleInputChange}
                  />
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="Enter description"
                    value={transactionForm.description}
                    onChange={handleInputChange}
                  />
                  <input
                    type="number"
                    name="amount"
                    className="form-control"
                    placeholder="Enter amount"
                    value={transactionForm.amount}
                    onChange={handleInputChange}
                  />
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
                  <button
                    className="btn btn-success btn-sm mt-2"
                    onClick={handleSave}
                  >
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Transactions List */}
            {localTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`transaction-card ${index % 2 === 0 ? "transaction-card-alt" : ""}`}
              >
                <div className="transaction-card-header">
                  <div className="transaction-header-left">
                    <span className="transaction-date">
                      {formatDate(transaction.date)}
                    </span>
                    <span className="divider">|</span>
                    <span className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="divider">|</span>
                    <span className="transaction-category">
                      {transaction.category}
                    </span>
                    <span className="divider">|</span>
                    <span className="transaction-description">
                      {transaction.description}
                    </span>
                  </div>
                  <i
                    className={`bi ${expandedTransaction === transaction.id ? "bi-eye-slash" : "bi-eye"} expand-icon`}
                    onClick={() =>
                      setExpandedTransaction(
                        expandedTransaction === transaction.id
                          ? null
                          : transaction.id,
                      )
                    }
                  ></i>
                </div>
                {expandedTransaction === transaction.id && (
                  <div className="transaction-card-body">
                    {editingTransaction?.id === transaction.id ? (
                      <>
                        <input
                          type="date"
                          name="date"
                          className="form-control"
                          value={transactionForm.date}
                          onChange={handleInputChange}
                        />
                        <input
                          type="text"
                          name="description"
                          className="form-control"
                          value={transactionForm.description}
                          onChange={handleInputChange}
                        />
                        <input
                          type="number"
                          name="amount"
                          className="form-control"
                          value={transactionForm.amount}
                          onChange={handleInputChange}
                        />
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
                        <button
                          className="btn btn-success btn-sm me-2"
                          onClick={handleSaveEdit}
                        >
                          <i className="bi bi-check"></i>
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingTransaction(null)}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </>
                    ) : (
                      <>
                        <p>
                          <strong>Category:</strong> {transaction.category}
                        </p>
                        <p>
                          <strong>Description:</strong>{" "}
                          {transaction.description}
                        </p>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => handleEdit(transaction)}
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </>
        ) : (
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
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetForm}
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Transactions Rows */}
            {localTransactions.map((transaction) =>
              editingTransaction?.id === transaction.id ? (
                <div
                  key={transaction.id}
                  className="transaction-row editing-row"
                >
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
                  <div className="transaction-cell">
                    {transaction.description}
                  </div>
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
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;
