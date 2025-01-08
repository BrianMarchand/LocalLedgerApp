import React from "react";
import { useNavigate } from "react-router-dom";
import "./styles/pages/AppSelector.css"; // Optional for styling

const AppSelector = () => {
  const navigate = useNavigate();

  return (
    <div className="selector-container">
      <h1>Select Your App</h1>
      <div className="selector-buttons">
        <button onClick={() => (window.location.href = "/dashboard")}>
          LocalLedger
        </button>
        <button onClick={() => navigate("/marchand-household")}>
          Marchand Household
        </button>
      </div>
    </div>
  );
};

export default AppSelector;
