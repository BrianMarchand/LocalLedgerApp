import React from "react";

const ProjectDetailsCard = ({ project }) => {
  const getStatusBadge = (status) => {
    switch (status) {
      case "new":
        return "badge bg-secondary";
      case "in-progress":
        return "badge bg-primary";
      case "completed":
        return "badge bg-success";
      case "on-hold":
        return "badge bg-warning";
      case "cancelled":
        return "badge bg-danger";
      default:
        return "badge bg-light";
    }
  };

  return (
    <div className="global-card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5>{project.name || "Unnamed Project"}</h5>
        <span className={`badge ${getStatusBadge(project.status)}`}>
          {project.status || "N/A"}
        </span>
      </div>
      <div className="card-body">
        <p>
          <strong>Location:</strong> {project.location || "N/A"}
        </p>
        <p>
          <strong>Budget:</strong> ${project.budget?.toLocaleString() || "0"}
        </p>
        <p>
          <strong>Created:</strong>{" "}
          {project.createdAt?.toDate().toLocaleDateString() || "N/A"}
        </p>
        <p>
          <strong>Status Note:</strong> {project.statusNote || "No notes."}
        </p>
      </div>
    </div>
  );
};

export default ProjectDetailsCard;
