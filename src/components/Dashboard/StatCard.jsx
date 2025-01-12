import React from "react";

const StatCard = ({ title, value, icon, className = "" }) => {
  return (
    <div className={`col-md-4 ${className}`}>
      <div className="dashboard-card shadow-sm text-center p-4">
        {icon && (
          <i className={`bi ${icon} stat-icon mb-3`} aria-hidden="true"></i>
        )}
        <h3 className="dashboard-card-title">{title}</h3>
        <p className="dashboard-stat" aria-label={`${title}: ${value}`}>
          {value}
        </p>
      </div>
    </div>
  );
};

export default StatCard;
