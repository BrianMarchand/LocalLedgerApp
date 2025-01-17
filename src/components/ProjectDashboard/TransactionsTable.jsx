import React, { useState, useEffect } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
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

  // Separate state for adding new transactions
  const [addTransactionForm, setAddTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
  });

  // Separate state for editing transactions
  const [editTransactionForm, setEditTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
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

  const handleAddTransactionChange = (e) => {
    setAddTransactionForm({
      ...addTransactionForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleEditTransactionChange = (e) => {
    setEditTransactionForm({
      ...editTransactionForm,
      [e.target.name]: e.target.value,
    });
  };

  const resetForm = () => {
    setEditingTransaction(null);
    setAddTransactionForm({
      date: "",
      description: "",
      amount: "",
      category: "",
      type: "",
    });
  };

  const handleSave = async () => {
    if (
      !addTransactionForm.description ||
      !addTransactionForm.amount ||
      !addTransactionForm.category
    ) {
      toastError("All fields are required.");
      return;
    }

    try {
      const newTransaction = {
        ...addTransactionForm,
        date: Timestamp.fromDate(new Date(addTransactionForm.date)),
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
          ...editTransactionForm,
          date: Timestamp.fromDate(new Date(editTransactionForm.date)),
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
    setEditTransactionForm({
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
                  {/* Row 1: Date & Amount */}
                  <div className="input-group">
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={addTransactionForm.date}
                      onChange={(e) =>
                        setAddTransactionForm({
                          ...addTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      placeholder="$ Enter amount"
                      value={addTransactionForm.amount}
                      onChange={(e) =>
                        setAddTransactionForm({
                          ...addTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                  </div>

                  {/* Row 2: Description (Full Width) */}
                  <input
                    type="text"
                    name="description"
                    className="form-control"
                    placeholder="Enter description"
                    value={addTransactionForm.description}
                    onChange={(e) =>
                      setAddTransactionForm({
                        ...addTransactionForm,
                        [e.target.name]: e.target.value,
                      })
                    }
                  />

                  {/* Row 3: Category & Type */}
                  <div className="input-group">
                    <select
                      name="category"
                      className="form-select"
                      value={addTransactionForm.category}
                      onChange={(e) =>
                        setAddTransactionForm({
                          ...addTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
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
                      value={addTransactionForm.type}
                      onChange={(e) =>
                        setAddTransactionForm({
                          ...addTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Select Type
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="VISA">VISA</option>
                      <option value="Debit">Debit</option>
                      <option value="E-Transfer">E-Transfer</option>
                    </select>
                  </div>

                  {/* Save & Cancel Buttons */}
                  <div className="mobile-action-buttons">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSave}
                      title="Save"
                    >
                      <i className="bi bi-check-lg"></i> {/* Save Icon */}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={resetForm}
                      title="Cancel"
                    >
                      <i className="bi bi-x-lg"></i> {/* Cancel Icon */}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Transactions List */}
            {localTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`transaction-card ${index % 2 === 0 ? "transaction-card-alt" : ""}`}
              >
                {/* Collapsed View - Only shows Date | Amount | Truncated Description */}
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
                    <span className="transaction-description">
                      {transaction.description.length > 20
                        ? `${transaction.description.substring(0, 20)}...`
                        : transaction.description}
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

                {/* Expanded View - Shows Full Details */}
                {expandedTransaction === transaction.id && (
                  <div className="transaction-card-body">
                    {editingTransaction?.id === transaction.id ? (
                      <>
                        <input
                          type="date"
                          name="date"
                          className="form-control"
                          value={editTransactionForm.date}
                          onChange={(e) =>
                            setEditTransactionForm({
                              ...editTransactionForm,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />
                        <input
                          type="text"
                          name="description"
                          className="form-control"
                          value={editTransactionForm.description}
                          onChange={(e) =>
                            setEditTransactionForm({
                              ...editTransactionForm,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />
                        <input
                          type="number"
                          name="amount"
                          className="form-control"
                          value={editTransactionForm.amount}
                          onChange={(e) =>
                            setEditTransactionForm({
                              ...editTransactionForm,
                              [e.target.name]: e.target.value,
                            })
                          }
                        />
                        <select
                          name="category"
                          className="form-select"
                          value={editTransactionForm.category}
                          onChange={(e) =>
                            setEditTransactionForm({
                              ...editTransactionForm,
                              [e.target.name]: e.target.value,
                            })
                          }
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
                          value={editTransactionForm.type}
                          onChange={(e) =>
                            setEditTransactionForm({
                              ...editTransactionForm,
                              [e.target.name]: e.target.value,
                            })
                          }
                        >
                          <option value="" disabled>
                            Select Type
                          </option>
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
                  value={addTransactionForm.date}
                  onChange={(e) =>
                    setAddTransactionForm({
                      ...addTransactionForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="transaction-cell">
                <input
                  type="text"
                  name="description"
                  className="form-control"
                  placeholder="Enter description"
                  value={addTransactionForm.description}
                  onChange={(e) =>
                    setAddTransactionForm({
                      ...addTransactionForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="transaction-cell">
                <input
                  type="number"
                  name="amount"
                  className="form-control"
                  placeholder="Enter amount"
                  value={addTransactionForm.amount}
                  onChange={(e) =>
                    setAddTransactionForm({
                      ...addTransactionForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                />
              </div>
              <div className="transaction-cell">
                <select
                  name="category"
                  className="form-select"
                  value={addTransactionForm.category}
                  onChange={(e) =>
                    setAddTransactionForm({
                      ...addTransactionForm,
                      [e.target.name]: e.target.value,
                    })
                  }
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
                  value={addTransactionForm.type}
                  onChange={(e) =>
                    setAddTransactionForm({
                      ...addTransactionForm,
                      [e.target.name]: e.target.value,
                    })
                  }
                >
                  <option value="" disabled>
                    Select Type
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="Debit">Debit</option>
                  <option value="E-Transfer">E-Transfer</option>
                </select>
              </div>
              <div className="transaction-cell">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSave}
                  title="Add Transaction"
                >
                  <i className="bi bi-plus-lg"></i> {/* Add Icon */}
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetForm}
                  title="Clear Form"
                >
                  <i className="bi bi-x-lg"></i> {/* Clear Icon */}
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
                      value={editTransactionForm.date}
                      onChange={(e) =>
                        setEditTransactionForm({
                          ...editTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      value={editTransactionForm.description}
                      onChange={(e) =>
                        setEditTransactionForm({
                          ...editTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      value={editTransactionForm.amount}
                      onChange={(e) =>
                        setEditTransactionForm({
                          ...editTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="transaction-cell">
                    <select
                      name="category"
                      className="form-select"
                      value={editTransactionForm.category}
                      onChange={(e) =>
                        setEditTransactionForm({
                          ...editTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
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
                      value={editTransactionForm.type}
                      onChange={(e) =>
                        setEditTransactionForm({
                          ...editTransactionForm,
                          [e.target.name]: e.target.value,
                        })
                      }
                    >
                      <option value="" disabled>
                        Select Type
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="VISA">VISA</option>
                      <option value="Debit">Debit</option>
                      <option value="E-Transfer">E-Transfer</option>
                    </select>
                  </div>
                  <div className="transaction-cell">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSaveEdit}
                      title="Save Changes"
                    >
                      <i className="bi bi-check-lg"></i> {/* Save Icon */}
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingTransaction(null)}
                      title="Cancel Edit"
                    >
                      <i className="bi bi-x-lg"></i> {/* Cancel Icon */}
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
                    <div className="transaction-cell action-buttons">
                      <button
                        className="btn btn-warning btn-sm"
                        onClick={() => handleEdit(transaction)}
                      >
                        <i className="bi bi-pencil-square"></i>{" "}
                        {/* Edit Icon */}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <i className="bi bi-trash"></i> {/* Delete Icon */}
                      </button>
                    </div>
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
