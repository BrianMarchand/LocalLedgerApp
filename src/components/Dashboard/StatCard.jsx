import React from "react";

const StatCard = ({ title, value, icon }) => {
  return (
    <div className="col-md-4">
      <div className="dashboard-card shadow-sm text-center p-4">
        {icon && <i className={`bi ${icon} stat-icon mb-3`}></i>}{" "}
        {/* Optional Icon */}
        <h3 className="dashboard-card-title">{title}</h3>
        <p className="dashboard-stat">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
