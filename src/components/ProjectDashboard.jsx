// --- Import Dependencies ---
import React, { useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Bootstrap icons
import { useParams, useNavigate } from 'react-router-dom'; // React Router for navigation

// --- Main Component ---
function ProjectDashboard() {
  // --- Router Hooks ---
  const { id } = useParams(); // Get project ID from URL parameters
  const navigate = useNavigate(); // Hook for navigation between routes

  // --- Load Projects and Transactions ---
  const [projects, setProjects] = useState(() =>
    JSON.parse(localStorage.getItem('projects')) || [] // Load projects from local storage or default to an empty array
  );

  const [transactions, setTransactions] = useState(() =>
    JSON.parse(localStorage.getItem('transactions')) || [] // Load transactions from local storage or default to an empty array
  );

  // --- Get Current Project by ID ---
  const project = projects.find(p => p.id === parseInt(id)); // Find project matching the URL parameter ID

  // --- Navigation Function ---
  const goBack = () => navigate('/'); // Navigate back to the projects list  // --- Transaction States ---
  const [newTransaction, setNewTransaction] = useState({
    name: '',               // Transaction description
    amount: '',             // Transaction amount
    category: 'Materials',  // Default category for new transactions
    type: 'Cash',           // Default payment type for new transactions
  });

  const [editingTransaction, setEditingTransaction] = useState(null); // Tracks transaction being edited

  // --- Add Transaction ---
  const addTransaction = () => {
    // Ensure required fields are filled
    if (newTransaction.name && newTransaction.amount) {
      const updatedTransactions = [
        ...transactions, // Keep existing transactions
        { ...newTransaction, id: Date.now(), projectId: project.id }, // Add new transaction with unique ID and project ID
      ];

      // Update state and save to local storage
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

      // Reset the form fields
      setNewTransaction({ name: '', amount: '', category: 'Materials', type: 'Cash' });
    }
  };

  // --- Edit Transaction ---
  const startEditTransaction = (transaction) => {
    setEditingTransaction({ ...transaction }); // Load transaction details into editing mode
  };

  const saveEditTransaction = () => {
    // Replace the edited transaction in the list
    const updatedTransactions = transactions.map(t =>
      t.id === editingTransaction.id ? editingTransaction : t
    );

    // Update state and save to local storage
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));

    // Exit edit mode
    setEditingTransaction(null);
  };

  const cancelEditTransaction = () => {
    setEditingTransaction(null); // Cancel edit and reset editing state
  };

  // --- Delete Transaction ---
  const deleteTransaction = (id) => {
    // Remove transaction by ID
    const updatedTransactions = transactions.filter(t => t.id !== id);

    // Update state and save to local storage
    setTransactions(updatedTransactions);
    localStorage.setItem('transactions', JSON.stringify(updatedTransactions));
  };



    // --- Financial Summary Calculations ---

  // --- Income ---
  const income = transactions
    .filter(t => t.projectId === project.id && t.category === 'Client Payment') // Filter for client payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up payment amounts

  // --- Expenses ---
  const expenses = transactions
    .filter(t => t.projectId === project.id && t.category !== 'Client Payment') // Exclude client payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up expenses

  // --- Budget Metrics ---
  const remainingBudget = project.budget - expenses;       // Remaining budget based on project allocation
  const availableFunds = income - expenses;                // Available funds after deducting expenses
  const remainingClientPayment = project.budget - income;  // Remaining amount client still owes

  // --- Payment Breakdown by Type ---

  // Cash Received
  const cashReceived = transactions
    .filter(t => t.projectId === project.id && t.type === 'Cash' && t.category === 'Client Payment') // Cash payments
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up cash received

  // Cash Spent
  const cashSpent = transactions
    .filter(t => t.projectId === project.id && t.type === 'Cash' && t.category !== 'Client Payment') // Cash expenses
    .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up cash spent

  // VISA Expenses
  const visaExpenses = transactions
    .filter(t => t.projectId === project.id && t.type === 'VISA') // VISA expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Debit Expenses
  const debitExpenses = transactions
    .filter(t => t.projectId === project.id && t.type === 'Debit') // Debit expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // E-Transfer Income
  const eTransferIncome = transactions
    .filter(t => t.projectId === project.id && t.type === 'E-Transfer' && t.category === 'Client Payment') // E-Transfer income
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // E-Transfer Expenses
  const eTransferExpenses = transactions
    .filter(t => t.projectId === project.id && t.type === 'E-Transfer' && t.category !== 'Client Payment') // E-Transfer expenses
    .reduce((sum, t) => sum + Number(t.amount), 0);

   // --- Render UI ---
   return (
    <div className="container py-4">
      {/* --- Header --- */}
      <div className="d-flex justify-content-between align-items-left mb-4">
        <h1 className="h3">Project Dashboard</h1>
        <button className="btn btn-secondary" onClick={goBack}>
          Back to Projects
        </button>
      </div>

      {/* --- Project Info Card --- */}
      <div className="card mb-4">
        <div className="card-body">
          <h5 className="card-title">{project.name}</h5> {/* Display project name */}
          <p><strong>Location:</strong> {project.location}</p> {/* Display project location */}
          <p><strong>Budget:</strong> ${project.budget}</p> {/* Display project budget */}
          <p><strong>Status:</strong> {project.status}</p> {/* Display project status */}
        </div>
      </div>

      {/* --- Add Transaction Form --- */}
      <div className="card mb-4">
        <div className="card-header">Add Transaction</div>
        <div className="card-body">
          <div className="row g-3">
            {/* Date Input */}
            <div className="col-md-2">
              <input
                type="date"
                className="form-control"
                value={newTransaction.date}
                onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
              />
            </div>

            {/* Description Input */}
            <div className="col-md-3">
              <input
                type="text"
                className="form-control"
                placeholder="Description"
                value={newTransaction.name}
                onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
              />
            </div>

            {/* Amount Input */}
            <div className="col-md-2">
              <input
                type="number"
                className="form-control"
                placeholder="Amount"
                value={newTransaction.amount}
                onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
              />
            </div>

            {/* Category Dropdown */}
            <div className="col-md-3">
              <select
                className="form-select"
                value={newTransaction.category}
                onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
              >
                <option value="Client Payment">Client Payment</option>
                <option value="Labour">Labour</option>
                <option value="Materials">Materials</option>
                <option value="Misc Expense">Misc Expense</option>
              </select>
            </div>

            {/* Payment Type Dropdown */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={newTransaction.type}
                onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
              >
                <option value="Cash">Cash</option>
                <option value="VISA">VISA</option>
                <option value="E-Transfer">E-Transfer</option>
                <option value="Debit">Debit</option>
              </select>
            </div>

            {/* Add Transaction Button */}
            <div className="col-md-2">
              <button className="btn btn-primary" onClick={addTransaction}>
                Add Transaction
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* --- Transactions Table --- */}
      <div className="card mb-4">
        <div className="card-header">Transactions</div>
        <div className="card-body">
          {transactions.filter(t => t.projectId === project.id).length === 0 ? (
            // Show message if no transactions exist
            <p className="text-center text-muted">
              No transactions yet. Start by adding your first transaction below!
            </p>
          ) : (
            // Display transactions table if transactions exist
            <table className="table table-striped">
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
                {transactions.filter(t => t.projectId === project.id).map(t => (
                  <tr key={t.id}>
                    {editingTransaction && editingTransaction.id === t.id ? (
                      // Edit mode - inline form for editing
                      <>
                        <td>
                          <input
                            type="date"
                            className="form-control"
                            value={editingTransaction.date}
                            onChange={(e) =>
                              setEditingTransaction({ ...editingTransaction, date: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="text"
                            className="form-control"
                            value={editingTransaction.name}
                            onChange={(e) =>
                              setEditingTransaction({ ...editingTransaction, name: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            value={editingTransaction.amount}
                            onChange={(e) =>
                              setEditingTransaction({ ...editingTransaction, amount: e.target.value })
                            }
                          />
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingTransaction.category}
                            onChange={(e) =>
                              setEditingTransaction({ ...editingTransaction, category: e.target.value })
                            }
                          >
                            <option value="Client Payment">Client Payment</option>
                            <option value="Labour">Labour</option>
                            <option value="Materials">Materials</option>
                            <option value="Misc Expense">Misc Expense</option>
                          </select>
                        </td>
                        <td>
                          <select
                            className="form-select"
                            value={editingTransaction.type}
                            onChange={(e) =>
                              setEditingTransaction({ ...editingTransaction, type: e.target.value })
                            }
                          >
                            <option value="Cash">Cash</option>
                            <option value="VISA">VISA</option>
                            <option value="E-Transfer">E-Transfer</option>
                            <option value="Debit">Debit</option>
                          </select>
                        </td>
                        <td>
                          <button className="btn btn-success btn-sm me-2" onClick={saveEditTransaction}>
                            Save
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={cancelEditTransaction}>
                            Cancel
                          </button>
                        </td>
                      </>
                    ) : (
                      // Read-only mode - show transaction details
                      <>
                        <td>{t.date}</td>
                        <td>{t.name}</td>
                        <td>${t.amount}</td>
                        <td>{t.category}</td>
                        <td>{t.type}</td>
                        <td>
                          <button className="btn btn-warning btn-sm me-2" onClick={() => startEditTransaction(t)}>
                            Edit
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => deleteTransaction(t.id)}>
                            Delete
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* --- Financial Summary - Dynamic Visibility --- */}
      {transactions
        .filter(t => t.projectId === project.id) // Filter transactions by project ID
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort transactions by date
        .length > 0 && ( // Only show summary if there are transactions
        <div className="card mb-4 financial-summary-container">
          <div className="card-header">
            <h5 className="mb-0">Financial Summary</h5>
          </div>
          <div className="card-body">
            <div className="row mb-3">

              {/* --- Overview Section --- */}
              <div className="col-md-6">
                <h6 className="text-primary mb-3">Overview</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <i className="bi bi-cash-stack text-success me-2"></i>
                    <strong className="me-2">Total Income:</strong> ${income} {/* Total Income */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-credit-card text-danger me-2"></i>
                    <strong className="me-2">Total Expenses:</strong> ${expenses} {/* Total Expenses */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-wallet2 text-info me-2"></i>
                    <strong className="me-2">Remaining Budget:</strong> ${remainingBudget} {/* Remaining Budget */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-piggy-bank text-primary me-2"></i>
                    <strong className="me-2">Available Funds:</strong> ${availableFunds} {/* Available Funds */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-cash-coin text-warning me-2"></i>
                    <strong className="me-2">Remaining Client Payment:</strong> ${remainingClientPayment} {/* Remaining Payments */}
                  </li>
                </ul>
              </div>

              {/* --- Payment Breakdown Section --- */}
              <div className="col-md-6">
                <h6 className="text-success mb-3">Payment Breakdown</h6>
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <i className="bi bi-cash text-success me-2"></i>
                    <strong className="me-2">Cash Received:</strong> ${cashReceived} {/* Cash Income */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-cash-coin text-danger me-2"></i>
                    <strong className="me-2">Cash Spent:</strong> ${cashSpent} {/* Cash Expenses */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-credit-card text-danger me-2"></i>
                    <strong className="me-2">VISA Expenses:</strong> ${visaExpenses} {/* VISA Expenses */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-bank text-danger me-2"></i>
                    <strong className="me-2">Debit Expenses:</strong> ${debitExpenses} {/* Debit Expenses */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-cash text-success me-2"></i>
                    <strong className="me-2">E-Transfer Income:</strong> ${eTransferIncome} {/* E-Transfer Income */}
                  </li>
                  <li className="mb-2">
                    <i className="bi bi-arrow-down-right-circle text-danger me-2"></i>
                    <strong className="me-2">E-Transfer Expenses:</strong> ${eTransferExpenses} {/* E-Transfer Expenses */}
                  </li>
                </ul>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectDashboard;