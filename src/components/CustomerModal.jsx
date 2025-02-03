// File: src/components/CustomerModal.jsx
import React, { useState, useEffect } from "react";
import { Button } from "react-bootstrap";
import GlobalModal from "./GlobalModal";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@config";
import "../styles/components/customerModal.css";
import { logActivity } from "../utils/activityLogger";

const CustomerModal = ({
  show,
  handleClose,
  handleSave,
  customer,
  handleEditCustomer,
}) => {
  // Local error state (for inline validation errors)
  const [error, setError] = useState("");

  // Local customer data state with all fields
  const [customerData, setCustomerData] = useState({
    projectId: "", // Step 1
    firstName: "", // Step 2
    lastName: "",
    email: "",
    phone: "",
    streetName: "", // Step 3
    city: "",
    state: "Ontario",
    postalCode: "",
    country: "",
    // Step 4: General Info fields (optional)
    anyPets: false,
    anyKids: false,
    parkingAvailable: false,
    referredBy: "",
    specialConsiderations: "",
    customerNotes: "",
  });

  const [projects, setProjects] = useState([]);

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

  // Multi-step state: 1 = Project, 2 = Contact, 3 = Address, 4 = General Info
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Fetch projects when the modal mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsCollection = collection(db, "projects");
        const projectSnapshot = await getDocs(projectsCollection);
        const projectList = projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
      } catch (err) {
        console.error("Error fetching projects:", err);
      }
    };

    fetchProjects();
  }, []);

  // Pre-fill customer data if editing; reset error and step to 1
  useEffect(() => {
    if (customer) {
      setCustomerData({
        id: customer.id,
        projectId: customer.projectId || "",
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: formatPhoneNumber(customer.phone || ""),
        streetName: customer.streetName || "",
        city: customer.city || "",
        state: customer.state || "Ontario",
        postalCode: customer.postalCode || "",
        country: customer.country || "",
        anyPets: customer.anyPets ?? false,
        anyKids: customer.anyKids ?? false,
        parkingAvailable: customer.parkingAvailable ?? false,
        referredBy: customer.referredBy || "",
        specialConsiderations: customer.specialConsiderations || "",
        customerNotes: customer.customerNotes || "",
      });
    } else {
      setCustomerData({
        projectId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        streetName: "",
        city: "",
        state: "Ontario",
        postalCode: "",
        country: "",
        anyPets: false,
        anyKids: false,
        parkingAvailable: false,
        referredBy: "",
        specialConsiderations: "",
        customerNotes: "",
      });
    }
    setError("");
    setCurrentStep(1);
  }, [customer]);

  // Live phone number formatting function
  const formatPhoneNumber = (value) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(
      6,
      10
    )}`;
  };

  // Update state on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate required fields for the current step
  const validateCurrentStep = () => {
    if (currentStep === 1) {
      // Step 1: Validate that a project is selected
      if (!customerData.projectId) {
        setError("Please select an associated project.");
        return false;
      }
    } else if (currentStep === 2) {
      // Step 2: Validate required contact info fields
      if (
        !customerData.firstName.trim() ||
        !customerData.lastName.trim() ||
        !customerData.email.trim() ||
        !customerData.phone.trim()
      ) {
        setError("Please fill in all required contact info fields.");
        return false;
      }
    } else if (currentStep === 3) {
      // Step 3: Validate required address fields
      if (
        !customerData.streetName.trim() ||
        !customerData.city.trim() ||
        !customerData.state.trim() ||
        !customerData.postalCode.trim() ||
        !customerData.country.trim()
      ) {
        setError("Please fill in all required address fields.");
        return false;
      }
    }
    // No required validation for Step 4 (General Info)
    setError("");
    return true;
  };

  // Handler for the Next button
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  // Handler for the Back button
  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Final submission handler (when on Step 4)
  const handleSubmit = async (e) => {
    e.preventDefault();
    // Final check for required fields in steps 1-3
    if (
      !customerData.projectId ||
      !customerData.firstName.trim() ||
      !customerData.lastName.trim() ||
      !customerData.email.trim() ||
      !customerData.phone.trim() ||
      !customerData.streetName.trim() ||
      !customerData.city.trim() ||
      !customerData.state.trim() ||
      !customerData.postalCode.trim() ||
      !customerData.country.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }
    try {
      if (customer && customer.id) {
        await handleEditCustomer(customerData);
        await logActivity(
          "Customer Updated",
          `Customer ${customerData.firstName} ${customerData.lastName} was updated.`
        );
      } else {
        await handleSave(customerData);
        await logActivity(
          "New Customer",
          `${customerData.firstName} ${customerData.lastName} was added.`
        );
      }
      handleClose();
    } catch (err) {
      console.error("Error saving customer:", err);
      setError("There was an error. Please try again.");
    }
  };

  // Helper function to get copy text based on the current step
  const getStepCopy = (step) => {
    switch (step) {
      case 1:
        return "Select an associated project.";
      case 2:
        return "Enter your contact information.";
      case 3:
        return "Enter your address details.";
      case 4:
        return "Provide any additional general info.";
      default:
        return "";
    }
  };

  // Render form fields based on the current step
  const renderStep = () => {
    if (currentStep === 1) {
      // Step 1: Associated Project selection
      return (
        <>
          <div className="auth-form-group">
            <label htmlFor="projectId">Associate with a Project</label>
            <div className="input-container">
              <span className="input-icon">
                {error && !customerData.projectId ? (
                  <i className="bi bi-exclamation-triangle-fill"></i>
                ) : (
                  <i className="bi bi-folder"></i>
                )}
              </span>
              <select
                id="projectId"
                name="projectId"
                className={`form-control ${
                  error && !customerData.projectId ? "is-invalid" : ""
                }`}
                value={customerData.projectId}
                onChange={handleChange}
              >
                <option value="" hidden></option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </>
      );
    } else if (currentStep === 2) {
      // Step 2: Contact Information
      return (
        <>
          <div className="divider my-3">
            <span>Contact Information</span>
          </div>
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
    } else if (currentStep === 3) {
      // Step 3: Address Information
      return (
        <>
          <div className="divider my-3">
            <span>Address Information</span>
          </div>
          <div className="auth-form-group">
            <label htmlFor="streetName">Street Name</label>
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
    } else if (currentStep === 4) {
      // Step 4: General Info (optional fields)
      return (
        <>
          <div className="divider my-3">
            <span>General Info</span>
          </div>
          <div className="form-check form-switch mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="anyPets"
              name="anyPets"
              checked={customerData.anyPets}
              onChange={(e) =>
                setCustomerData((prev) => ({
                  ...prev,
                  anyPets: e.target.checked,
                }))
              }
            />
            <label className="form-check-label" htmlFor="anyPets">
              Any Pets?
            </label>
          </div>
          <div className="form-check form-switch mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="anyKids"
              name="anyKids"
              checked={customerData.anyKids}
              onChange={(e) =>
                setCustomerData((prev) => ({
                  ...prev,
                  anyKids: e.target.checked,
                }))
              }
            />
            <label className="form-check-label" htmlFor="anyKids">
              Any Kids?
            </label>
          </div>
          <div className="form-check form-switch mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="parkingAvailable"
              name="parkingAvailable"
              checked={customerData.parkingAvailable}
              onChange={(e) =>
                setCustomerData((prev) => ({
                  ...prev,
                  parkingAvailable: e.target.checked,
                }))
              }
            />
            <label className="form-check-label" htmlFor="parkingAvailable">
              Is there parking available?
            </label>
          </div>
          <div className="auth-form-group">
            <label htmlFor="referredBy">Referred by?</label>
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
    >
      <div className="customer-modal-container">
        {/* Left Side: Info & Progress */}
        <div className="customer-modal-info">
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
        </div>
        {/* Right Side: Form */}
        <div className="customer-modal-form">
          <form onSubmit={handleSubmit} noValidate>
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}
            {renderStep()}
            <div className="modal-footer">
              <Button variant="secondary" onClick={handleClose}>
                Cancel
              </Button>
              {currentStep > 1 && (
                <Button variant="secondary" onClick={handleBack}>
                  Back
                </Button>
              )}
              {currentStep < totalSteps ? (
                <Button variant="primary" type="button" onClick={handleNext}>
                  Next
                </Button>
              ) : (
                <Button variant="primary" type="submit">
                  {customer ? "Save Changes" : "Add Customer"}
                </Button>
              )}
            </div>
          </form>
        </div>
      </div>
    </GlobalModal>
  );
};

export default CustomerModal;
