// --- Page: Chart Card ---
import React from "react";

const ChartCard = ({ title, children, className = "" }) => {
  return (
    <div className={`col-md-6 ${className}`}>
      <div className="dashboard-chart-card shadow-sm p-3">
        <h4 className="chart-title">{title}</h4>
        <div className="chart-container">{children}</div> {/* Chart Content */}
      </div>
    </div>
  );
};

export default ChartCard;
