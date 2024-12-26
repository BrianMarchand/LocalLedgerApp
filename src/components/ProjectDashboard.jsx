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
  
    // --- Load Data When Component Mounts ---
    useEffect(() => {
      console.log('useEffect triggered with ID:', id);
      fetchProject(); // Fetch project details
      fetchTransactions(); // Fetch transactions
    }, [id]);
    
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

// --- Add Transaction ---
const addTransaction = async () => {
  if (newTransaction.name && newTransaction.amount && newTransaction.date) { // Ensure date is filled
    const newTrans = {
      ...newTransaction,
      projectId: id,
      createdAt: new Date(), // Timestamp for sorting
      date: new Date(newTransaction.date), // Explicitly save 'date' field
    };

    try {
      await addDoc(collection(db, `projects/${id}/transactions`), newTrans);
      console.log('New Transaction Added:', newTrans);

      await fetchTransactions(); // Refresh transactions
      setNewTransaction({ name: '', amount: '', category: 'Materials', type: 'Cash', date: '' });
    } catch (error) {
      console.error('Error adding transaction:', error);
    }
  } else {
    console.log('Missing required fields for transaction.');
  }
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
  <div className="container py-4">
    <div className="card mb-4">
    <div className="card-header bg-primary text-white">
    <h5 className="mb-0">Project Details</h5>
    </div>
        <div className="card-body">
        <p><strong>Project:</strong> {project.name}</p> {/* Display project name */}
          <p><strong>Location:</strong> {project.location}</p> {/* Display project location */}
          <p><strong>Budget:</strong> {project?.budget ?? 'N/A'}</p>
          <p><strong>Status:</strong> {project.status}</p> {/* Display project status */}
        </div>
      </div>

      {/* --- Add Transaction Form --- */}
      <div className="card mb-4">
        <div className="card-header bg-success text-white">
        <h5 className="mb-0">Add New Transaction</h5>
          </div>
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
          {transactions
            .filter(t => t.projectId === (project?.id || '')) // Safe filter
            .map(t => (
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
                      <button
                        className="btn btn-success btn-sm me-2"
                        onClick={saveEditTransaction}
                      >
                        Save
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={cancelEditTransaction}
                      >
                        Cancel
                      </button>
                    </td>
                  </>
                ) : (
                  // Read-only mode - show transaction details
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
    </div>
  );
}

export default ProjectDashboard;