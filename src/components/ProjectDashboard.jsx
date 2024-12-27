// --- Import Dependencies ---
import React, { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Bootstrap icons
import { db } from '../firebaseConfig'; // Firestone Import for data storage
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom'; // React Router for navigation

// --- STARTUP LOG ---
console.log('ProjectDashboard Loaded!'); // Confirm component loads

// --- Main Component ---
function ProjectDashboard() {
  // --- Router Hooks ---
  const { id } = useParams(); // Get project ID from URL parameters
  const navigate = useNavigate(); // Hook for navigation between routes

  // --- Load Projects and Transactions ---
  const [project, setProject] = useState(null); // Single project data
  const [transactions, setTransactions] = useState([]); // Store transactions for the project
  const [loading, setLoading] = useState(true); // Tracks loading state

    // --- Fetch Project from Firestore ---

    const fetchProject = async () => {
      setLoading(true); // Start loading

      try {
        const docRef = doc(db, 'projects', id); // Reference Firestore
        const docSnap = await getDoc(docRef); // Fetch data

        if (docSnap.exists()) {
          const data = docSnap.data(); // Assign snapshot data
          console.log('Firestore Data:', data); // Log Firestore data
          console.log('Document Keys:', Object.keys(data || {})); // Debug keys
          console.log('Firestore Document Keys:', Object.keys(docSnap.data() || {}));


          setProject({ id: docSnap.id, ...data }); // Update project state
        } else {
          console.log('Document does NOT exist!');
        }
      } catch (error) {
        console.error('Error fetching project:', error); // Log errors
      } finally {
        setLoading(false); // Stop loading
      }
    };

    // --- Fetch Project Status Firestore ---

    const statusColor = (status) => {
      switch (status) {
        case 'new': return 'primary'; // Blue
        case 'in-progress': return 'success'; // Green
        case 'on-hold': return 'warning'; // Orange
        case 'cancelled': return 'danger'; // Red
        case 'pending': return 'info'; // Light Blue
        case 'completed': return 'secondary'; // Gray
        default: return 'dark';
      }
    };
  
    // --- Fetch Transactions from Firestore ---
    const fetchTransactions = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, `projects/${id}/transactions`));
        const transactionsList = querySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            date: data.date?.toDate ? data.date.toDate().toISOString().split('T')[0] : 'N/A', // Convert Firestore Timestamp
          };
        });
        console.log('Fetched Transactions:', transactionsList); // Log updated transactions
        setTransactions(transactionsList);
      } catch (error) {
        console.error('Error fetching transactions: ', error);
      }
    };

// --- Check and Update Status Based on Transactions ---
const checkAndUpdateStatus = async () => {
  // Prevent changes if status is locked
  const lockedStatuses = ['completed', 'cancelled'];
  if (lockedStatuses.includes(project.status)) {
    console.log(`Status is locked: ${project.status}`);
    return;
  }

  // Check if a deposit exists
  console.log('Transactions:', transactions);
  const hasDeposit = transactions.some(
    (t) =>
      t.category === 'Client Payment' &&
      t.name.toLowerCase().includes('deposit') // Look for 'deposit'
  );

  // Update status to 'in-progress' if conditions are met
  if (hasDeposit && project.status !== 'in-progress') {
    try {
      // Update Firestore
      await updateDoc(doc(db, 'projects', project.id), {
        status: 'in-progress',
        statusDate: new Date(),
      });

      // Update local state
      setProject((prev) => ({
        ...prev,
        status: 'in-progress',
        statusDate: new Date(),
      }));

      console.log('Status updated to In Progress.');
    } catch (error) {
      console.error('Error updating status:', error);
    }
  }
};
  
// --- Load Data When Component Mounts ---
useEffect(() => {
  console.log('useEffect triggered with ID:', id);
  fetchProject(); // Fetch project details
  fetchTransactions(); // Fetch transactions
}, [id]);

