// --- Page: FAB.jsx ---
import React, { useState } from "react";
import PropTypes from "prop-types";
import { OverlayTrigger, Tooltip } from "react-bootstrap";
import "../styles/components/fab.css";

const FAB = ({ actions }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="fab-container">
      {/* Loop through FAB actions */}
      {expanded &&
        actions.map((action, index) => (
          <OverlayTrigger
            key={index}
            placement="left"
            overlay={
              <Tooltip id={`fab-tooltip-${index}`}>{action.tooltip}</Tooltip>
            }
          >
            <button
              className={`fab-btn btn btn-${action.variant}`}
              onClick={() => {
                action.onClick();
                setExpanded(false); // Collapse menu after click
              }}
            >
              <i className={`bi ${action.icon}`}></i>
            </button>
          </OverlayTrigger>
        ))}

      {/* Main FAB Button (toggles menu) */}
      <button
        className="fab-btn btn btn-primary"
        onClick={() => setExpanded(!expanded)}
      >
        <i className={`bi ${expanded ? "bi-x-lg" : "bi-plus-lg"}`}></i>
      </button>
    </div>
  );
};

// Props Validation
FAB.propTypes = {
  actions: PropTypes.arrayOf(
    PropTypes.shape({
      onClick: PropTypes.func.isRequired,
      icon: PropTypes.string.isRequired,
      variant: PropTypes.string.isRequired,
      tooltip: PropTypes.string.isRequired,
    }),
  ).isRequired,
};

export default FAB;
