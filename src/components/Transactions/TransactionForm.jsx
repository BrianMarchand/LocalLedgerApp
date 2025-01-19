// --- Page: TransactionForm.jsx; ---

import React, { useState } from "react";

const TransactionForm = ({ onSave, onCancel, initialData }) => {
  const [form, setForm] = useState(
    initialData || {
      date: "",
      description: "",
      amount: "",
      category: "",
      type: "",
    },
  );

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <div className="transaction-form">
      <input
        type="date"
        name="date"
        className="form-control"
        value={form.date}
        onChange={handleChange}
      />
      <input
        type="text"
        name="description"
        className="form-control"
        placeholder="Enter description"
        value={form.description}
        onChange={handleChange}
      />
      <input
        type="number"
        name="amount"
        className="form-control"
        placeholder="Enter amount"
        value={form.amount}
        onChange={handleChange}
      />
      <select
        name="category"
        className="form-select"
        value={form.category}
        onChange={handleChange}
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
        value={form.type}
        onChange={handleChange}
      >
        <option value="" disabled>
          Select Type
        </option>
        <option value="Cash">Cash</option>
        <option value="VISA">VISA</option>
        <option value="Debit">Debit</option>
        <option value="E-Transfer">E-Transfer</option>
      </select>
      <button className="btn btn-success btn-sm" onClick={() => onSave(form)}>
        Save
      </button>
      <button className="btn btn-secondary btn-sm" onClick={onCancel}>
        Cancel
      </button>
    </div>
  );
};

export default TransactionForm;