// --- Check Status After Transactions Are Loaded ---
useEffect(() => {
  if (!loading && transactions.length > 0) {
    console.log('Transactions loaded. Running status check...');
    checkAndUpdateStatus(); // Run status check only after transactions are loaded
  }
}, [transactions, loading]); // Dependency on transactions and loading state

    
  // --- Navigation Function ---
  const goBack = () => navigate('/'); // Navigate back to the projects list  // --- Transaction States ---
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0], // Default to today
    name: '',
    amount: '',
    category: '',
    type: '',
  });

  const [editingTransaction, setEditingTransaction] = useState(null); // Tracks transaction being edited

  // --- Validate The Transaction Form! ---
  const validateForm = () => {
    let tempErrors = {};
  
    // Check for empty or invalid fields
    if (!newTransaction.date) tempErrors.date = 'Date is required';
    if (!newTransaction.name.trim()) tempErrors.name = 'Description is required';
    if (!newTransaction.amount || Number(newTransaction.amount) <= 0)
      tempErrors.amount = 'Amount must be greater than 0';
    if (!newTransaction.category) tempErrors.category = 'Select a category';
    if (!newTransaction.type) tempErrors.type = 'Select a payment type';
  
    setErrors(tempErrors); // Update error state
    return Object.keys(tempErrors).length === 0; // Returns true if no errors
  };

// --- Add Transaction with Validation ---
const addTransaction = async () => {
  // Perform validation before submission
  if (!validateForm()) return; // Stop if validation fails

  const newTrans = {
    ...newTransaction,
    projectId: id,
    createdAt: new Date(), // Timestamp for sorting
    date: new Date(newTransaction.date), // Explicitly save 'date' field
  };

  try {
    await addDoc(collection(db, `projects/${id}/transactions`), newTrans);
    console.log('New Transaction Added:', newTrans);

// Refresh transactions and check status
await fetchTransactions(); // Refresh transactions
await checkAndUpdateStatus(); // Immediately check and update status



    // Reset form and errors
    setNewTransaction({
      date: new Date().toISOString().split('T')[0],
      name: '',
      amount: '',
      category: '',
      type: '',
    });
    setErrors({}); // Clear errors after successful submission
  } catch (error) {
    console.error('Error adding transaction:', error);
  }
};
const [errors, setErrors] = useState({}); // Tracks validation errors

// --- Start Edit Transaction ---
const startEditTransaction = (transaction) => {
  setEditingTransaction(transaction); // Set the transaction being edited
  console.log('Editing Transaction:', transaction); // Debug log
};

// --- Save Edited Transaction ---
const saveEditTransaction = async () => {
  // Ensure there's a transaction being edited
  if (editingTransaction) {
    try {
      // Reference the specific transaction in Firestore
      const docRef = doc(db, `projects/${id}/transactions`, editingTransaction.id);

      // Update the transaction document with the edited data
      await updateDoc(docRef, editingTransaction); // Save to Firestore

      // Refresh transactions to reflect the edit
      fetchTransactions();

      // Exit edit mode
      setEditingTransaction(null); // Reset editing state
    } catch (error) {
      console.error('Error updating transaction:', error); // Handle errors
    }
  }
};

  const cancelEditTransaction = () => {
    setEditingTransaction(null); // Cancel edit and reset editing state
  };

// --- Delete Transaction ---
const deleteTransaction = async (transactionId) => {
  try {
    // Reference the specific transaction in Firestore
    const docRef = doc(db, `projects/${id}/transactions`, transactionId);

    // Delete the transaction document
    await deleteDoc(docRef);

    // Refresh the transactions list after deletion
    fetchTransactions();
  } catch (error) {
    // Log any errors during Firestore delete
    console.error('Error deleting transaction:', error);
  }
};

  // --- Financial Summary Calculations ---

  // --- Income ---
  const income = transactions
  .filter(t => t.projectId === project?.id && t.category === 'Client Payment') // Filter for client payments
  .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up payment amounts

  // --- Expenses ---
  const expenses = transactions
  .filter(t => t.projectId === project?.id && t.category !== 'Client Payment') // Exclude client payments
  .reduce((sum, t) => sum + Number(t.amount), 0); // Sum up expenses

  // --- Budget Metrics ---
  const remainingBudget = (project?.budget || 0) - expenses;       // Remaining budget based on project allocation
  const availableFunds = income - expenses;                // Available funds after deducting expenses
  const remainingClientPayment = project?.budget - income;  // Remaining amount client still owes

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

 // Loading State
 console.log('Render Debug - Loading:', loading);
 console.log('Render Debug - Project:', project);
 console.log('Render Debug - Transactions:', transactions);
 
 if (loading) {
   return <p>Loading project details...</p>;
 }
 
 if (!project) {
   return <p>Project not found!</p>;
 }

   
