import React from "react";

const ChartCard = ({ title, children }) => {
  return (
    <div className="col-md-6">
      <div className="dashboard-chart-card shadow-sm p-3">
        <h4 className="chart-title">{title}</h4>
        {children} {/* Chart or Content Goes Here */}
      </div>
    </div>
  );
};

export default ChartCard;
