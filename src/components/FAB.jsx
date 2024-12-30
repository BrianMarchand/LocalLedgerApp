import React from "react";
import PropTypes from "prop-types";

const FAB = ({ onClick, icon, variant = "primary" }) => {
  return (
    <div className="fab-container">
      <button className={`fab-btn btn btn-${variant}`} onClick={onClick}>
        <i className={`bi ${icon}`}></i>
      </button>
    </div>
  );
};

// Props Validation
FAB.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired, // Example: "bi-plus-circle"
  variant: PropTypes.string, // Bootstrap variants: "primary", "success", "warning"
};

export default FAB;