import React, { useState, useEffect } from "react";
import { Modal, Button } from "react-bootstrap";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@config";
import "../styles/components/customerModal.css";
import Swal from "sweetalert2";

const CustomerModal = ({
  show,
  handleClose,
  handleSave,
  customer,
  handleEditCustomer,
}) => {
  const [customerData, setCustomerData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    number: "",
    streetName: "",
    city: "",
    state: "Ontario",
    postalCode: "",
    country: "Canada",
    projectId: "",
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

  // ✅ Fetch projects when modal opens
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
      } catch (error) {
        console.error("❌ Error fetching projects:", error);
        Swal.fire({
          icon: "error",
          title: "Error Fetching Projects",
          text: "Failed to fetch projects. Please try again.",
        });
      }
    };

    fetchProjects();
  }, []);

  // ✅ Ensure Address Field is Pre-Filled Correctly
  useEffect(() => {
    if (customer) {
      setCustomerData({
        id: customer.id,
        firstName: customer.firstName || "",
        lastName: customer.lastName || "",
        email: customer.email || "",
        phone: formatPhoneNumber(customer.phone || ""),
        number: customer.number || "",
        streetName: customer.streetName || "",
        city: customer.city || "",
        state: customer.state || "Ontario",
        postalCode: customer.postalCode || "",
        country: customer.country || "Canada",
        projectId: customer.projectId || "",
      });
    } else {
      setCustomerData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        number: "",
        streetName: "",
        city: "",
        state: "Ontario",
        postalCode: "",
        country: "Canada",
        projectId: "",
      });
    }
  }, [customer]);

  // 🔹 Format phone number (Live formatting)
  const formatPhoneNumber = (value) => {
    if (!value) return "";
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric chars
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let formattedValue = value;
    if (name === "phone") {
      formattedValue = formatPhoneNumber(value);
    }
    setCustomerData((prev) => ({
      ...prev,
      [name]: formattedValue ?? "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (
        !customerData.firstName ||
        !customerData.lastName ||
        !customerData.email ||
        !customerData.phone ||
        !customerData.number ||
        !customerData.streetName ||
        !customerData.city ||
        !customerData.state ||
        !customerData.postalCode ||
        !customerData.country
      ) {
        Swal.fire({
          icon: "warning",
          title: "Missing Information",
          text: "Please fill in all required fields.",
        });
        return;
      }

      if (customer?.id) {
        await handleEditCustomer(customerData);
      } else {
        await handleSave(customerData);
      }

      handleClose();
      Swal.fire({
        icon: "success",
        title: customer ? "Customer Updated!" : "Customer Added!",
        showConfirmButton: false,
        timer: 1500,
      });
    } catch (error) {
      console.error("Error adding/editing customer:", error);
      Swal.fire({
        icon: "error",
        title: customer ? "Error Updating Customer!" : "Error Adding Customer!",
        text: "There was an error. Please try again.",
      });
    }
  };

  return (
    <Modal show={show} onHide={handleClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          {customer ? "Edit Customer" : "Add New Customer"}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} noValidate className="modern-form">
          <fieldset>
            <legend>Contact Info</legend>
            <div className="row">
              <div className="input-group col-md-6">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  placeholder=" "
                  value={customerData.firstName || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="firstName">First Name</label>
              </div>

              <div className="input-group col-md-6">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  placeholder=" "
                  value={customerData.lastName || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="lastName">Last Name</label>
              </div>
            </div>
            <div className="row">
              <div className="input-group col-md-6">
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder=" "
                  value={customerData.email || ""}
                  onChange={handleChange}
                  required
                  autoComplete="email"
                />
                <label htmlFor="email">Email</label>
              </div>

              <div className="input-group col-md-6">
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  placeholder=" "
                  value={customerData.phone || ""}
                  onChange={handleChange}
                  required
                  pattern="\(\d{3}\) \d{3}-\d{4}"
                  autoComplete="tel"
                />
                <label htmlFor="phone">Phone Number</label>
              </div>
            </div>

            <legend>Address</legend>
            {/* Address Row 1 */}
            <div className="row">
              <div className="input-group col-md-3">
                <input
                  type="text"
                  id="number"
                  name="number"
                  placeholder=" "
                  value={customerData.number || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="number">Number</label>
              </div>
              <div className="input-group col-md-9">
                <input
                  type="text"
                  id="streetName"
                  name="streetName"
                  placeholder=" "
                  value={customerData.streetName || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="streetName">Street Name</label>
              </div>
            </div>
            {/* Address Row 2 */}
            <div className="row">
              <div className="input-group col-md-6">
                <select
                  id="state"
                  name="state"
                  value={customerData.state || "Ontario"}
                  onChange={handleChange}
                  required
                >
                  {provinces.map((province) => (
                    <option key={province} value={province}>
                      {province}
                    </option>
                  ))}
                </select>
                <label htmlFor="state">State/Province</label>
              </div>
              <div className="input-group col-md-6">
                <input
                  type="text"
                  id="city"
                  name="city"
                  placeholder=" "
                  value={customerData.city || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="city">City</label>
              </div>
            </div>
            {/* Address Row 3 */}
            <div className="row">
              <div className="input-group col-md-6">
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  placeholder=" "
                  value={customerData.postalCode || ""}
                  onChange={handleChange}
                  required
                />
                <label htmlFor="postalCode">Postal Code</label>
              </div>
              <div className="input-group col-md-6">
                <select
                  id="country"
                  name="country"
                  value={customerData.country || "Canada"}
                  onChange={handleChange}
                  required
                >
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <label htmlFor="country">Country</label>
              </div>
            </div>

            <legend>Associated Projects</legend>
            {/* 🔹 Associate with Project (Dropdown - Label Stays at Top) */}
            <div className="input-group">
              <select
                id="projectId"
                name="projectId"
                value={customerData.projectId || ""}
                onChange={handleChange}
                required
              >
                <option value="" hidden></option>{" "}
                {/* Empty option to trigger floating effect */}
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              <label htmlFor="projectId">Associate with Project</label>
            </div>
          </fieldset>
          {/* 🔹 Buttons */}
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {customer ? "Save Changes" : "Add Customer"}
            </Button>
          </Modal.Footer>
        </form>
      </Modal.Body>
    </Modal>
  );
};

export default CustomerModal;
