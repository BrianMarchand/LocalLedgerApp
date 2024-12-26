import React, { useState } from 'react';

function ProjectList() {
const [projects, setProjects] = useState(() => {
  const savedProjects = localStorage.getItem('projects');
  return savedProjects ? JSON.parse(savedProjects) : [];
});  const [newProject, setNewProject] = useState({
    name: '',
    location: '',
    budget: '',
    status: 'Pending',
  });
  const [editingProject, setEditingProject] = useState(null);
  const [selectedProject, setSelectedProject] = useState(() => {
    const savedSelectedProject = localStorage.getItem('selectedProject');
    return savedSelectedProject ? JSON.parse(savedSelectedProject) : null;
  });
  // --- Transaction State ---
const [transactions, setTransactions] = useState(() => {
  const savedTransactions = localStorage.getItem('transactions');
  return savedTransactions ? JSON.parse(savedTransactions) : [];
});  const [newTransaction, setNewTransaction] = useState({
    name: '',
    amount: '',
    category: 'Material',
    type: 'Cash',
  });

  // --- Project Management ---
  const addProject = () => {
    if (newProject.name && newProject.location && newProject.budget) {
      const updatedProjects = [...projects, { ...newProject, id: Date.now() }];
      setProjects(updatedProjects);
      localStorage.setItem('projects', JSON.stringify(updatedProjects)); // Save to localStorage      setNewProject({ name: '', location: '', budget: '', status: 'Pending' });
    }
  };

  const deleteProject = (id) => {
    const updatedProjects = projects.filter(project => project.id !== id);
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects)); // Save to localStorage    setTransactions(transactions.filter(t => t.projectId !== id)); // Remove related transactions
  };

  const startEdit = (project) => {
    setEditingProject({ ...project });
  };

  const saveEdit = () => {
    const updatedProjects = projects.map(project =>
      project.id === editingProject.id ? editingProject : project
    );
    setProjects(updatedProjects);
    localStorage.setItem('projects', JSON.stringify(updatedProjects)); // Save to localStorage
    setEditingProject(null);
  };

  const viewTransactions = (project) => {
    setSelectedProject(project);
    localStorage.setItem('selectedProject', JSON.stringify(project)); // Save to localStorage
  };

  const closeTransactions = () => {
    setSelectedProject(null);
    localStorage.removeItem('selectedProject'); // Clear from localStorage
  };

  // --- Transaction Management ---
  const addTransaction = () => {
    if (newTransaction.name && newTransaction.amount) {
      const updatedTransactions = [
        ...transactions,
        { ...newTransaction, id: Date.now(), projectId: selectedProject.id },
      ];
      setTransactions(updatedTransactions);
      localStorage.setItem('transactions', JSON.stringify(updatedTransactions)); // Save to localStorage
      setNewTransaction({ name: '', amount: '', category: 'Material', type: 'Cash' });
    }
  };

  const deleteTransaction = (id) => {
    const updatedTransactions = transactions.filter(t => t.id !== id);
setTransactions(updatedTransactions);
localStorage.setItem('transactions', JSON.stringify(updatedTransactions)); // Save to localStorage
  };

  // --- Render UI ---
  return (
    <div>
    <h2>Projects</h2>
  
    {editingProject ? (
      <div className="form-container">
        <h3>Edit Project</h3>
        <input
          type="text"
          placeholder="Project Name"
          value={editingProject.name}
          onChange={(e) =>
            setEditingProject({ ...editingProject, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Location"
          value={editingProject.location}
          onChange={(e) =>
            setEditingProject({ ...editingProject, location: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Budget"
          value={editingProject.budget}
          onChange={(e) =>
            setEditingProject({ ...editingProject, budget: e.target.value })
          }
        />
        <select
          value={editingProject.status}
          onChange={(e) =>
            setEditingProject({ ...editingProject, status: e.target.value })
          }
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button onClick={saveEdit}>Save</button>
        <button onClick={() => setEditingProject(null)}>Cancel</button>
      </div>
    ) : (
      <div className="form-container">
        <h3>Add Project</h3>
        <input
          type="text"
          placeholder="Project Name"
          value={newProject.name}
          onChange={(e) =>
            setNewProject({ ...newProject, name: e.target.value })
          }
        />
        <input
          type="text"
          placeholder="Location"
          value={newProject.location}
          onChange={(e) =>
            setNewProject({ ...newProject, location: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Budget"
          value={newProject.budget}
          onChange={(e) =>
            setNewProject({ ...newProject, budget: e.target.value })
          }
        />
        <select
          value={newProject.status}
          onChange={(e) =>
            setNewProject({ ...newProject, status: e.target.value })
          }
        >
          <option value="Pending">Pending</option>
          <option value="In Progress">In Progress</option>
          <option value="Completed">Completed</option>
        </select>
        <button onClick={addProject}>Add Project</button>
      </div>
    )}
  
    {selectedProject ? (
      <div className={`${"transaction-list"}`}>
        <h3>Transactions - {selectedProject.name}</h3>
        <input
          type="text"
          placeholder="Transaction Name"
          value={newTransaction.name}
          onChange={(e) =>
            setNewTransaction({ ...newTransaction, name: e.target.value })
          }
        />
        <input
          type="number"
          placeholder="Amount"
          value={newTransaction.amount}
          onChange={(e) =>
            setNewTransaction({ ...newTransaction, amount: e.target.value })
          }
        />
        <select
  value={newTransaction.category}
  onChange={(e) =>
    setNewTransaction({ ...newTransaction, category: e.target.value })
  }
>
  <option value="Client Payment">Client Payment</option>
  <option value="Labour">Labour</option>
  <option value="Materials">Materials</option>
  <option value="Misc Expense">Misc Expense</option>
</select>
        <select
          value={newTransaction.type}
          onChange={(e) =>
            setNewTransaction({ ...newTransaction, type: e.target.value })
          }
        >
          <option value="Cash">Cash</option>
          <option value="VISA">VISA</option>
          <option value="E-Transfer">E-Transfer</option>
        </select>
        <button onClick={addTransaction}>Add Transaction</button>
        <button onClick={closeTransactions}>Close</button>
        
        <ul>
          {transactions
            .filter(t => t.projectId === selectedProject.id)
            .map(t => (
              <li key={t.id}>
                {t.name} - ${t.amount} ({t.category}, {t.type})
                <button onClick={() => deleteTransaction(t.id)}>Delete</button>
              </li>
            ))}
        </ul>
  
{/* Financial Summary */}
{/* Financial Summary */}
<div className="transaction-total">
  <h4>Financial Summary</h4>

  {/* Budget */}
  <p>Budget: ${selectedProject.budget}</p>

  {/* Total Income */}
  <p>Total Income: $
    {transactions
      .filter(t => t.projectId === selectedProject.id &&
                  t.category === "Client Payment" &&
                  (t.type === "Cash" || t.type === "E-Transfer"))
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Total Expenses */}
  <p>Total Expenses: $
    {transactions
      .filter(t => t.projectId === selectedProject.id &&
                  t.category !== "Client Payment")
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Remaining Budget */}
  <p>Remaining Budget: $
    {selectedProject.budget -
      transactions
        .filter(t => t.projectId === selectedProject.id &&
                    t.category !== "Client Payment")
        .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Available Funds */}
  <p>Available Funds: $
    {transactions
      .filter(t => t.projectId === selectedProject.id &&
                  (t.type === "Cash" || t.type === "E-Transfer"))
      .reduce((sum, t) => sum + Number(t.amount), 0) -
      transactions
        .filter(t => t.projectId === selectedProject.id &&
                    t.category !== "Client Payment")
        .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Remaining Client Payment */}
  <p>Remaining Client Payment: $
    {selectedProject.budget -
      transactions
        .filter(t => t.projectId === selectedProject.id &&
                    t.category === "Client Payment")
        .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Payment Type Summary */}
  <h4>Payment Type Summary</h4>

 {/* Cash Received */}
<p>Cash Received: $
  {transactions
    .filter(t => 
      t.projectId === selectedProject.id &&
      t.type === "Cash" && 
      t.category === "Client Payment" // Only payments received
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)}
</p>

{/* Cash Spent */}
<p>Cash Spent: $
  {transactions
    .filter(t => 
      t.projectId === selectedProject.id &&
      t.type === "Cash" && 
      t.category !== "Client Payment" // All expenses
    )
    .reduce((sum, t) => sum + Number(t.amount), 0)}
</p>

  {/* VISA Expenses */}
  <p>VISA Expenses: $
    {transactions
      .filter(t => t.projectId === selectedProject.id && t.type === "VISA")
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* Debit Expenses */}
  <p>Debit Expenses: $
    {transactions
      .filter(t => t.projectId === selectedProject.id && t.type === "Debit")
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>

  {/* E-Transfer Summary */}
  <p>E-Transfer Income: $
    {transactions
      .filter(t => t.projectId === selectedProject.id &&
                  t.type === "E-Transfer" && t.category === "Client Payment")
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>
  <p>E-Transfer Expenses: $
    {transactions
      .filter(t => t.projectId === selectedProject.id &&
                  t.type === "E-Transfer" && t.category !== "Client Payment")
      .reduce((sum, t) => sum + Number(t.amount), 0)}
  </p>
</div>
      </div>
    ) : (
      <ul>
        {projects.map(project => (
          <li key={project.id}>
            <strong>{project.name}</strong> - {project.location}, Budget: $
            {project.budget}
            <span
              className={`project-status status-${project.status
                .toLowerCase()
                .replace(' ', '-')}`}
            >
              {project.status}
            </span>
            <button onClick={() => viewTransactions(project)}>Transactions</button>
            <button onClick={() => startEdit(project)}>Edit</button>
            <button onClick={() => deleteProject(project.id)}>Delete</button>
          </li>
        ))}
      </ul>
    )}
  </div>
  );
}

export default ProjectList;