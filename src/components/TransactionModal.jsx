import React, { useState } from "react";
import { Button } from "react-bootstrap";
import GlobalModal from "./GlobalModal";
import Swal from "sweetalert2";

const TransactionModalSliding = ({
  show,
  handleClose,
  handleSave,
  projects,
}) => {
  const [transaction, setTransaction] = useState({
    projectId: "",
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setTransaction({ ...transaction, [e.target.name]: e.target.value });
  };

  const validateForm = () => {
    if (
      !transaction.projectId ||
      !transaction.date ||
      !transaction.description ||
      !transaction.amount ||
      !transaction.category
    ) {
      setError("Please fill in all required fields.");
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    try {
      await Promise.resolve(handleSave(transaction));

      // Reset the form
      setTransaction({
        projectId: "",
        date: "",
        description: "",
        amount: "",
        category: "",
        type: "",
      });

      // Show success message
      await Swal.fire({
        icon: "success",
        title: "Transaction Added",
        text: "Your transaction has been successfully added!",
        timer: 1500,
        showConfirmButton: false,
      });

      handleClose();
    } catch (err) {
      console.error("Error saving transaction:", err);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "Failed to save transaction.",
      });
    }
    setLoading(false);
  };

  const renderFormContent = () => (
    <form onSubmit={handleSubmit} noValidate>
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Project Selection */}
      <div className="auth-form-group">
        <label htmlFor="projectId">Select Project</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-folder"></i>
          </span>
          <select
            id="projectId"
            name="projectId"
            className="form-control"
            value={transaction.projectId}
            onChange={handleChange}
          >
            <option value="">Select a Project</option>
            {(projects || []).map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Field */}
      <div className="auth-form-group">
        <label htmlFor="date">Date</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-calendar"></i>
          </span>
          <input
            type="date"
            id="date"
            name="date"
            className="form-control"
            value={transaction.date}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Description Field */}
      <div className="auth-form-group">
        <label htmlFor="description">Description</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-card-text"></i>
          </span>
          <input
            type="text"
            id="description"
            name="description"
            className="form-control"
            placeholder="Enter description"
            value={transaction.description}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Amount Field */}
      <div className="auth-form-group">
        <label htmlFor="amount">Amount ($)</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-currency-dollar"></i>
          </span>
          <input
            type="number"
            id="amount"
            name="amount"
            className="form-control"
            placeholder="Enter amount"
            value={transaction.amount}
            onChange={handleChange}
            min="0.01"
            step="0.01"
          />
        </div>
      </div>

      {/* Category Field */}
      <div className="auth-form-group">
        <label htmlFor="category">Category</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-list-check"></i>
          </span>
          <select
            id="category"
            name="category"
            className="form-control"
            value={transaction.category}
            onChange={handleChange}
          >
            <option value="">Select Category</option>
            <option value="Client Payment">Client Payment</option>
            <option value="Labour">Labour</option>
            <option value="Materials">Materials</option>
            <option value="Miscellaneous">Miscellaneous</option>
          </select>
        </div>
      </div>

      {/* Payment Type Field */}
      <div className="auth-form-group">
        <label htmlFor="type">Payment Type</label>
        <div className="input-container">
          <span className="input-icon">
            <i className="bi bi-credit-card"></i>
          </span>
          <select
            id="type"
            name="type"
            className="form-control"
            value={transaction.type}
            onChange={handleChange}
          >
            <option value="">Select Type</option>
            <option value="Cash">Cash</option>
            <option value="VISA">VISA</option>
            <option value="Debit">Debit</option>
            <option value="E-Transfer">E-Transfer</option>
          </select>
        </div>
      </div>

      {/* Footer Buttons */}
      <div className="modal-footer">
        <Button
          variant="secondary"
          type="button"
          className="global-modal-action-btn"
          onClick={handleClose}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          type="submit"
          className="global-modal-action-btn"
          disabled={loading}
        >
          {loading ? "Saving..." : "Add Transaction"}
        </Button>
      </div>
    </form>
  );

  return (
    <GlobalModal
      show={show}
      onClose={handleClose}
      title="Add Transaction"
      leftContent={
        <div className="info-content">
          <h2>Transaction Details</h2>
          <p>Enter the transaction information below.</p>
          <div className="progress-indicator">
            <div className="progress-bar" style={{ width: "100%" }}></div>
          </div>
        </div>
      }
      rightContent={
        <div style={{ position: "relative" }}>{renderFormContent()}</div>
      }
    />
  );
};

export default TransactionModalSliding;
