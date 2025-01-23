// --- Page: QuickActions.jsx

import React from "react";
import { useNavigate } from "react-router-dom";

const QuickActions = ({ onAddProject, onAddTransaction }) => {
  const navigate = useNavigate();

  return (
    <div className="quick-actions">
      <button className="btn btn-primary" onClick={onAddProject}>
        <i className="bi bi-plus-lg"></i> Add Project
      </button>
      <button className="btn btn-success" onClick={onAddTransaction}>
        <i className="bi bi-cash-stack"></i> Add Transaction
      </button>
      <button
        className="btn btn-secondary"
        onClick={() => navigate("/projects")}
      >
        <i className="bi bi-card-list"></i> View All Projects
      </button>
    </div>
  );
};

export default QuickActions;
