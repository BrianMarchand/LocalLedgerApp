import React from 'react';
import PropTypes from 'prop-types';
import { Button } from 'react-bootstrap';

const QuickActions = ({ onAddProject, onAddTransaction, onAddCustomer }) => {
  return (
    <div className="quick-actions">
      <Button variant="primary" onClick={onAddProject}>
        Add Project
      </Button>
      <Button variant="secondary" onClick={onAddTransaction}>
        Add Transaction
      </Button>
      <Button variant="success" onClick={onAddCustomer}>
        Add New Customer
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