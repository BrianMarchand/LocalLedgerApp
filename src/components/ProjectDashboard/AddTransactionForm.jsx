import React, { useState } from "react";
import { addDoc, collection } from "firebase/firestore";
import { db } from "../../firebaseConfig";

function AddTransactionForm({ projectId, onTransactionAdded }) {
  const [formData, setFormData] = useState({
    date: "",
    name: "",
    amount: "",
    category: "",
    type: "Cash",
  });
  const [formError, setFormError] = useState("");

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(""); // Clear any previous errors
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation: Ensure all fields are filled
    if (
      !formData.date ||
      !formData.name ||
      !formData.amount ||
      !formData.category ||
      !formData.type
    ) {
      setFormError("Please fill in all fields.");
      return;
    }

    try {
      // Add transaction to Firestore
      const transactionsRef = collection(
        db,
        `projects/${projectId}/transactions`,
      );
      await addDoc(transactionsRef, {
        ...formData,
        amount: parseFloat(formData.amount), // Ensure amount is stored as a number
        date: new Date(formData.date), // Ensure valid JavaScript Date object
      });

      // Reset form state after submission
      setFormData({
        date: "",
        name: "",
        amount: "",
        category: "",
        type: "Cash",
      });

      // Notify parent component to refresh transaction list
      onTransactionAdded();
    } catch (error) {
      console.error("Error adding transaction:", error);
      setFormError("Failed to add transaction. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h5>Add Transaction</h5>
      {formError && <p className="text-danger">{formError}</p>}
      <div className="mb-3">
        <input
          type="date"
          name="date"
          className="form-control"
          value={formData.date}
          onChange={handleInputChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="text"
          name="name"
          className="form-control"
          placeholder="Description"
          value={formData.name}
          onChange={handleInputChange}
        />
      </div>
      <div className="mb-3">
        <input
          type="number"
          name="amount"
          className="form-control"
          placeholder="Amount"
          value={formData.amount}
          onChange={handleInputChange}
        />
      </div>
      <div className="mb-3">
        <select
          name="category"
          className="form-select"
          value={formData.category}
          onChange={handleInputChange}
        >
          <option value="">Category</option>
          <option value="Client Payment">Client Payment</option>
          <option value="Labor">Labor</option>
          <option value="Materials">Materials</option>
          <option value="Miscellaneous">Miscellaneous</option>
        </select>
      </div>
      <div className="mb-3">
        <select
          name="type"
          className="form-select"
          value={formData.type}
          onChange={handleInputChange}
        >
          <option value="Cash">Cash</option>
          <option value="VISA">VISA</option>
          <option value="Debit">Debit</option>
          <option value="E-Transfer">E-Transfer</option>
        </select>
      </div>
      <button type="submit" className="btn btn-primary">
        Add Transaction
      </button>
    </form>
  );
}

export default AddTransactionForm;
