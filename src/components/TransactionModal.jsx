import React, { useState } from "react";
import { Modal, Button } from "react-bootstrap";
import "../styles/components/TransactionModal.css"; // Updated styles

const TransactionModal = ({ show, handleClose, handleSave, projects }) => {
  const [transaction, setTransaction] = useState({
    projectId: "",
    date: "",
    description: "",
    amount: "",
    category: "",
    type: "",
  });

  const handleChange = (e) => {
    setTransaction({ ...transaction, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    if (
      !transaction.projectId ||
      !transaction.date ||
      !transaction.description ||
      !transaction.amount ||
      !transaction.category
    ) {
      alert("Please fill in all required fields.");
      return;
    }

    handleSave(transaction);
    setTransaction({
      projectId: "",
      date: "",
      description: "",
      amount: "",
      category: "",
      type: "",
    });

    handleClose();
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Add New Transaction</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} noValidate className="modern-form">
          <fieldset>
            <legend>Transaction Details</legend>

            {/* 🔹 Project Selection */}
            <div className="input-group">
              <select
                id="projectId"
                name="projectId"
                value={transaction.projectId}
                onChange={handleChange}
                required
              >
                <option value="">Select a Project</option>
                {(projects || []).map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <label htmlFor="projectId">Select Project</label>
            </div>

            {/* 🔹 Date Field */}
            <div className="input-group">
              <input
                type="date"
                id="date"
                name="date"
                value={transaction.date}
                onChange={handleChange}
                required
              />
              <label htmlFor="date">Date</label>
            </div>

            {/* 🔹 Description */}
            <div className="input-group">
              <input
                type="text"
                id="description"
                name="description"
                placeholder=" "
                value={transaction.description}
                onChange={handleChange}
                required
              />
              <label htmlFor="description">Description</label>
            </div>

            {/* 🔹 Amount */}
            <div className="input-group">
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder=" "
                value={transaction.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
              />
              <label htmlFor="amount">Amount ($)</label>
            </div>

            {/* 🔹 Category */}
            <div className="input-group">
              <select
                id="category"
                name="category"
                value={transaction.category}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Category
                </option>
                <option value="Client Payment">Client Payment</option>
                <option value="Labour">Labour</option>
                <option value="Materials">Materials</option>
                <option value="Miscellaneous">Miscellaneous</option>
              </select>
              <label htmlFor="category">Category</label>
            </div>

            {/* 🔹 Payment Type */}
            <div className="input-group">
              <select
                id="type"
                name="type"
                value={transaction.type}
                onChange={handleChange}
                required
              >
                <option value="" disabled>
                  Select Type
                </option>
                <option value="Cash">Cash</option>
                <option value="VISA">VISA</option>
                <option value="Debit">Debit</option>
                <option value="E-Transfer">E-Transfer</option>
              </select>
              <label htmlFor="type">Payment Type</label>
            </div>
          </fieldset>

          {/* 🔹 Buttons */}
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Add Transaction
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default TransactionModal;
