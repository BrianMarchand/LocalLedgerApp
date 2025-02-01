// --- Page: TransactionsTable.jsx ---

import React, { useState, useEffect } from "react";
import TransactionsList from "./TransactionsList";

const TransactionsTable = ({ transactions, projectId, fetchTransactions }) => {
  const [localTransactions, setLocalTransactions] = useState([]);

  useEffect(() => {
    setLocalTransactions(transactions || []); // Ensure transactions are always an array
  }, [transactions]);

  return (
    <div className="transactions-container">
      {localTransactions.length > 0 ? (
        <TransactionsList transactions={localTransactions} />
      ) : (
        <p className="text-muted">No transactions found.</p>
      )}
    </div>
  );
};

export default TransactionsTable;
