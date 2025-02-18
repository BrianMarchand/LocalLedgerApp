// File: src/components/GlobalModal.jsx

import React from "react";
import { Modal } from "react-bootstrap";
import "../styles/components/globalModal.css";

const GlobalModal = ({
  show,
  onClose,
  title,
  disableBackdropClick,
  split = true,
  leftContent,
  rightContent,
  leftWidth = "50%",
  rightWidth = "50%",
  leftContainerPadding = "2rem",
  leftPanelClass = "",
  children,
  ...props
}) => {
  return (
    <Modal
      show={show}
      onHide={onClose}
      backdrop={disableBackdropClick ? "static" : true}
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
      <Modal.Body className="p-0">
        {split ? (
          <div className="global-modal-container">
            <div
              className={`global-modal-info ${leftPanelClass}`}
              style={{ width: leftWidth, padding: leftContainerPadding }}
            >
              {leftContent}
            </div>
            <div className="global-modal-form" style={{ width: rightWidth }}>
              {rightContent}
            </div>
          </div>
        ) : (
          children
        )}
      </Modal.Body>
    </Modal>
  );
};

export default GlobalModal;
