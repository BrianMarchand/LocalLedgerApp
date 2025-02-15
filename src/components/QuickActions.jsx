import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";

const QuickActions = ({ onAddProject, onAddTransaction, onAddCustomer }) => {
  return (
    <div className="quick-actions">
      <Button variant="primary" onClick={onAddProject}>
        <i className="bi bi-plus-square"></i>{" "}
        <span className="mx-2">New Project</span>
      </Button>
      <Button variant="secondary mx-2" onClick={onAddTransaction}>
        <i className="bi bi-plus-circle"></i>
        <span className="mx-2">New Transaction</span>
      </Button>
      <Button variant="success" onClick={onAddCustomer}>
        <i className="bi bi-person-plus"></i>{" "}
        <span className="mx-2">New Customer</span>
      </Button>
    </div>
  );
};

QuickActions.propTypes = {
  onAddProject: PropTypes.func,
  onAddTransaction: PropTypes.func,
  onAddCustomer: PropTypes.func,
};

export default QuickActions;
