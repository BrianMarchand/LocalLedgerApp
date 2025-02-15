// File: src/pages/Customers.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  // ...other imports
} from "firebase/firestore";
import { db } from "@config";
import Layout from "../../components/Layout";
import CustomersCard from "./CustomersCard";
import CustomerModal from "../../components/CustomerModal";
import AddProjectModal from "../../components/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "../../styles/components/Dashboard.css";
import {
  saveNewCustomer,
  updateExistingCustomer,
} from "../../../firebase/customerAPI";

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customerList);
      console.log("Fetched customers:", customerList);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toastError("Failed to fetch customers.");
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSaveCustomer = async (customerData) => {
    try {
      await saveNewCustomer(customerData);
      await fetchCustomers();
      toastSuccess("Customer added successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      toastError("Failed to add customer.");
    }
  };

  const handleEditCustomer = async (customerData) => {
    try {
      await updateExistingCustomer(customerData);
      await fetchCustomers();
      toastSuccess("Customer updated successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error editing customer:", error);
      toastError("Failed to edit customer.");
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const customerRef = doc(db, "customers", customerId);
      await deleteDoc(customerRef);
      await fetchCustomers();
      toastSuccess("Customer deleted successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toastError("Failed to delete customer.");
    }
  };

  const handleTransactionSave = async (newTransaction) => {
    // ...transaction code
  };

  const projects = []; // No projects needed for this page

  return (
    <Layout
      pageTitle="Customers"
      onAddProject={() => setShowProjectModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
        <CustomersCard
          customers={customers}
          handleSaveCustomer={handleSaveCustomer}
          handleShowModal={(customer) => {
            setSelectedCustomer(customer);
            setShowCustomerModal(true);
          }}
          showCustomerModal={showCustomerModal}
          handleCloseModal={() => setShowCustomerModal(false)}
          handleEditCustomer={handleEditCustomer}
          handleDeleteCustomer={handleDeleteCustomer}
        />
      </div>
      <AddProjectModal
        show={showProjectModal}
        handleClose={() => setShowProjectModal(false)}
      />
      <TransactionModal
        show={showTransactionModal}
        handleClose={() => setShowTransactionModal(false)}
        handleSave={handleTransactionSave}
        projects={projects}
      />
      <CustomerModal
        key={selectedCustomer ? selectedCustomer.id : "new"}
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={handleSaveCustomer}
        customer={selectedCustomer}
        handleEditCustomer={handleEditCustomer}
      />
    </Layout>
  );
};

export default Customers;
