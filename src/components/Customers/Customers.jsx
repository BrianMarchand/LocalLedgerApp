// File: src/pages/Customers.jsx

import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  setDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "@config";
import Navbar from "../../components/Navbar"; // Adjust the path as needed
import CustomersCard from "./CustomersCard"; // Adjust path if necessary
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";

const Customers = () => {
  // State to hold customers and modal visibility
  const [customers, setCustomers] = useState([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // --- Helper Function: Fetch Customers from Firestore ---
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

  // --- Fetch Customers on Component Mount ---
  useEffect(() => {
    fetchCustomers();
  }, []);

  // --- Handler: Save New Customer ---
  const handleSaveCustomer = async (customerData) => {
    try {
      const customersRef = collection(db, "customers");
      await addDoc(customersRef, customerData);
      await fetchCustomers(); // Refresh customer list
      toastSuccess("Customer added successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      toastError("Failed to add customer.");
    }
  };

  // --- Handler: Edit Existing Customer ---
  const handleEditCustomer = async (customerData) => {
    try {
      const customerRef = doc(db, "customers", customerData.id);
      await setDoc(customerRef, customerData);
      await fetchCustomers(); // Refresh customer list
      toastSuccess("Customer updated successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error editing customer:", error);
      toastError("Failed to edit customer.");
    }
  };

  // --- Handler: Delete a Customer ---
  const handleDeleteCustomer = async (customerId) => {
    try {
      const customerRef = doc(db, "customers", customerId);
      await deleteDoc(customerRef);
      await fetchCustomers(); // Refresh customer list
      toastSuccess("Customer deleted successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error deleting customer:", error);
      toastError("Failed to delete customer.");
    }
  };

  return (
    <div>
      {/* Global Navbar */}
      <Navbar page="customers" />

      <div className="container mt-5">
        {/* Page Heading */}
        <h1 className="text-center mb-4">Customers</h1>

        {/* Customers Card Component */}
        {/* This component is reused from the dashboard and displays a table or detailed list */}
        <CustomersCard
          customers={customers}
          handleSaveCustomer={handleSaveCustomer}
          handleShowModal={() => setShowCustomerModal(true)}
          showCustomerModal={showCustomerModal}
          handleCloseModal={() => setShowCustomerModal(false)}
          handleEditCustomer={handleEditCustomer}
          handleDeleteCustomer={handleDeleteCustomer}
        />
      </div>
    </div>
  );
};

export default Customers;