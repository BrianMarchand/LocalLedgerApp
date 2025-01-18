import React from "react";

const BestProjects = ({ bestProjects }) => {
  return (
    <div className="best-projects">
      <h4>🏆 Best Performing Projects</h4>
      {bestProjects.length === 0 ? (
        <p className="text-muted">No data available.</p>
      ) : (
        <ul>
          {bestProjects.map((project, index) => (
            <li key={index} className={`project-item rank-${index + 1}`}>
              <span className="rank-badge">#{index + 1}</span>
              <span className="project-name">{project.name}</span>
              <span className="project-revenue">
                ${project.revenue.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default BestProjects;