return (

<div className="navbar-padding"> {/* Apply padding here */}
  
{/* Sticky Navbar */}
<div className="sticky-navbar bg-dark">
  <div className="container py-3"> {/* Reduced padding for mobile */}
    <div className="row align-items-center">
      {/* Project Name - Mobile Center, Desktop Left */}
      <div className="col-12 col-md-auto text-center text-md-start mb-2 mb-md-0">
        <h1 className="h4 text-white mb-0">{project?.name || 'Project Tracker'}</h1>
      </div>

      {/* Spacer for Desktop Only */}
      <div className="d-none d-md-block col"></div>

      {/* Back Button - Mobile Center, Desktop Right */}
      <div className="col-12 col-md-auto text-center text-md-end navbar-padding-mobile">
        <button
          className="btn btn-light btn-sm"
          onClick={() => navigate('/')}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to Dashboard
        </button>
      </div>
    </div>
  </div>
</div>
  
  <div className="container py-4 mt-5">
    <div className="card mb-4">
    <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
    <div className="d-flex align-items-center">
  <h5 className="mb-0">Project Details</h5>
  <span className={`badge bg-${statusColor(project.status)} ms-3`}>
    {project.status}
  </span>
</div>
  </div>
        <div className="card-body">
        <p><strong>Project:</strong> {project.name}</p> {/* Display project name */}
          <p><strong>Location:</strong> {project.location}</p> {/* Display project location */}
          <p><strong>Budget:</strong> {project?.budget ?? 'N/A'}</p>
          <p><strong>Status:</strong> {project.status}</p> {/* Display project status */}
        </div>
      </div>

{/* Project Status Dropdown */}
<div className="mb-3">
  <label className="form-label">Project Status</label>
  <select
    className="form-select"
    value={project.status}
    onChange={async (e) => {
      const newStatus = e.target.value;

      let note = ''; // For optional status notes
      let confirmed = true; // Default confirmation

      // --- Handle Special Cases ---
      if (newStatus === 'cancelled') {
        note = prompt('Reason for cancellation:');
        confirmed = window.confirm('Are you sure you want to cancel this project?');
      } else if (newStatus === 'on-hold') {
        note = prompt('Add a note for placing the project on hold:');
      } else if (newStatus === 'completed') {
        confirmed = window.confirm('Mark this project as completed? This action is final.');
      }

      // --- Proceed if Confirmed ---
      if (confirmed) {
        try {
          await updateDoc(doc(db, 'projects', project.id), {
            status: newStatus,
            statusDate: new Date(),
            statusNote: note || '', // Save note or empty string
          });

          // Update state locally
          setProject((prev) => ({
            ...prev,
            status: newStatus,
            statusDate: new Date(),
            statusNote: note || '',
          }));

          console.log(`Status updated to: ${newStatus}`);
        } catch (error) {
          console.error('Error updating status:', error);
        }
      }
    }}
  >
    <option value="new">New</option>
    <option value="in-progress">In Progress</option>
    <option value="on-hold">On Hold</option>
    <option value="cancelled">Cancelled</option>
    <option value="pending">Pending</option>
    <option value="completed">Completed</option>
  </select>
</div>


      {/* --- Add Transaction Form --- */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
        <h5 className="mb-0">Add New Transaction</h5>
          </div>
        <div className="card-body">
        <div className="row g-2 align-items-center">
  {/* Date Input */}
  <div className="col-lg-2 col-md-3 col-6">
    <input
      type="date"
      className={`form-control ${errors.date ? 'is-invalid' : ''}`}
      value={newTransaction.date}
      onChange={(e) => setNewTransaction({ ...newTransaction, date: e.target.value })}
    />
    {errors.date && <div className="invalid-feedback">{errors.date}</div>}
  </div>

  {/* Description Input */}
  <div className="col-lg-3 col-md-3 col-6">
    <input
      type="text"
      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
      placeholder="Description"
      value={newTransaction.name}
      onChange={(e) => setNewTransaction({ ...newTransaction, name: e.target.value })}
    />
    {errors.name && <div className="invalid-feedback">{errors.name}</div>}
  </div>

  {/* Amount Input */}
  <div className="col-lg-2 col-md-2 col-6">
    <input
      type="number"
      className={`form-control ${errors.amount ? 'is-invalid' : ''}`}
      placeholder="Amount"
      value={newTransaction.amount}
      onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
    />
    {errors.amount && <div className="invalid-feedback">{errors.amount}</div>}
  </div>

  {/* Category Dropdown */}
  <div className="col-lg-2 col-md-3 col-6">
    <select
      className={`form-select ${errors.category ? 'is-invalid' : ''}`}
      value={newTransaction.category || ''}
      onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })}
    >
      <option value="" disabled>Select Category</option>
      <option value="Client Payment">Client Payment</option>
      <option value="Labour">Labour</option>
      <option value="Materials">Materials</option>
      <option value="Misc Expense">Misc Expense</option>
    </select>
    {errors.category && <div className="invalid-feedback">{errors.category}</div>}
  </div>

  {/* Payment Type Dropdown */}
  <div className="col-lg-2 col-md-3 col-6">
    <select
      className={`form-select ${errors.type ? 'is-invalid' : ''}`}
      value={newTransaction.type || ''}
      onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })}
    >
      <option value="" disabled>Select Type</option>
      <option value="Cash">Cash</option>
      <option value="VISA">VISA</option>
      <option value="E-Transfer">E-Transfer</option>
      <option value="Debit">Debit</option>
    </select>
    {errors.type && <div className="invalid-feedback">{errors.type}</div>}
  </div>

  {/* Add Transaction Button */}
  <div className="col-lg-1 col-md-3 col-6 text-end">
    <button
      className="btn btn-primary btn-sm w-100"
      onClick={addTransaction}
      disabled={Object.keys(errors).length > 0}
    >
      Add
    </button>
  </div>
