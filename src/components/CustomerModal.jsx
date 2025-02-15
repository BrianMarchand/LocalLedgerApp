// File: src/components/CustomerModal.jsx
import React, { useEffect } from "react";
import { Button } from "react-bootstrap";
import GlobalModal from "./GlobalModal";
import "../styles/components/customerModal.css";
import useCustomerForm from "../hooks/useCustomerForm";

const provinces = [
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
];

const countries = [
  "Canada",
  "United States",
  "Mexico",
  "United Kingdom",
  "France",
  "Germany",
  "Spain",
  "Italy",
  "Japan",
  "China",
  "India",
  "Australia",
  "Brazil",
  "Argentina",
  "South Africa",
];

const CustomerModal = ({
  show,
  handleClose,
  handleSave,
  customer,
  handleEditCustomer,
}) => {
  const {
    customerData,
    setCustomerData,
    error,
    projects,
    projectTouched,
    setProjectTouched,
    currentStep,
    totalSteps,
    handleChange,
    formatPhoneNumber,
    handleNext,
    handleBack,
    handleFinalSubmit,
    isSaving,
    addPet,
    updatePet,
    removePet,
    addKid,
    updateKid,
    removeKid,
  } = useCustomerForm({
    customer,
    handleSave,
    handleEditCustomer,
    handleClose,
    show,
  });

  // Pre-populate project association when editing an existing customer.
  // If the customer exists and doesn't already have a projectId in their data,
  // look through the available projects for one whose customerId matches.
  useEffect(() => {
    if (
      customer &&
      projects &&
      projects.length > 0 &&
      !customerData.projectId
    ) {
      const associatedProject = projects.find(
        (project) => project.customerId === customer.id
      );
      if (associatedProject) {
        setCustomerData((prevData) => ({
          ...prevData,
          projectId: associatedProject.id,
        }));
      }
    }
  }, [customer, projects, customerData.projectId, setCustomerData]);

  // Toggle handlers for checkboxes
  const toggleAnyPets = (e) => {
    setCustomerData((prev) => ({
      ...prev,
      anyPets: e.target.checked,
    }));
  };

  const toggleAnyKids = (e) => {
    setCustomerData((prev) => ({
      ...prev,
      anyKids: e.target.checked,
    }));
  };

  const toggleParkingAvailable = (e) => {
    setCustomerData((prev) => ({
      ...prev,
      parkingAvailable: e.target.checked,
    }));
  };

  const getStepCopy = (step) => {
    switch (step) {
      case 1:
        return "Enter your contact information.";
      case 2:
        return "Enter your address details.";
      case 3:
        return "Select an associated project and provide additional details.";
      default:
        return "";
    }
  };

  const renderStep = () => {
    if (currentStep === 1) {
      // Step 1: Contact Information
      return (
        <>
          <div className="auth-form-group">
            <label htmlFor="firstName">First Name</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.firstName.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-person"></i>
                )}
              </span>
              <input
                type="text"
                id="firstName"
                name="firstName"
                className={`form-control ${
                  error && !customerData.firstName.trim() ? "is-invalid" : ""
                }`}
                value={customerData.firstName}
                onChange={handleChange}
                placeholder="John"
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="lastName">Last Name</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.lastName.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-person"></i>
                )}
              </span>
              <input
                type="text"
                id="lastName"
                name="lastName"
                className={`form-control ${
                  error && !customerData.lastName.trim() ? "is-invalid" : ""
                }`}
                value={customerData.lastName}
                onChange={handleChange}
                placeholder="Smith"
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.email.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-envelope"></i>
                )}
              </span>
              <input
                type="email"
                id="email"
                name="email"
                className={`form-control ${
                  error && !customerData.email.trim() ? "is-invalid" : ""
                }`}
                value={customerData.email}
                onChange={handleChange}
                placeholder="yourname@email.com"
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="phone">Phone Number</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.phone.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-telephone"></i>
                )}
              </span>
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
          </div>
        </>
      );
    } else if (currentStep === 2) {
      // Step 2: Address Information
      return (
        <>
          <div className="divider my-3">
            <span>Address Information</span>
          </div>
          <div className="auth-form-group">
            <label htmlFor="streetName">Address</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.streetName.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-geo-alt"></i>
                )}
              </span>
              <input
                type="text"
                id="streetName"
                name="streetName"
                className={`form-control ${
                  error && !customerData.streetName.trim() ? "is-invalid" : ""
                }`}
                value={customerData.streetName}
                onChange={handleChange}
                placeholder="Main Street"
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="city">City</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.city.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-building"></i>
                )}
              </span>
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
          </div>
          <div className="auth-form-group">
            <label htmlFor="state">State/Province</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.state.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-geo"></i>
                )}
              </span>
              <select
                id="state"
                name="state"
                className={`form-control ${
                  error && !customerData.state.trim() ? "is-invalid" : ""
                }`}
                value={customerData.state}
                onChange={handleChange}
              >
                {provinces.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="postalCode">Postal Code</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.postalCode.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-postcard"></i>
                )}
              </span>
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
          </div>
          <div className="auth-form-group">
            <label htmlFor="country">Country</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.country.trim() ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-globe"></i>
                )}
              </span>
              <select
                id="country"
                name="country"
                className={`form-control ${
                  error && !customerData.country.trim() ? "is-invalid" : ""
                }`}
                value={customerData.country}
                onChange={handleChange}
              >
                {countries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      );
    } else if (currentStep === 3) {
      // Step 3: General Info with Pets, Kids, and Parking sections
      return (
        <>
          {/* Project Selection */}
          <div className="auth-form-group">
            <label htmlFor="projectId">Associate with a Project</label>
            <div className="input-container">
              <span className="input-icon">
                <i className="bi bi-folder"></i>
              </span>
              <select
                id="projectId"
                name="projectId"
                className="form-control"
                value={customerData.projectId}
                onChange={(e) => {
                  setProjectTouched(true);
                  handleChange(e);
                }}
              >
                <option value="">Please Select a project</option>
                {projects
                  .filter(
                    (project) =>
                      project.name &&
                      project.name.toLowerCase() !== "placeholder"
                  )
                  .map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="divider my-3">
            <span>General Info</span>
          </div>

          {/* Pets Section */}
          <div className="accordion-section">
            <div className="section-header d-flex align-items-center">
              <div className="form-check form-switch me-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="anyPets"
                  name="anyPets"
                  checked={customerData.anyPets}
                  onChange={toggleAnyPets}
                />
              </div>
              <h5 className="mb-0">Pets</h5>
            </div>
            {customerData.anyPets && (
              <div className="section-content">
                {customerData.pets.map((pet, index) => (
                  <div
                    key={index}
                    className="entry-row d-flex align-items-center gap-2 mb-2"
                  >
                    <select
                      id={`petType_${index}`}
                      name="type"
                      className="form-control"
                      value={pet.type}
                      onChange={(e) => updatePet(index, "type", e.target.value)}
                    >
                      <option value="">Type</option>
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      type="text"
                      id={`petName_${index}`}
                      name="name"
                      className="form-control"
                      value={pet.name}
                      onChange={(e) => updatePet(index, "name", e.target.value)}
                      placeholder="Name"
                    />
                    <select
                      id={`petFriendly_${index}`}
                      name="friendly"
                      className="form-control"
                      value={pet.friendly ? "yes" : "no"}
                      onChange={(e) =>
                        updatePet(index, "friendly", e.target.value === "yes")
                      }
                    >
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    <Button variant="link" onClick={addPet} className="p-0">
                      <i className="bi bi-plus-circle"></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => removePet(index)}
                      className="p-0"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                ))}
                {customerData.pets.length === 0 && (
                  <div className="d-flex align-items-center">
                    <Button variant="link" onClick={addPet} className="p-0">
                      <i className="bi bi-plus-circle"></i> Add a pet
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Kids Section */}
          <div className="accordion-section">
            <div className="section-header d-flex align-items-center">
              <div className="form-check form-switch me-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="anyKids"
                  name="anyKids"
                  checked={customerData.anyKids}
                  onChange={toggleAnyKids}
                />
              </div>
              <h5 className="mb-0">Kids</h5>
            </div>
            {customerData.anyKids && (
              <div className="section-content">
                {customerData.kids.map((kid, index) => (
                  <div
                    key={index}
                    className="entry-row d-flex align-items-center gap-2 mb-2"
                  >
                    <select
                      id={`kidGender_${index}`}
                      name="gender"
                      className="form-control"
                      value={kid.gender}
                      onChange={(e) =>
                        updateKid(index, "gender", e.target.value)
                      }
                    >
                      <option value="">Gender</option>
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                    </select>
                    <input
                      type="text"
                      id={`kidName_${index}`}
                      name="name"
                      className="form-control"
                      value={kid.name}
                      onChange={(e) => updateKid(index, "name", e.target.value)}
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      id={`kidAge_${index}`}
                      name="age"
                      className="form-control"
                      value={kid.age}
                      onChange={(e) => updateKid(index, "age", e.target.value)}
                      placeholder="Age"
                    />
                    <Button variant="link" onClick={addKid} className="p-0">
                      <i className="bi bi-plus-circle"></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={() => removeKid(index)}
                      className="p-0"
                    >
                      <i className="bi bi-trash"></i>
                    </Button>
                  </div>
                ))}
                {customerData.kids.length === 0 && (
                  <div className="d-flex align-items-center">
                    <Button variant="link" onClick={addKid} className="p-0">
                      <i className="bi bi-plus-circle"></i> Add a kid
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Parking Section */}
          <div className="accordion-section">
            <div className="section-header d-flex align-items-center">
              <div className="form-check form-switch me-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="parkingAvailable"
                  name="parkingAvailable"
                  checked={customerData.parkingAvailable}
                  onChange={toggleParkingAvailable}
                />
              </div>
              <h5 className="mb-0">Parking</h5>
            </div>
            {customerData.parkingAvailable && (
              <div className="section-content d-flex align-items-center gap-2">
                <select
                  id="parkingLocation"
                  name="parkingLocation"
                  className="form-control"
                  value={customerData.parkingLocation}
                  onChange={handleChange}
                >
                  <option value="">Location</option>
                  <option value="street">Street</option>
                  <option value="driveway">Driveway</option>
                  <option value="underground">Underground</option>
                  <option value="lot">Lot</option>
                </select>
                <select
                  id="parkingIsPaid"
                  name="parkingIsPaid"
                  className="form-control"
                  value={customerData.parkingIsPaid ? "yes" : "no"}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "parkingIsPaid",
                        value: e.target.value === "yes",
                      },
                    })
                  }
                >
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            )}
          </div>

          {/* Additional Info */}
          <div className="auth-form-group">
            <label htmlFor="referredBy">Referred by?</label>
            <div className="input-container">
              <span className="input-icon">
                <i className="bi bi-person-plus"></i>
              </span>
              <input
                type="text"
                id="referredBy"
                name="referredBy"
                className="form-control"
                value={customerData.referredBy}
                onChange={handleChange}
                placeholder="Enter referral source"
              />
            </div>
          </div>
          <div className="auth-form-group">
            <label htmlFor="specialConsiderations">
              Any special considerations?
            </label>
            <textarea
              id="specialConsiderations"
              name="specialConsiderations"
              className="form-control"
              value={customerData.specialConsiderations}
              onChange={handleChange}
              placeholder="Enter any special considerations"
            />
          </div>
          <div className="auth-form-group">
            <label htmlFor="customerNotes">General Customer Notes</label>
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

  return (
    <GlobalModal
      show={show}
      onClose={handleClose}
      title={customer ? "Edit Customer" : "Add New Customer"}
      leftContent={
        <div className="info-content">
          <h2>
            Step {currentStep} of {totalSteps}
          </h2>
          <p>{getStepCopy(currentStep)}</p>
          <div className="progress-indicator">
            <div
              className="progress-bar"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>
      }
      rightContent={
        <>
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          {renderStep()}
          <div className="modal-footer">
            <Button variant="secondary" type="button" onClick={handleClose}>
              Cancel
            </Button>
            {currentStep > 1 && (
              <Button variant="secondary" type="button" onClick={handleBack}>
                Back
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button variant="primary" type="button" onClick={handleNext}>
                Next
              </Button>
            ) : (
              <Button
                variant="primary"
                type="button"
                onClick={handleFinalSubmit}
                disabled={isSaving}
              >
                {isSaving
                  ? "Saving..."
                  : customer
                    ? "Save Changes"
                    : "Add Customer"}
              </Button>
            )}
          </div>
        </>
      }
    />
  );
};

export default CustomerModal;
