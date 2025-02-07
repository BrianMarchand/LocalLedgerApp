import React from "react";
import { Modal } from "react-bootstrap";
import "../styles/components/globalModal.css";

const GlobalModal = ({
  show,
  onClose,
  title,
  disableBackdropClick,
  // New props for split layout:
  split = true,
  leftContent,
  rightContent,
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
      <Modal.Body>
        {split ? (
          <div className="global-modal-container">
            <div className="global-modal-info">{leftContent}</div>
            <div className="global-modal-form">{rightContent}</div>
          </div>
        ) : (
          children
        )}
      </Modal.Body>
    </Modal>
  );
};

export default GlobalModal;
