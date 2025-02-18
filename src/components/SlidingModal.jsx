// File: src/components/SlidingModal.jsx

import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import "../styles/components/globalModalSlide.css";

const SlidingModal = ({
  show,
  onClose,
  title,
  disableBackdropClick,
  split = true,
  leftContent,
  rightContent,
  children,
  ...props
}) => {
  // Internal state to control mounting independently of parent's show prop
  const [internalShow, setInternalShow] = useState(false);
  // State for controlling the animation class: "slide-in" or "slide-out"
  const [animationClass, setAnimationClass] = useState("");

  useEffect(() => {
    if (show) {
      setInternalShow(true);
      // Use requestAnimationFrame to ensure the modal is mounted first.
      requestAnimationFrame(() => {
        setAnimationClass("slide-in");
      });
    } else {
      if (internalShow) {
        setAnimationClass("slide-out");
        const timer = setTimeout(() => {
          setInternalShow(false);
          onClose();
        }, 500); // 500ms matches the CSS animation duration
        return () => clearTimeout(timer);
      }
    }
  }, [show, onClose, internalShow]);

  if (!internalShow) return null;

  return (
    <Modal
      show={internalShow}
      onHide={() => {
        setAnimationClass("slide-out");
        setTimeout(() => {
          setInternalShow(false);
          onClose();
        }, 500);
      }}
      backdrop={disableBackdropClick ? "static" : true}
      onExited={() => {
        if (document.activeElement) {
          document.activeElement.blur();
        }
      }}
      animation={false}
      dialogClassName={`modal-slide ${animationClass}`}
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

export default SlidingModal;
