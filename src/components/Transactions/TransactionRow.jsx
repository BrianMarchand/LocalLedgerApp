// --- Page: TransactionRow.jsx ---

import React from "react";
import { formatDate, formatCurrency } from "../../utils/formatUtils";

const TransactionRow = ({ transaction, onEdit, onDelete }) => {
  return (
    <div className="transaction-row">
      <div className="transaction-cell">{formatDate(transaction.date)}</div>
      <div className="transaction-cell">{transaction.description}</div>
      <div className="transaction-cell">
        {formatCurrency(transaction.amount)}
      </div>
      <div className="transaction-cell">{transaction.category}</div>
      <div className="transaction-cell">{transaction.type}</div>
      <div className="transaction-cell">
        <button
          className="btn btn-warning btn-sm"
          onClick={() => onEdit(transaction)}
        >
          <i className="bi bi-pencil-square"></i>
        </button>
        <button
          className="btn btn-danger btn-sm"
          onClick={() => onDelete(transaction.id)}
        >
          <i className="bi bi-trash"></i>
        </button>
      </div>
    </div>
  );
};

export default TransactionRow;