</div>
        </div>
      </div>

{/* --- Transactions Section --- */}
<div className="card mb-4">
  <div className="card-header bg-info text-white">
    <h5 className="mb-0">Current Transactions</h5>
  </div>
  <div className="card-body">

    {transactions.length === 0 || !project?.id ? (
      // Show message if no transactions exist
      <p className="text-center text-muted">
        No transactions yet. Start by adding your first transaction below!
      </p>
    ) : (
      <>
        {/* Table View for Larger Screens */}
        <div className="d-none d-md-block table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th style={{ width: '15%' }}>Date</th>
                <th style={{ width: '20%' }}>Description</th>
                <th style={{ width: '15%' }}>Amount</th>
                <th style={{ width: '20%' }}>Category</th>
                <th style={{ width: '15%' }}>Type</th>
                <th style={{ width: '15%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(t => (
                <tr key={t.id}>
                  {editingTransaction && editingTransaction.id === t.id ? (
                    // Edit mode - inline editing
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
                    // Read-only mode
                    <>
                      <td>{t.date || 'N/A'}</td>
                      <td>{t.name || 'Unnamed'}</td>
                      <td>${t.amount || 0}</td>
                      <td>{t.category || 'N/A'}</td>
                      <td>{t.type || 'N/A'}</td>
                      <td>
                        <button
                          className="btn btn-warning btn-sm me-2"
                          onClick={() => startEditTransaction(t)}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => deleteTransaction(t.id)}
                        >
                          Delete
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Stacked Cards View for Small Screens */}
        <div className="d-block d-md-none">
          {transactions.map(t => (
            <div key={t.id} className="card mb-2">
              <div className="card-body">
                <h6 className="card-title">{t.name || 'Unnamed'}</h6>
                <p className="card-text">
                  <strong>Date:</strong> {t.date || 'N/A'} <br />
                  <strong>Amount:</strong> ${t.amount || 0} <br />
                  <strong>Category:</strong> {t.category || 'N/A'} <br />
                  <strong>Type:</strong> {t.type || 'N/A'}
                </p>
                <div>
                  <button
                    className="btn btn-warning btn-sm me-2"
                    onClick={() => startEditTransaction(t)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => deleteTransaction(t.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </>
    )}
  </div>
</div>

      {/* --- Financial Summary - Dynamic Visibility --- */}
      {transactions
        .filter(t => t.projectId === project?.id) // Filter transactions by project ID
        .sort((a, b) => new Date(a.date) - new Date(b.date)) // Sort transactions by date
        .length > 0 && ( // Only show summary if there are transactions
        <div className="card mb-4 financial-summary-container">
          <div className="card-header bg-warning text-dark">
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
    </div></div>
  );


}

export default ProjectDashboard;