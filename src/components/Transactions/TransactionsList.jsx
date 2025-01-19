import { formatFirestoreTimestamp } from "../../utils/formatUtils";

const TransactionsList = ({ transactions }) => {
  return (
    <div className="transactions-table">
      <div className="transactions-header">
        <div className="transaction-cell">Date</div>
        <div className="transaction-cell">Description</div>
        <div className="transaction-cell">Amount</div>
        <div className="transaction-cell">Category</div>
        <div className="transaction-cell">Type</div>
      </div>

      {transactions.length > 0 ? (
        transactions.map((transaction) => (
          <div key={transaction.id} className="transaction-row">
            <div className="transaction-cell">
              {formatFirestoreTimestamp(transaction.date)}
            </div>
            <div className="transaction-cell">{transaction.description}</div>
            <div className="transaction-cell">{transaction.amount}</div>
            <div className="transaction-cell">{transaction.category}</div>
            <div className="transaction-cell">{transaction.type}</div>
          </div>
        ))
      ) : (
        <p className="text-muted">No transactions found.</p>
      )}
    </div>
  );
};
