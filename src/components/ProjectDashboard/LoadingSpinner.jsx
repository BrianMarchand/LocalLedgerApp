// --- Page: LoadingSpinner.jsx ---

import React from "react";
import PropTypes from "prop-types";
import { ProgressBar } from "react-loader-spinner";

// --- LoadingSpinner Component ---
const LoadingSpinner = ({
  text = "Loading...",
  height = "100vh",
  spinnerHeight = 80,
  spinnerWidth = 200,
  borderColor = "#4A90E2",
  barColor = "#4A90E2",
}) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height, // Dynamic height
        flexDirection: "column",
      }}
    >
      <ProgressBar
        height={spinnerHeight} // Dynamic spinner height
        width={spinnerWidth} // Dynamic spinner width
        ariaLabel="progress-bar-loading"
        borderColor={borderColor} // Dynamic border color
        barColor={barColor} // Dynamic bar color
      />
      <p style={{ marginTop: "10px" }}>{text}</p>
    </div>
  );
};

// --- PropTypes for Validation ---
LoadingSpinner.propTypes = {
  text: PropTypes.string,
  height: PropTypes.string,
  spinnerHeight: PropTypes.number,
  spinnerWidth: PropTypes.number,
  borderColor: PropTypes.string,
  barColor: PropTypes.string,
};

// Default export
export default LoadingSpinner;
