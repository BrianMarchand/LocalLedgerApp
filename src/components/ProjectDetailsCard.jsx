import React, { useEffect, useState } from "react";
import { calculateProgress } from "../utils/progressUtils"; // Import utility

const ProjectDetailsCard = ({ project, transactions = [] }) => {
  // **State to Hold Transactions After Validation**
  const [validTransactions, setValidTransactions] = useState([]);
  const [progressData, setProgressData] = useState({
    percentage: 0,
    status: "new",
    income: 0,
    expenses: 0,
  });

  // **Load Transactions Safely**
  useEffect(() => {
    // Prefer passed transactions, fallback to project.transactions
    const loadedTransactions = transactions.length
      ? transactions
      : project.transactions || [];

    // **Ensure Transactions Are Valid Before Using Them**
    const validatedTransactions = loadedTransactions.filter(
      (t) => t && t.amount > 0 && t.type && t.category,
    );

    // Update Transactions State
    setValidTransactions(validatedTransactions);

    // **Calculate Progress**
    const result = calculateProgress(project.budget, validatedTransactions);
    setProgressData(result);

    // Debugging Logs
    console.log("Validated Transactions:", validatedTransactions);
    console.log("Progress Data:", result);
  }, [project.budget, transactions, project.transactions]); // Watch for changes

  // **Badge Logic**
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return "badge-primary";
      case "in-progress":
        return "badge-success";
      case "completed":
        return "badge-secondary";
      case "on-hold":
        return "badge-warning";
      case "cancelled":
        return "badge-danger";
      case "over-budget":
        return "badge-danger";
      default:
        return "badge-dark";
    }
  };

  // **Budget Formatting**
  const formatBudgetWithEmoji = (budget) => {
    const formattedBudget = `$${budget?.toLocaleString() || "0"}`;
    return budget > 99999 ? `${formattedBudget} 🎉` : formattedBudget;
  };

  // **Render Card**
  return (
    <div className="global-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5>{project.name || "Unnamed Project"}</h5>
        <span className={`badge ${getStatusBadge(progressData.status)}`}>
          {progressData.status}
        </span>
      </div>
      <div className="card-body">
        <p className="lh-1">
          <i className="bi bi-geo-alt-fill text-primary me-2"></i>
          <strong>Location:</strong> {project.location || "N/A"}
        </p>
        <p className="lh-1">
          <i className="bi bi-bank text-success me-2"></i>
          <strong>Budget:</strong> {formatBudgetWithEmoji(project.budget)}
        </p>
        <p className="lh-1">
          <i className="bi bi-calendar-check text-secondary me-2"></i>
          <strong>Created:</strong>{" "}
          {project.createdAt?.toDate().toLocaleDateString() || "N/A"}
        </p>
        <p className="lh-1">
          <i className="bi bi-card-text text-secondary me-2"></i>
          <strong>Status Note:</strong> {project.statusNote || "No notes."}
        </p>

        {/* Status Dropdown */}
        <div className="lh-1">
          <i className="bi bi-substack text-secondary me-2"></i>
          <label htmlFor="status" className="form-label">
            <strong>Change Status:</strong>
          </label>
          <select
            id="status"
            className="form-select"
            value={project.status || "new"} // Use current status as default
            onChange={(e) => handleStatusChange(e.target.value)} // Pass selection
          >
            <option value="new">New</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="on-hold">On Hold</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Progress Bar */}
        <div className="lh-1">
          <i className="bi bi-graph-up-arrow text text-secondary me-2"></i>
          <strong>Progress:</strong>
          <div className="progress mt-2" style={{ height: "30px" }}>
            {progressData.status === "over-budget" && (
              <p className="text-danger">
                Warning: Expenses exceed budget by $
                {progressData.expenses - progressData.income - project.budget}!
              </p>
            )}
            <div
              className={`progress-bar ${
                progressData.status === "complete"
                  ? "bg-success"
                  : progressData.status === "over-budget"
                    ? "bg-danger"
                    : "bg-primary"
              }`}
              role="progressbar"
              style={{
                width: `${progressData.percentage}%`,
              }}
              aria-valuenow={progressData.percentage}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {`${progressData.percentage}%`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
