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
  const [filterCategory, setFilterCategory] = useState("All"); // 🔹 New State for Filtering
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isAddingFocused, setIsAddingFocused] = useState(false);
  const [addTransactionErrors, setAddTransactionErrors] = useState({});

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

  // 🔹 Function to filter transactions
  const filteredTransactions =
    filterCategory === "All"
      ? localTransactions
      : localTransactions.filter(
          (transaction) => transaction.category === filterCategory
        );

  // 🔹 Function to handle sorting
  const handleSort = (column) => {
    if (sortColumn === column) {
      // If already sorting by this column, toggle direction
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Otherwise, sort by the new column in ascending order
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // 🔹 Function to handle sorting
  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortColumn) return 0; // No sorting applied

    let valueA = a[sortColumn];
    let valueB = b[sortColumn];

    if (sortColumn === "amount") {
      valueA = parseFloat(valueA) || 0;
      valueB = parseFloat(valueB) || 0;
    } else if (sortColumn === "date") {
      // ✅ Convert Firestore timestamp properly
      valueA = a.date?.seconds
        ? new Date(a.date.seconds * 1000)
        : new Date(a.date);
      valueB = b.date?.seconds
        ? new Date(b.date.seconds * 1000)
        : new Date(b.date);
    } else {
      valueA = valueA?.toString().toLowerCase() || "";
      valueB = valueB?.toString().toLowerCase() || "";
    }

    return sortDirection === "asc"
      ? valueA > valueB
        ? 1
        : -1
      : valueA < valueB
      ? 1
      : -1;
  });

  useEffect(() => {
    setLocalTransactions(transactions); // ✅ Keep transactions updated when the prop changes
  }, [transactions]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatDateForInput = (timestamp) => {
    const date = new Date(timestamp?.seconds * 1000 || timestamp);
    return isNaN(date.getTime()) ? "" : date.toISOString().split("T")[0];
  };

  const formatDate = (timestamp) => {
    let date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);

    // Ensure proper timezone conversion
    const localDate = new Date(
      date.toLocaleString("en-US", { timeZone: "UTC" })
    );

    return isNaN(localDate.getTime())
      ? "Invalid Date"
      : localDate.toLocaleDateString("en-US", {
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

  // Updated change handler: update form value and clear error for that field if it exists
  const handleAddTransactionChange = (e) => {
    const { name, value } = e.target;
    setAddTransactionForm((prev) => ({ ...prev, [name]: value }));
    if (addTransactionErrors[name]) {
      const newErrors = { ...addTransactionErrors };
      delete newErrors[name];
      setAddTransactionErrors(newErrors);
    }
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
    // Reset previous errors
    const errors = {};

    // Validate each field
    if (!addTransactionForm.date) {
      errors.date = " ";
    } else {
      const localDate = new Date(addTransactionForm.date);
      if (isNaN(localDate.getTime())) {
        errors.date = " ";
      }
    }
    if (!addTransactionForm.description) {
      errors.description = " ";
    }
    if (!addTransactionForm.amount) {
      errors.amount = " ";
    }
    if (!addTransactionForm.category) {
      errors.category = " ";
    }
    if (!addTransactionForm.type) {
      errors.type = " ";
    }

    // If there are errors, update state and abort saving
    if (Object.keys(errors).length > 0) {
      setAddTransactionErrors(errors);
      return;
    } else {
      setAddTransactionErrors({});
    }

    // Proceed with saving if no errors exist
    const localDate = new Date(addTransactionForm.date);
    localDate.setHours(0, 0, 0, 0); // Set time to midnight to avoid timezone issues
    const newTransaction = {
      ...addTransactionForm,
      date: Timestamp.fromDate(localDate),
    };

    try {
      await addDoc(
        collection(db, `projects/${projectId}/transactions`),
        newTransaction
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
        }
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
        doc(db, `projects/${projectId}/transactions`, transactionId)
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
            {/* Mobile Add New Transaction Card */}
            <div className="transaction-card">
              <div className="transaction-card-header">
                <div className="transaction-header-left">
                  <span>Add New Transaction</span>
                </div>
                <i
                  className={`bi ${
                    isAddingTransaction
                      ? "bi-dash-circle-fill"
                      : "bi-plus-circle-fill"
                  } expand-icon`}
                  onClick={() => setIsAddingTransaction(!isAddingTransaction)}
                ></i>
              </div>
              {isAddingTransaction && (
                <div className="transaction-card-body">
                  {/* Debug block to show errors object (remove or comment out in production) */}
                  {Object.keys(addTransactionErrors).length > 0 && (
                    <pre style={{ color: "red", marginBottom: "0.5rem" }}>
                      {JSON.stringify(addTransactionErrors, null, 2)}
                    </pre>
                  )}
                  {/* Row 1: Date & Amount */}
                  <div className="input-group">
                    <div className="w-50">
                      <input
                        type="date"
                        name="date"
                        className={`form-control ${
                          addTransactionErrors.date ? "is-invalid" : ""
                        }`}
                        value={addTransactionForm.date}
                        onChange={handleAddTransactionChange}
                      />
                      {addTransactionErrors.date && (
                        <div className="error-message">
                          {addTransactionErrors.date}
                        </div>
                      )}
                    </div>
                    <div className="w-50">
                      <input
                        type="number"
                        name="amount"
                        className={`form-control ${
                          addTransactionErrors.amount ? "is-invalid" : ""
                        }`}
                        placeholder="$ Enter amount"
                        value={addTransactionForm.amount}
                        onFocus={(e) => (e.target.placeholder = "")}
                        onBlur={(e) => {
                          if (!e.target.value)
                            e.target.placeholder = "$ Enter amount";
                        }}
                        onChange={handleAddTransactionChange}
                      />
                      {addTransactionErrors.amount && (
                        <div className="error-message">
                          {addTransactionErrors.amount}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Description */}
                  <div className="mt-2">
                    <input
                      type="text"
                      name="description"
                      className={`form-control ${
                        addTransactionErrors.description ? "is-invalid" : ""
                      }`}
                      placeholder="Enter description"
                      value={addTransactionForm.description}
                      onFocus={(e) => (e.target.placeholder = "")}
                      onBlur={(e) => {
                        if (!e.target.value)
                          e.target.placeholder = "Enter description";
                      }}
                      onChange={handleAddTransactionChange}
                    />
                    {addTransactionErrors.description && (
                      <div className="error-message">
                        {addTransactionErrors.description}
                      </div>
                    )}
                  </div>

                  {/* Row 3: Category & Type */}
                  <div className="input-group mt-2">
                    <div className="w-50">
                      <select
                        name="category"
                        className={`form-select ${
                          addTransactionErrors.category ? "is-invalid" : ""
                        }`}
                        value={addTransactionForm.category}
                        onChange={handleAddTransactionChange}
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        <option value="Client Payment">Client Payment</option>
                        <option value="Labour">Labour</option>
                        <option value="Materials">Materials</option>
                        <option value="Miscellaneous">
                          Miscellaneous
                        </option>
                      </select>
                      {addTransactionErrors.category && (
                        <div className="error-message">
                          {addTransactionErrors.category}
                        </div>
                      )}
                    </div>
                    <div className="w-50">
                      <select
                        name="type"
                        className={`form-select ${
                          addTransactionErrors.type ? "is-invalid" : ""
                        }`}
                        value={addTransactionForm.type}
                        onChange={handleAddTransactionChange}
                      >
                        <option value="" disabled>
                          Select Type
                        </option>
                        <option value="Cash">Cash</option>
                        <option value="VISA">VISA</option>
                        <option value="Debit">Debit</option>
                        <option value="E-Transfer">E-Transfer</option>
                      </select>
                      {addTransactionErrors.type && (
                        <div className="error-message">
                          {addTransactionErrors.type}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Save & Cancel Buttons */}
                  <div className="mobile-action-buttons mt-2">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSave}
                      title="Save Transaction"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={resetForm}
                      title="Clear Form"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Transactions List */}
            {localTransactions.map((transaction, index) => (
              <div
                key={transaction.id}
                className={`transaction-card ${
                  index % 2 === 0 ? "transaction-card-alt" : ""
                }`}
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
                    className={`bi ${
                      expandedTransaction === transaction.id
                        ? "bi-eye-slash"
                        : "bi-eye"
                    } expand-icon`}
                    onClick={() =>
                      setExpandedTransaction(
                        expandedTransaction === transaction.id
                          ? null
                          : transaction.id
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
                          <option value="Client Payment">
                            Client Payment
                          </option>
                          <option value="Labour">Labour</option>
                          <option value="Materials">Materials</option>
                          <option value="Miscellaneous">
                            Miscellaneous
                          </option>
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
          // Desktop View
          <div className="transactions-container">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-list-stars me-2"></i>Project Transactions
              </h5>

              {/* 🔹 Filter Dropdown (New Feature) */}
              <select
                className="form-select form-select-sm w-auto"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                <option value="All">All Transactions</option>
                <option value="Client Payment">Client Payment</option>
                <option value="Labour">Labour</option>
                <option value="Materials">Materials</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
            </div>

            {/* Header with Sortable Columns */}
            <div className="transactions-header">
              <div
                className="transaction-cell sortable"
                onClick={() => handleSort && handleSort("date")}
              >
                Date{" "}
                {sortColumn === "date"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </div>
              <div
                className="transaction-cell sortable"
                onClick={() => handleSort && handleSort("description")}
              >
                Description{" "}
                {sortColumn === "description"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </div>
              <div
                className="transaction-cell sortable"
                onClick={() => handleSort && handleSort("amount")}
              >
                Amount{" "}
                {sortColumn === "amount"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </div>
              <div
                className="transaction-cell sortable"
                onClick={() => handleSort && handleSort("category")}
              >
                Category{" "}
                {sortColumn === "category"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </div>
              <div
                className="transaction-cell sortable"
                onClick={() => handleSort && handleSort("type")}
              >
                Type{" "}
                {sortColumn === "type"
                  ? sortDirection === "asc"
                    ? "▲"
                    : "▼"
                  : ""}
              </div>
              <div className="transaction-cell">Actions</div>
            </div>

            {/* Add New Transaction Row for Desktop */}
            <div className="transaction-row">
              <div className="transaction-cell">
                <input
                  type="date"
                  name="date"
                  className={`form-control ${
                    addTransactionErrors.date ? "is-invalid" : ""
                  }`}
                  value={addTransactionForm.date}
                  onChange={handleAddTransactionChange}
                />
                {addTransactionErrors.date && (
                  <div className="error-message">
                    {addTransactionErrors.date}
                  </div>
                )}
              </div>
              <div className="transaction-cell">
                <input
                  type="text"
                  name="description"
                  className={`form-control ${
                    addTransactionErrors.description ? "is-invalid" : ""
                  }`}
                  placeholder="Enter description"
                  value={addTransactionForm.description}
                  onFocus={(e) => (e.target.placeholder = "")}
                  onBlur={(e) => {
                    if (!e.target.value)
                      e.target.placeholder = "Enter description";
                  }}
                  onChange={handleAddTransactionChange}
                />
                {addTransactionErrors.description && (
                  <div className="error-message">
                    {addTransactionErrors.description}
                  </div>
                )}
              </div>
              <div className="transaction-cell">
                <input
                  type="number"
                  name="amount"
                  className={`form-control ${
                    addTransactionErrors.amount ? "is-invalid" : ""
                  }`}
                  placeholder="$ 0.00"
                  value={addTransactionForm.amount}
                  onFocus={(e) => (e.target.placeholder = "")}
                  onBlur={(e) => {
                    if (!e.target.value)
                      e.target.placeholder = "Enter amount";
                  }}
                  onChange={handleAddTransactionChange}
                />
                {addTransactionErrors.amount && (
                  <div className="error-message">
                    {addTransactionErrors.amount}
                  </div>
                )}
              </div>
              <div className="transaction-cell">
                <select
                  name="category"
                  className={`form-select ${
                    addTransactionErrors.category ? "is-invalid" : ""
                  }`}
                  value={addTransactionForm.category}
                  onChange={handleAddTransactionChange}
                >
                  <option value="" disabled>
                    Category
                  </option>
                  <option value="Client Payment">Client Payment</option>
                  <option value="Labour">Labour</option>
                  <option value="Materials">Materials</option>
                  <option value="Miscellaneous">Miscellaneous</option>
                </select>
                {addTransactionErrors.category && (
                  <div className="error-message">
                    {addTransactionErrors.category}
                  </div>
                )}
              </div>
              <div className="transaction-cell">
                <select
                  name="type"
                  className={`form-select ${
                    addTransactionErrors.type ? "is-invalid" : ""
                  }`}
                  value={addTransactionForm.type}
                  onChange={handleAddTransactionChange}
                >
                  <option value="" disabled>
                    Type
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="Debit">Debit</option>
                  <option value="E-Transfer">E-Transfer</option>
                </select>
                {addTransactionErrors.type && (
                  <div className="error-message">
                    {addTransactionErrors.type}
                  </div>
                )}
              </div>
              <div className="transaction-cell">
                <button
                  className="btn btn-success btn-sm"
                  onClick={handleSave}
                  title="Add Transaction"
                >
                  <i className="bi bi-plus-square"></i>
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={resetForm}
                  title="Clear Form"
                >
                  <i className="bi bi-x-square"></i>
                </button>
              </div>
            </div>

            {/* Transactions Rows */}
            {sortedTransactions.length > 0 ? (
              sortedTransactions.map((transaction) =>
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
                        <option value="Miscellaneous">
                          Miscellaneous
                        </option>
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
                    <div className="transaction-cell">
                      {transaction.category}
                    </div>
                    <div className="transaction-cell">
                      {transaction.type}
                    </div>
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
                )
              )
            ) : (
              <div className="transaction-row text-center">
                <p className="w-100 text-muted">No transactions found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionsTable;