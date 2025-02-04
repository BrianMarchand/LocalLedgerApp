// File: src/components/GlobalModal.jsx

import React from "react";
import { Modal } from "react-bootstrap";
import "../styles/components/globalModal.css";

const GlobalModal = ({ show, onClose, title, children, ...props }) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      onExited={() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }}
      centered
      dialogClassName="global-modal"
      backdropClassName="global-modal-backdrop"
      {...props}
    >
      {title && (
        <Modal.Header closeButton>
          <Modal.Title>{title}</Modal.Title>
        </Modal.Header>
      )}
      {children}
    </Modal>
  );
};

export default GlobalModal;
