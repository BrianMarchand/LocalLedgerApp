import React, { useEffect, useState, useMemo, useReducer } from "react";
import { collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import { Link } from "react-router-dom";
import { db } from "@config";
import "../../styles/components/CustomersCard.css";
import CustomerModal from "../CustomerModal";
import Swal from "sweetalert2";

const CustomersCard = ({
  customers,
  handleSaveCustomer,
  handleShowModal,
  showCustomerModal,
  handleCloseModal,
  handleEditCustomer,
  handleDeleteCustomer,
}) => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [localCustomers, setLocalCustomers] = useState([]);
  const [, forceUpdate] = useReducer((x) => x + 1, 0);

  const localCustomersMemo = useMemo(() => customers, [customers]);
  useEffect(() => {
    setLocalCustomers(localCustomersMemo);
  }, [localCustomersMemo]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch Projects
        const projectsCollection = collection(db, "projects");
        const projectSnapshot = await getDocs(projectsCollection);
        const projectList = projectSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProjects(projectList);
        setLoading(false);
      } catch (error) {
        console.error("❌ Error fetching data:", error);
        setLoading(false);
      }
    };
    fetchData();
  }, [showCustomerModal]); // Added showCustomerModal to the dependency array

  const getProjectName = (projectId) => {
    const project = projects.find((p) => p.id === projectId);
    return project ? project.name : "N/A";
  };

  const handleOpenModal = (customer = null) => {
    setSelectedCustomer(customer);
    handleShowModal();
  };

  const formatPhoneNumber = (value) => {
    const cleaned = value.replace(/\D/g, ""); // Remove non-numeric chars
    if (cleaned.length <= 3) return `(${cleaned}`;
    if (cleaned.length <= 6)
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  const handleDelete = async (customerId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const customerRef = doc(db, "customers", customerId);
          await deleteDoc(customerRef);

          // Re-fetch customers
          const customersCollection = collection(db, "customers");
          const customerSnapshot = await getDocs(customersCollection);
          const customerList = customerSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLocalCustomers(customerList);
          setTimeout(() => {
            forceUpdate();
          }, 100);

          Swal.fire("Deleted!", "The customer has been deleted.", "success");
        } catch (error) {
          Swal.fire(
            "Error",
            "There was an error deleting this customer",
            "error",
          );
        }
      }
    });
  };

  const getGoogleMapsUrl = (address) => {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  console.log("Customers in CustomersCard:", customers);

  return (
    <div className="global-card">
      {/* Header Section */}
      <div className="customers-header">
        <h5>
          <i className="bi bi-people-fill me-2"></i> Customers
        </h5>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => handleOpenModal()}
        >
          <i className="bi bi-plus-lg"></i> Add Customer
        </button>
      </div>

      <div className="customers-table">
        {/* Table Header */}
        <div className="customers-header-row">
          <div className="customer-header-cell">Name</div>
          <div className="customer-header-cell">Email</div>
          <div className="customer-header-cell">Phone</div>
          <div className="customer-header-cell">Address</div>
          <div className="customer-header-cell">Project</div>
          <div className="customer-header-cell">Actions</div>
        </div>

        {/* Customer Rows */}
        {loading ? (
          <p>Loading customers...</p>
        ) : localCustomers?.length === 0 ? (
          <p>No customers found.</p>
        ) : (
          localCustomers?.map((customer) => (
            <div key={customer.id} className="customer-row">
              <div className="customer-cell">
                {customer.firstName} {customer.lastName}
              </div>

              {/* 🔹 Email Link */}
              <div className="customer-cell">
                <a href={`mailto:${customer.email}`} className="email-link">
                  {customer.email}
                </a>
              </div>

              {/* 🔹 Phone Link */}
              <div className="customer-cell">
                <a href={`tel:${customer.phone}`} className="phone-link">
                  {formatPhoneNumber(customer.phone)}
                </a>
              </div>

              {/* 🔹 Google Maps Address Link */}
              <div className="customer-cell">
                {customer.number &&
                customer.streetName &&
                customer.city &&
                customer.state &&
                customer.postalCode &&
                customer.country ? (
                  <a
                    href={getGoogleMapsUrl(
                      `${customer.number} ${customer.streetName}, ${customer.city}, ${customer.state}, ${customer.postalCode}, ${customer.country}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="address-link"
                  >
                    {`${customer.number} ${customer.streetName}, ${customer.city}, ${customer.state}, ${customer.postalCode}, ${customer.country}`}
                  </a>
                ) : (
                  "N/A"
                )}
              </div>

              {/* 🔹 Project Name (Linked to Project Dashboard) */}
              <div className="customer-cell">
                {customer.projectId ? (
                  <Link
                    to={`/project/${customer.projectId}`}
                    className="project-link"
                  >
                    {getProjectName(customer.projectId)}
                  </Link>
                ) : (
                  "N/A"
                )}
              </div>

              {/* Actions */}
              <div className="customer-cell customer-actions">
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => handleOpenModal(customer)}
                >
                  <i className="bi bi-pencil"></i>
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(customer.id)}
                >
                  <i className="bi bi-trash"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Customer Modal */}
      <CustomerModal
        show={showCustomerModal}
        handleClose={handleCloseModal}
        handleSave={handleSaveCustomer}
        customer={selectedCustomer}
        handleEditCustomer={handleEditCustomer}
      />
    </div>
  );
};

export default CustomersCard;
