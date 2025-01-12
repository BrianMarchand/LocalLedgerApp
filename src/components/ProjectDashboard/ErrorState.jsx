import React from "react";

function ErrorState({ onRetry }) {
  return (
    <div className="text-center">
      <p className="text-danger">An error occurred. Please try again.</p>
      <button className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  );
}

export default ErrorState;
