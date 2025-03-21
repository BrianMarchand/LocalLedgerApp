// --- File: FinancialSummary.jsx ---
import React from "react";

// Helper function to ensure a safe number value
const safeNumber = (value) =>
  typeof value === "number" && !isNaN(value) ? value : 0;

const FinancialSummary = ({
  formatCurrency,
  cashReceived,
  cashSpent,
  totalExpenses,
  remainingBudget,
  availableFunds,
  remainingClientPayment,
  profit,
  budgetSpentPercent,
  totalTransactions,
  daysInProgress,
}) => {
  console.log("Metrics Received by FinancialSummary Component:", {
    cashReceived,
    cashSpent,
    remainingBudget,
    availableFunds,
    remainingClientPayment,
    profit,
    budgetSpentPercent,
    totalTransactions,
    daysInProgress,
  });

  return (
    <div className="global-card h-100">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-graph-up-arrow me-2"></i>Financial Summary
        </h5>
      </div>
      <div className="card-body">
        <ul className="mb-0">
          <li>
            <i className="bi bi-cash-coin me-2"></i>
            <strong>Total Income:</strong>
            <span className="ms-2 text-success">
              {formatCurrency(safeNumber(cashReceived))}
            </span>
          </li>
          <li>
            <i className="bi bi-cart-dash me-2"></i>
            <strong>Total Expenses:</strong>
            <span className="ms-2 text-danger">
              {formatCurrency(safeNumber(totalExpenses))}
            </span>
          </li>
          <li>
            <i className="bi bi-wallet2 me-2"></i>
            <strong>Remaining Budget:</strong>
            <span className="ms-2">
              {formatCurrency(safeNumber(remainingBudget))}
            </span>
          </li>
          <li>
            <i className="bi bi-bank me-2"></i>
            <strong>Available Funds:</strong>
            <span className="ms-2">
              {formatCurrency(safeNumber(availableFunds))}
            </span>
          </li>
          <li>
            <i className="bi bi-cash-stack me-2"></i>
            <strong>Remaining Client Payment:</strong>
            <span className="ms-2">
              {formatCurrency(safeNumber(remainingClientPayment))}
            </span>
          </li>
          <li>
            <i className="bi bi-coin me-2"></i>
            <strong>Profit (Net Balance):</strong>
            <span
              className={`ms-2 ${
                safeNumber(profit) >= 0 ? "text-success" : "text-danger"
              }`}
            >
              {formatCurrency(safeNumber(profit))}
            </span>
          </li>
          <hr />
          <li>
            <i className="bi bi-bar-chart-line me-2"></i>
            <strong>Budget Spent:</strong>
            <span className="ms-2">{safeNumber(budgetSpentPercent)}%</span>
          </li>
          <li>
            <i className="bi bi-list-check me-2"></i>
            <strong>Total Transactions:</strong>
            <span className="ms-2">{safeNumber(totalTransactions)}</span>
          </li>
          <li>
            <i className="bi bi-calendar-check me-2"></i>
            <strong>Days in Progress:</strong>
            <span className="ms-2">
              {Math.floor(safeNumber(daysInProgress))}
            </span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default FinancialSummary;
