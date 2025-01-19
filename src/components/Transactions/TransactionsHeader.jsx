import React from "react";

const TransactionsHeader = ({
  filterCategory,
  setFilterCategory,
  handleSort,
  sortColumn,
  sortDirection,
}) => {
  return (
    <div className="transactions-header">
      <h5>Project Transactions</h5>
      <select
        className="form-select form-select-sm w-auto"
        value={filterCategory}
        onChange={(e) => setFilterCategory(e.target.value)}
      >
        <option value="All">All Transactions</option>
        <option value="Client Payment">Client Payment</option>
        <option value="Labour">Labour</option>
        <option value="Materials">Materials</option>
        <option value="Miscellaneous">Miscellaneous</option>
      </select>
    </div>
  );
};

export default TransactionsHeader;
