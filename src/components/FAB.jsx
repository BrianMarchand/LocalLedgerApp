import React from "react";
import PropTypes from "prop-types";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import "../styles/components/fab.css";

const FAB = ({ onClick, icon, variant = "primary", tooltip }) => {
  return (
    <div className="fab-container">
      <OverlayTrigger
        placement="left" // Tooltip position
        overlay={<Tooltip id="fab-tooltip">{tooltip}</Tooltip>}
      >
        <button className={`fab-btn btn btn-${variant}`} onClick={onClick}>
          <i className={`bi ${icon}`}></i>
        </button>
      </OverlayTrigger>
    </div>
  );
};

// Props Validation
FAB.propTypes = {
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string.isRequired,
  variant: PropTypes.string,
  tooltip: PropTypes.string, // Tooltip text
};

export default FAB;
