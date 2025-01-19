import React, { useState } from "react";
import { formatDate, formatCurrency } from "../../utils/formatUtils";

const TransactionsMobileView = ({ transactions, onEdit, onDelete }) => {
  const [expandedTransaction, setExpandedTransaction] = useState(null);

  return (
    <>
      {transactions.map((transaction) => (
        <div key={transaction.id} className="transaction-card">
          <div className="transaction-card-header">
            <span>{formatDate(transaction.date)}</span>
            <span>{formatCurrency(transaction.amount)}</span>
            <i
              className={`bi ${expandedTransaction === transaction.id ? "bi-eye-slash" : "bi-eye"} expand-icon`}
              onClick={() =>
                setExpandedTransaction(
                  expandedTransaction === transaction.id
                    ? null
                    : transaction.id,
                )
              }
            ></i>
          </div>
          {expandedTransaction === transaction.id && (
            <div className="transaction-card-body">
              <p>
                <strong>Category:</strong> {transaction.category}
              </p>
              <p>
                <strong>Description:</strong> {transaction.description}
              </p>
              <button
                className="btn btn-warning btn-sm me-2"
                onClick={() => onEdit(transaction)}
              >
                <i className="bi bi-pencil"></i>
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => onDelete(transaction.id)}
              >
                <i className="bi bi-trash"></i>
              </button>
            </div>
          )}
        </div>
      ))}
    </>
  );
};

export default TransactionsMobileView;
