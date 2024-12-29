import React from "react";
import { Dropdown } from "react-bootstrap";

const NotificationsDropdown = () => {
  return (
    <Dropdown>
      <Dropdown.Toggle variant="warning" id="dropdown-notifications">
        <i className="bi bi-bell"></i>
        <span className="badge bg-danger ms-2">3</span>
      </Dropdown.Toggle>

      <Dropdown.Menu style={{ width: "300px" }}>
        <Dropdown.Header>Notifications</Dropdown.Header>
        <Dropdown.Item>New Transaction Added</Dropdown.Item>
        <Dropdown.Item>Project Updated</Dropdown.Item>
        <Dropdown.Item>Payment Received</Dropdown.Item>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationsDropdown;
