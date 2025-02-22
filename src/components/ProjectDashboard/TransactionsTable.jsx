// File: src/components/TransactionsTable.jsx
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

const TransactionsTable = ({
  transactions,
  projectId,
  fetchTransactions,
  formatCurrency,
  projectType, // NEW: expects "time_and_materials" for T&M projects
  hourlyRate, // NEW: used to auto-calculate labour transaction amounts
}) => {
  const isTM = projectType === "time_and_materials";

  // Initialize form states – note the extra fields for T&M: time and hours.
  const [localTransactions, setLocalTransactions] = useState(transactions);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedTransaction, setExpandedTransaction] = useState(null);
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [filterCategory, setFilterCategory] = useState("All");
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState("asc");
  const [isAddingFocused, setIsAddingFocused] = useState(false);
  const [addTransactionErrors, setAddTransactionErrors] = useState({});

  const [addTransactionForm, setAddTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "", // For T&M, expected values: "Labour" or "Materials"
    type: "",
    time: "",
    hours: "",
  });

  const [editTransactionForm, setEditTransactionForm] = useState({
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
    time: "",
    hours: "",
  });

  // Auto-calculate the amount for Labour entries when hours are entered
  useEffect(() => {
    if (
      isTM &&
      addTransactionForm.category === "Labour" &&
      addTransactionForm.hours
    ) {
      const computed =
        parseFloat(hourlyRate) * parseFloat(addTransactionForm.hours);
      setAddTransactionForm((prev) => ({
        ...prev,
        amount: computed ? computed.toFixed(2) : "",
      }));
    }
  }, [addTransactionForm.hours, addTransactionForm.category, hourlyRate, isTM]);

  // Filtering and sorting remain similar to before
  const filteredTransactions =
    filterCategory === "All"
      ? localTransactions
      : localTransactions.filter(
          (transaction) => transaction.category === filterCategory
        );

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const sortedTransactions = [...filteredTransactions].sort((a, b) => {
    if (!sortColumn) return 0;
    let valueA = a[sortColumn];
    let valueB = b[sortColumn];
    if (sortColumn === "amount" || sortColumn === "hours") {
      valueA = parseFloat(valueA) || 0;
      valueB = parseFloat(valueB) || 0;
    } else if (sortColumn === "date") {
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
    setLocalTransactions(transactions);
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

  // Handle form changes for adding and editing
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
      time: "",
      hours: "",
    });
  };

  const handleSave = async () => {
    const errors = {};
    if (!addTransactionForm.date) {
      errors.date = " ";
    }
    if (!addTransactionForm.description) {
      errors.description = " ";
    }
    if (isTM) {
      if (!addTransactionForm.category) {
        errors.category = " ";
      }
      // For labour transactions, time and hours are required.
      if (addTransactionForm.category === "Labour") {
        if (!addTransactionForm.time) {
          errors.time = " ";
        }
        if (!addTransactionForm.hours) {
          errors.hours = " ";
        }
      }
      // For materials, ensure type is selected.
      if (
        addTransactionForm.category === "Materials" &&
        !addTransactionForm.type
      ) {
        errors.type = " ";
      }
    } else {
      if (!addTransactionForm.amount) {
        errors.amount = " ";
      }
      if (!addTransactionForm.category) {
        errors.category = " ";
      }
      if (!addTransactionForm.type) {
        errors.type = " ";
      }
    }
    if (!addTransactionForm.amount) {
      errors.amount = " ";
    }
    if (Object.keys(errors).length > 0) {
      setAddTransactionErrors(errors);
      return;
    } else {
      setAddTransactionErrors({});
    }
    const localDate = new Date(addTransactionForm.date);
    localDate.setHours(0, 0, 0, 0);
    const newTransaction = {
      ...addTransactionForm,
      amount: parseFloat(addTransactionForm.amount),
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
          amount: parseFloat(editTransactionForm.amount),
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
      time: transaction.time || "",
      hours: transaction.hours || "",
    });
  };

  // --- Mobile View Rendering ---
  const renderMobileView = () => {
    if (isTM) {
      return (
        <>
          {/* Mobile Add New Transaction Card for T&M */}
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
                {/* Row 1: Date and Category */}
                <div className="input-group">
                  <div className="w-50">
                    <input
                      type="date"
                      name="date"
                      className={`form-control ${addTransactionErrors.date ? "is-invalid" : ""}`}
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
                    <select
                      name="category"
                      className={`form-select ${addTransactionErrors.category ? "is-invalid" : ""}`}
                      value={addTransactionForm.category}
                      onChange={handleAddTransactionChange}
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      <option value="Labour">Labour</option>
                      <option value="Materials">Materials</option>
                    </select>
                    {addTransactionErrors.category && (
                      <div className="error-message">
                        {addTransactionErrors.category}
                      </div>
                    )}
                  </div>
                </div>
                {/* Row 2: If Labour, show Time and Hours */}
                {addTransactionForm.category === "Labour" && (
                  <div className="input-group mt-2">
                    <div className="w-50">
                      <input
                        type="text"
                        name="time"
                        className={`form-control ${addTransactionErrors.time ? "is-invalid" : ""}`}
                        placeholder="Time Range (e.g., 08:00-12:00)"
                        value={addTransactionForm.time}
                        onChange={handleAddTransactionChange}
                      />
                      {addTransactionErrors.time && (
                        <div className="error-message">
                          {addTransactionErrors.time}
                        </div>
                      )}
                    </div>
                    <div className="w-50">
                      <input
                        type="number"
                        name="hours"
                        className={`form-control ${addTransactionErrors.hours ? "is-invalid" : ""}`}
                        placeholder="Hours"
                        value={addTransactionForm.hours}
                        onChange={handleAddTransactionChange}
                      />
                      {addTransactionErrors.hours && (
                        <div className="error-message">
                          {addTransactionErrors.hours}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {/* Row 3: Description */}
                <div className="mt-2">
                  <input
                    type="text"
                    name="description"
                    className={`form-control ${addTransactionErrors.description ? "is-invalid" : ""}`}
                    placeholder="Enter description"
                    value={addTransactionForm.description}
                    onChange={handleAddTransactionChange}
                  />
                  {addTransactionErrors.description && (
                    <div className="error-message">
                      {addTransactionErrors.description}
                    </div>
                  )}
                </div>
                {/* Row 4: Amount */}
                <div className="mt-2">
                  <input
                    type="number"
                    name="amount"
                    className={`form-control ${addTransactionErrors.amount ? "is-invalid" : ""}`}
                    placeholder="Enter amount"
                    value={addTransactionForm.amount}
                    onChange={handleAddTransactionChange}
                  />
                  {addTransactionErrors.amount && (
                    <div className="error-message">
                      {addTransactionErrors.amount}
                    </div>
                  )}
                </div>
                {/* Row 5: If Materials, show Type */}
                {addTransactionForm.category === "Materials" && (
                  <div className="mt-2">
                    <select
                      name="type"
                      className={`form-select ${addTransactionErrors.type ? "is-invalid" : ""}`}
                      value={addTransactionForm.type}
                      onChange={handleAddTransactionChange}
                    >
                      <option value="" disabled>
                        Select Type
                      </option>
                      <option value="Cash">Cash</option>
                      <option value="VISA">VISA</option>
                      <option value="Debit">Debit</option>
                    </select>
                    {addTransactionErrors.type && (
                      <div className="error-message">
                        {addTransactionErrors.type}
                      </div>
                    )}
                  </div>
                )}
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
          {/* Mobile Transactions List for T&M */}
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
                  <span className="transaction-category">
                    {transaction.category}
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
              {expandedTransaction === transaction.id && (
                <div className="transaction-card-body">
                  {editingTransaction?.id === transaction.id ? (
                    <>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={editTransactionForm.date}
                        onChange={handleEditTransactionChange}
                      />
                      <select
                        name="category"
                        className="form-select"
                        value={editTransactionForm.category}
                        onChange={handleEditTransactionChange}
                      >
                        <option value="" disabled>
                          Select Category
                        </option>
                        <option value="Labour">Labour</option>
                        <option value="Materials">Materials</option>
                      </select>
                      {editTransactionForm.category === "Labour" && (
                        <div className="input-group mt-2">
                          <input
                            type="text"
                            name="time"
                            className="form-control"
                            placeholder="Time Range"
                            value={editTransactionForm.time}
                            onChange={handleEditTransactionChange}
                          />
                          <input
                            type="number"
                            name="hours"
                            className="form-control"
                            placeholder="Hours"
                            value={editTransactionForm.hours}
                            onChange={handleEditTransactionChange}
                          />
                        </div>
                      )}
                      <input
                        type="text"
                        name="description"
                        className="form-control mt-2"
                        value={editTransactionForm.description}
                        onChange={handleEditTransactionChange}
                      />
                      <input
                        type="number"
                        name="amount"
                        className="form-control mt-2"
                        value={editTransactionForm.amount}
                        onChange={handleEditTransactionChange}
                      />
                      {editTransactionForm.category === "Materials" && (
                        <select
                          name="type"
                          className="form-select mt-2"
                          value={editTransactionForm.type}
                          onChange={handleEditTransactionChange}
                        >
                          <option value="" disabled>
                            Select Type
                          </option>
                          <option value="Cash">Cash</option>
                          <option value="VISA">VISA</option>
                          <option value="Debit">Debit</option>
                        </select>
                      )}
                      <button
                        className="btn btn-success btn-sm me-2 mt-2"
                        onClick={handleSaveEdit}
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm mt-2"
                        onClick={() => setEditingTransaction(null)}
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Date:</strong> {formatDate(transaction.date)}
                      </p>
                      <p>
                        <strong>Category:</strong> {transaction.category}
                      </p>
                      {transaction.category === "Labour" && (
                        <>
                          <p>
                            <strong>Time:</strong> {transaction.time}
                          </p>
                          <p>
                            <strong>Hours:</strong> {transaction.hours}
                          </p>
                        </>
                      )}
                      <p>
                        <strong>Description:</strong> {transaction.description}
                      </p>
                      <p>
                        <strong>Amount:</strong>{" "}
                        {formatCurrency(transaction.amount)}
                      </p>
                      {transaction.category === "Materials" && (
                        <p>
                          <strong>Type:</strong> {transaction.type}
                        </p>
                      )}
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
      );
    } else {
      // Non-T&M mobile view (existing fixed-budget layout)
      return (
        <>
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
                <div className="input-group">
                  <div className="w-50">
                    <input
                      type="date"
                      name="date"
                      className={`form-control ${addTransactionErrors.date ? "is-invalid" : ""}`}
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
                      className={`form-control ${addTransactionErrors.amount ? "is-invalid" : ""}`}
                      placeholder="$ Enter amount"
                      value={addTransactionForm.amount}
                      onChange={handleAddTransactionChange}
                    />
                    {addTransactionErrors.amount && (
                      <div className="error-message">
                        {addTransactionErrors.amount}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-2">
                  <input
                    type="text"
                    name="description"
                    className={`form-control ${addTransactionErrors.description ? "is-invalid" : ""}`}
                    placeholder="Enter description"
                    value={addTransactionForm.description}
                    onChange={handleAddTransactionChange}
                  />
                  {addTransactionErrors.description && (
                    <div className="error-message">
                      {addTransactionErrors.description}
                    </div>
                  )}
                </div>
                <div className="input-group mt-2">
                  <div className="w-50">
                    <select
                      name="category"
                      className={`form-select ${addTransactionErrors.category ? "is-invalid" : ""}`}
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
                  <div className="w-50">
                    <select
                      name="type"
                      className={`form-select ${addTransactionErrors.type ? "is-invalid" : ""}`}
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
                <div className="mobile-action-buttons mt-2">
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
            )}
          </div>
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
              {expandedTransaction === transaction.id && (
                <div className="transaction-card-body">
                  {editingTransaction?.id === transaction.id ? (
                    <>
                      <input
                        type="date"
                        name="date"
                        className="form-control"
                        value={editTransactionForm.date}
                        onChange={handleEditTransactionChange}
                      />
                      <input
                        type="text"
                        name="description"
                        className="form-control"
                        value={editTransactionForm.description}
                        onChange={handleEditTransactionChange}
                      />
                      <input
                        type="number"
                        name="amount"
                        className="form-control"
                        value={editTransactionForm.amount}
                        onChange={handleEditTransactionChange}
                      />
                      <select
                        name="category"
                        className="form-select"
                        value={editTransactionForm.category}
                        onChange={handleEditTransactionChange}
                      >
                        <option value="" disabled>
                          Category
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
                        onChange={handleEditTransactionChange}
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
                        className="btn btn-success btn-sm"
                        onClick={handleSaveEdit}
                        title="Save Changes"
                      >
                        <i className="bi bi-check-lg"></i>
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => setEditingTransaction(null)}
                        title="Cancel Edit"
                      >
                        <i className="bi bi-x-lg"></i>
                      </button>
                    </>
                  ) : (
                    <>
                      <p>
                        <strong>Category:</strong> {transaction.category}
                      </p>
                      <p>
                        <strong>Description:</strong> {transaction.description}
                      </p>
                      <p>
                        <strong>Amount:</strong>{" "}
                        {formatCurrency(transaction.amount)}
                      </p>
                      <p>
                        <strong>Type:</strong> {transaction.type}
                      </p>
                      <div className="transaction-cell action-buttons">
                        <button
                          className="btn btn-warning btn-sm"
                          onClick={() => handleEdit(transaction)}
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(transaction.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </>
      );
    }
  };

  // --- Desktop View Rendering ---
  const renderDesktopView = () => {
    if (isTM) {
      return (
        <div className="transactions-container">
          {/* Header for T&M transactions */}
          <div className="transactions-header">
            <div
              className="transaction-cell sortable"
              onClick={() => handleSort("date")}
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
              onClick={() => handleSort("category")}
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
              onClick={() => handleSort("time")}
            >
              Time{" "}
              {sortColumn === "time"
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </div>
            <div
              className="transaction-cell sortable"
              onClick={() => handleSort("hours")}
            >
              Hours{" "}
              {sortColumn === "hours"
                ? sortDirection === "asc"
                  ? "▲"
                  : "▼"
                : ""}
            </div>
            <div
              className="transaction-cell sortable"
              onClick={() => handleSort("description")}
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
              onClick={() => handleSort("amount")}
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
              onClick={() => handleSort("type")}
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
          {/* Add New Transaction Row for T&M */}
          <div className="transaction-row">
            <div className="transaction-cell">
              <input
                type="date"
                name="date"
                className={`form-control ${addTransactionErrors.date ? "is-invalid" : ""}`}
                value={addTransactionForm.date}
                onChange={handleAddTransactionChange}
              />
              {addTransactionErrors.date && (
                <div className="error-message">{addTransactionErrors.date}</div>
              )}
            </div>
            <div className="transaction-cell">
              <select
                name="category"
                className={`form-select ${addTransactionErrors.category ? "is-invalid" : ""}`}
                value={addTransactionForm.category}
                onChange={handleAddTransactionChange}
              >
                <option value="" disabled>
                  Select Category
                </option>
                <option value="Labour">Labour</option>
                <option value="Materials">Materials</option>
              </select>
              {addTransactionErrors.category && (
                <div className="error-message">
                  {addTransactionErrors.category}
                </div>
              )}
            </div>
            <div className="transaction-cell">
              {addTransactionForm.category === "Labour" ? (
                <input
                  type="text"
                  name="time"
                  className={`form-control ${addTransactionErrors.time ? "is-invalid" : ""}`}
                  placeholder="Time Range"
                  value={addTransactionForm.time}
                  onChange={handleAddTransactionChange}
                />
              ) : (
                <input
                  type="text"
                  className="form-control"
                  placeholder="N/A"
                  disabled
                  value=""
                />
              )}
              {addTransactionErrors.time && (
                <div className="error-message">{addTransactionErrors.time}</div>
              )}
            </div>
            <div className="transaction-cell">
              {addTransactionForm.category === "Labour" ? (
                <input
                  type="number"
                  name="hours"
                  className={`form-control ${addTransactionErrors.hours ? "is-invalid" : ""}`}
                  placeholder="Hours"
                  value={addTransactionForm.hours}
                  onChange={handleAddTransactionChange}
                />
              ) : (
                <input
                  type="number"
                  className="form-control"
                  placeholder="N/A"
                  disabled
                  value=""
                />
              )}
              {addTransactionErrors.hours && (
                <div className="error-message">
                  {addTransactionErrors.hours}
                </div>
              )}
            </div>
            <div className="transaction-cell">
              <input
                type="text"
                name="description"
                className={`form-control ${addTransactionErrors.description ? "is-invalid" : ""}`}
                placeholder="Enter description"
                value={addTransactionForm.description}
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
                className={`form-control ${addTransactionErrors.amount ? "is-invalid" : ""}`}
                placeholder="Enter amount"
                value={addTransactionForm.amount}
                onChange={handleAddTransactionChange}
              />
              {addTransactionErrors.amount && (
                <div className="error-message">
                  {addTransactionErrors.amount}
                </div>
              )}
            </div>
            <div className="transaction-cell">
              {addTransactionForm.category === "Materials" ? (
                <select
                  name="type"
                  className={`form-select ${addTransactionErrors.type ? "is-invalid" : ""}`}
                  value={addTransactionForm.type}
                  onChange={handleAddTransactionChange}
                >
                  <option value="" disabled>
                    Select Type
                  </option>
                  <option value="Cash">Cash</option>
                  <option value="VISA">VISA</option>
                  <option value="Debit">Debit</option>
                </select>
              ) : (
                <input
                  type="text"
                  className="form-control"
                  placeholder="N/A"
                  disabled
                  value=""
                />
              )}
              {addTransactionErrors.type && (
                <div className="error-message">{addTransactionErrors.type}</div>
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
          {/* Transactions Rows for T&M */}
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction) =>
              editingTransaction?.id === transaction.id ? (
                <div
                  key={transaction.id}
                  className="transaction-row editing-row"
                >
                  <div className="transaction-cell">
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={editTransactionForm.date}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    <select
                      name="category"
                      className="form-select"
                      value={editTransactionForm.category}
                      onChange={handleEditTransactionChange}
                    >
                      <option value="" disabled>
                        Select Category
                      </option>
                      <option value="Labour">Labour</option>
                      <option value="Materials">Materials</option>
                    </select>
                  </div>
                  <div className="transaction-cell">
                    {editTransactionForm.category === "Labour" ? (
                      <input
                        type="text"
                        name="time"
                        className="form-control"
                        placeholder="Time Range"
                        value={editTransactionForm.time}
                        onChange={handleEditTransactionChange}
                      />
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="N/A"
                        disabled
                        value=""
                      />
                    )}
                  </div>
                  <div className="transaction-cell">
                    {editTransactionForm.category === "Labour" ? (
                      <input
                        type="number"
                        name="hours"
                        className="form-control"
                        placeholder="Hours"
                        value={editTransactionForm.hours}
                        onChange={handleEditTransactionChange}
                      />
                    ) : (
                      <input
                        type="number"
                        className="form-control"
                        placeholder="N/A"
                        disabled
                        value=""
                      />
                    )}
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      value={editTransactionForm.description}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      value={editTransactionForm.amount}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    {editTransactionForm.category === "Materials" ? (
                      <select
                        name="type"
                        className="form-select"
                        value={editTransactionForm.type}
                        onChange={handleEditTransactionChange}
                      >
                        <option value="" disabled>
                          Select Type
                        </option>
                        <option value="Cash">Cash</option>
                        <option value="VISA">VISA</option>
                        <option value="Debit">Debit</option>
                      </select>
                    ) : (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="N/A"
                        disabled
                        value=""
                      />
                    )}
                  </div>
                  <div className="transaction-cell">
                    <button
                      className="btn btn-success btn-sm"
                      onClick={handleSaveEdit}
                      title="Save Changes"
                    >
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingTransaction(null)}
                      title="Cancel Edit"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={transaction.id} className="transaction-row">
                  <div className="transaction-cell">
                    {formatDate(transaction.date)}
                  </div>
                  <div className="transaction-cell">{transaction.category}</div>
                  <div className="transaction-cell">
                    {transaction.category === "Labour"
                      ? transaction.time
                      : "N/A"}
                  </div>
                  <div className="transaction-cell">
                    {transaction.category === "Labour"
                      ? transaction.hours
                      : "N/A"}
                  </div>
                  <div className="transaction-cell">
                    {transaction.description}
                  </div>
                  <div className="transaction-cell">
                    {formatCurrency(transaction.amount)}
                  </div>
                  <div className="transaction-cell">
                    {transaction.category === "Materials"
                      ? transaction.type
                      : "N/A"}
                  </div>
                  <div className="transaction-cell action-buttons">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => handleEdit(transaction)}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(transaction.id)}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
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
      );
    } else {
      // Non-T&M desktop view (existing fixed-budget layout)
      return (
        <div className="transactions-container">
          <div className="transactions-header">
            <div
              className="transaction-cell sortable"
              onClick={() => handleSort("date")}
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
              onClick={() => handleSort("description")}
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
              onClick={() => handleSort("amount")}
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
              onClick={() => handleSort("category")}
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
              onClick={() => handleSort("type")}
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
          <div className="transaction-row">
            <div className="transaction-cell">
              <input
                type="date"
                name="date"
                className={`form-control ${addTransactionErrors.date ? "is-invalid" : ""}`}
                value={addTransactionForm.date}
                onChange={handleAddTransactionChange}
              />
              {addTransactionErrors.date && (
                <div className="error-message">{addTransactionErrors.date}</div>
              )}
            </div>
            <div className="transaction-cell">
              <input
                type="text"
                name="description"
                className={`form-control ${addTransactionErrors.description ? "is-invalid" : ""}`}
                placeholder="Enter description"
                value={addTransactionForm.description}
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
                className={`form-control ${addTransactionErrors.amount ? "is-invalid" : ""}`}
                placeholder="$ 0.00"
                value={addTransactionForm.amount}
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
                className={`form-select ${addTransactionErrors.category ? "is-invalid" : ""}`}
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
                className={`form-select ${addTransactionErrors.type ? "is-invalid" : ""}`}
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
                <div className="error-message">{addTransactionErrors.type}</div>
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
          {sortedTransactions.length > 0 ? (
            sortedTransactions.map((transaction) =>
              editingTransaction?.id === transaction.id ? (
                <div
                  key={transaction.id}
                  className="transaction-row editing-row"
                >
                  <div className="transaction-cell">
                    <input
                      type="date"
                      name="date"
                      className="form-control"
                      value={editTransactionForm.date}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="text"
                      name="description"
                      className="form-control"
                      value={editTransactionForm.description}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    <input
                      type="number"
                      name="amount"
                      className="form-control"
                      value={editTransactionForm.amount}
                      onChange={handleEditTransactionChange}
                    />
                  </div>
                  <div className="transaction-cell">
                    <select
                      name="category"
                      className="form-select"
                      value={editTransactionForm.category}
                      onChange={handleEditTransactionChange}
                    >
                      <option value="" disabled>
                        Category
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
                      onChange={handleEditTransactionChange}
                    >
                      <option value="" disabled>
                        Type
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
                      <i className="bi bi-check-lg"></i>
                    </button>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setEditingTransaction(null)}
                      title="Cancel Edit"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                </div>
              ) : (
                <div key={transaction.id} className="transaction-row">
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
                        <i className="bi bi-pencil-square"></i>
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(transaction.id)}
                      >
                        <i className="bi bi-trash"></i>
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
      );
    }
  };

  return isMobile ? renderMobileView() : renderDesktopView();
};

export default TransactionsTable;
