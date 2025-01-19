// --- Page: LoadingSpinner.jsx ---

import React from "react";
import { ProgressBar } from "react-loader-spinner";

const LoadingSpinner = ({ text = "Loading..." }) => {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        flexDirection: "column",
      }}
    >
      <ProgressBar
        height="80"
        width="200"
        ariaLabel="progress-bar-loading"
        borderColor="#4A90E2"
        barColor="#4A90E2"
      />
      <p style={{ marginTop: "10px" }}>{text}</p>
    </div>
  );
};

// Default export
export default LoadingSpinner;
