import React from "react";
import { Dropdown } from "react-bootstrap";

const QuickActionsDropdown = ({ onAddProject }) => {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="primary" id="dropdown-actions">
        <i className="bi bi-lightning-fill me-2"></i> Quick Actions
      </Dropdown.Toggle>

      <Dropdown.Menu>
        <Dropdown.Item onClick={onAddProject}>
          <i className="bi bi-plus-circle-fill me-2 text-success"></i>
          Add New Project
        </Dropdown.Item>
        <Dropdown.Item>
          <i className="bi bi-bar-chart-line-fill me-2 text-info"></i>
          View Reports
        </Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default QuickActionsDropdown;
