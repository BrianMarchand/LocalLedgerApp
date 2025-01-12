import React from "react";

const PaymentBreakdown = ({
  formatCurrency,
  cashReceived,
  cashSpent,
  visaExpenses,
  debitExpenses,
  eTransferIncome,
  eTransferExpenses,
  remainingClientPayment,
  paidPercentage,
  largestPayment,
}) => {
  console.log("Metrics Received by PaymentBreakdown Component:", {
    cashReceived,
    cashSpent,
    visaExpenses,
    debitExpenses,
    eTransferIncome,
    eTransferExpenses,
    remainingClientPayment,
    paidPercentage,
    largestPayment,
  });

  return (
    <div className="global-card h-100">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="bi bi-cash-stack me-2"></i>Payment Breakdown
        </h5>
      </div>
      <div className="card-body">
        <ul className="mb-0">
          <li>
            <i className="bi bi-cash me-2"></i>
            <strong>Cash Received:</strong>
            <span className="ms-2">{formatCurrency(cashReceived ?? 0)}</span>
          </li>
          <li>
            <i className="bi bi-wallet me-2"></i>
            <strong>Cash Spent:</strong>
            <span className="ms-2">{formatCurrency(cashSpent ?? 0)}</span>
          </li>
          <li>
            <i className="bi bi-credit-card-2-back me-2"></i>
            <strong>VISA Expenses:</strong>
            <span className="ms-2">{formatCurrency(visaExpenses ?? 0)}</span>
          </li>
          <li>
            <i className="bi bi-credit-card me-2"></i>
            <strong>Debit Expenses:</strong>
            <span className="ms-2">{formatCurrency(debitExpenses ?? 0)}</span>
          </li>
          <li>
            <i className="bi bi-arrow-down-circle me-2"></i>
            <strong>E-Transfer Income:</strong>
            <span className="ms-2">{formatCurrency(eTransferIncome ?? 0)}</span>
          </li>
          <li>
            <i className="bi bi-arrow-up-circle me-2"></i>
            <strong>E-Transfer Expenses:</strong>
            <span className="ms-2">
              {formatCurrency(eTransferExpenses ?? 0)}
            </span>
          </li>
          <hr />
          <li>
            <i className="bi bi-exclamation-circle me-2"></i>
            <strong>Unpaid Balance:</strong>
            <span className="ms-2">
              {formatCurrency(remainingClientPayment ?? 0)}
            </span>
          </li>
          <li>
            <i className="bi bi-bar-chart me-2"></i>
            <strong>Payments Received:</strong>
            <span className="ms-2">{paidPercentage ?? 0}% of Budget</span>
          </li>
          <li>
            <i className="bi bi-piggy-bank-fill me-2"></i>
            <strong>Largest Payment:</strong>
            <span className="ms-2">{formatCurrency(largestPayment ?? 0)}</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default PaymentBreakdown;
