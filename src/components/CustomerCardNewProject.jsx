// File: src/components/CustomerCardNewProject.jsx
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import useCustomerForm from "../hooks/useCustomerForm";
import "../styles/components/customerCardNewProject.css";

const CustomerCard = ({ onClose, onSave, initialCustomer = null }) => {
  // Local state to trigger the slide-in/slide-out animation
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    // Trigger the slide-in animation after mount
    setAnimate(true);
  }, []);

  const {
    customerData,
    error,
    currentStep,
    totalSteps,
    handleChange,
    handleNext,
    handleBack,
    handleFinalSubmit,
    isSaving,
  } = useCustomerForm({
    customer: initialCustomer,
    handleSave: onSave,
    handleClose: onClose,
  });

  const getStepCopy = (step) => {
    switch (step) {
      case 1:
        return "Enter your contact information.";
      case 2:
        return "Enter your address details.";
      case 3:
        return "Enter any additional details.";
      default:
        return "";
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      return (
        <>
          <div className="form-group">
            <label htmlFor="firstName">First Name</label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              className={`form-control ${
                error && !customerData.firstName.trim() ? "is-invalid" : ""
              }`}
              value={customerData.firstName}
              onChange={handleChange}
              placeholder="First Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="lastName">Last Name</label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              className={`form-control ${
                error && !customerData.lastName.trim() ? "is-invalid" : ""
              }`}
              value={customerData.lastName}
              onChange={handleChange}
              placeholder="Last Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className={`form-control ${
                error && !customerData.email.trim() ? "is-invalid" : ""
              }`}
              value={customerData.email}
              onChange={handleChange}
              placeholder="you@example.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className={`form-control ${
                error && !customerData.phone.trim() ? "is-invalid" : ""
              }`}
              value={customerData.phone}
              onChange={handleChange}
              placeholder="(123) 456-7890"
            />
          </div>
        </>
      );
    } else if (currentStep === 2) {
      return (
        <>
          <div className="form-group">
            <label htmlFor="streetName">Address</label>
            <input
              type="text"
              id="streetName"
              name="streetName"
              className={`form-control ${
                error && !customerData.streetName.trim() ? "is-invalid" : ""
              }`}
              value={customerData.streetName}
              onChange={handleChange}
              placeholder="Street Name"
            />
          </div>
          <div className="form-group">
            <label htmlFor="city">City</label>
            <input
              type="text"
              id="city"
              name="city"
              className={`form-control ${
                error && !customerData.city.trim() ? "is-invalid" : ""
              }`}
              value={customerData.city}
              onChange={handleChange}
              placeholder="City"
            />
          </div>
          <div className="form-group">
            <label htmlFor="state">State/Province</label>
            <select
              id="state"
              name="state"
              className={`form-control ${
                error && !customerData.state.trim() ? "is-invalid" : ""
              }`}
              value={customerData.state}
              onChange={handleChange}
            >
              <option value="">Select State</option>
              <option value="Ontario">Ontario</option>
              <option value="Quebec">Quebec</option>
              {/* Add more options as needed */}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="postalCode">Postal Code</label>
            <input
              type="text"
              id="postalCode"
              name="postalCode"
              className={`form-control ${
                error && !customerData.postalCode.trim() ? "is-invalid" : ""
              }`}
              value={customerData.postalCode}
              onChange={handleChange}
              placeholder="Postal Code"
            />
          </div>
          <div className="form-group">
            <label htmlFor="country">Country</label>
            <select
              id="country"
              name="country"
              className={`form-control ${
                error && !customerData.country.trim() ? "is-invalid" : ""
              }`}
              value={customerData.country}
              onChange={handleChange}
            >
              <option value="">Select Country</option>
              <option value="Canada">Canada</option>
              <option value="USA">USA</option>
              {/* Add more options as needed */}
            </select>
          </div>
        </>
      );
    } else if (currentStep === 3) {
      return (
        <>
          <div className="form-group">
            <label htmlFor="referredBy">Referred by?</label>
            <input
              type="text"
              id="referredBy"
              name="referredBy"
              className="form-control"
              value={customerData.referredBy}
              onChange={handleChange}
              placeholder="Referral source"
            />
          </div>
          <div className="form-group">
            <label htmlFor="specialConsiderations">
              Special Considerations
            </label>
            <textarea
              id="specialConsiderations"
              name="specialConsiderations"
              className="form-control"
              value={customerData.specialConsiderations}
              onChange={handleChange}
              placeholder="Enter details"
            />
          </div>
          <div className="form-group">
            <label htmlFor="customerNotes">General Notes</label>
            <textarea
              id="customerNotes"
              name="customerNotes"
              className="form-control"
              value={customerData.customerNotes}
              onChange={handleChange}
              placeholder="Enter any additional notes"
            />
          </div>
        </>
      );
    }
  };

  // Animate out on cancel; then call parent's onClose
  const handleCancelClick = () => {
    setAnimate(false);
    setTimeout(() => {
      onClose();
    }, 400); // Match this timeout with the CSS transition duration
  };

  // Wrap final submit to animate out on save
  const handleSaveWithAnimation = async () => {
    const result = await handleFinalSubmit();
    if (result) {
      setAnimate(false);
      setTimeout(() => {
        onSave(customerData);
      }, 400);
    }
  };

  return (
    <div className={`customer-card-container ${animate ? "active" : ""}`}>
      <div className="customer-card-header">
        <h4>Add New Customer</h4>
        <button className="close-btn" onClick={handleCancelClick}>
          &times;
        </button>
      </div>
      <div className="customer-card-body">
        <div className="customer-card-progress">
          <p>
            Step {currentStep} of {totalSteps} – {getStepCopy(currentStep)}
          </p>
          <div className="progress">
            <div
              className="progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
        {error && <div className="alert alert-danger">{error}</div>}
        <div className="customer-card-form">{renderStep()}</div>
      </div>
      <div className="customer-card-footer">
        <Button variant="secondary" onClick={handleCancelClick}>
          Cancel
        </Button>
        {currentStep > 1 && (
          <Button variant="secondary" onClick={handleBack}>
            Back
          </Button>
        )}
        {currentStep < totalSteps ? (
          <Button variant="primary" onClick={handleNext}>
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleSaveWithAnimation}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Customer"}
          </Button>
        )}
      </div>
    </div>
  );
};

export default CustomerCard;
