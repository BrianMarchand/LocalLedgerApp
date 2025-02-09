// File: src/pages/Customers.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "@config";
import Layout from "../../components/Layout";
import ActivityTicker from "../../components/ActivityTicker";
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
  const [recentActivities, setRecentActivities] = useState([]);

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

  useEffect(() => {
    const activitiesQuery = query(
      collection(db, "activity"),
      orderBy("timestamp", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
      const activitiesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentActivities(activitiesList);
    });
    return () => unsubscribe();
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
    if (!newTransaction.projectId) {
      toastError("Please select a project first.");
      return;
    }
    try {
      const transactionsRef = collection(
        db,
        `projects/${newTransaction.projectId}/transactions`
      );
      await addDoc(transactionsRef, {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: new Date(),
      });
      toastSuccess("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      toastError("Failed to add transaction.");
    }
  };

  const formatActivity = (activity) => {
    const dateStr = activity.timestamp
      ? new Date(activity.timestamp.seconds * 1000).toLocaleDateString(
          "en-US",
          {
            day: "numeric",
            month: "long",
            year: "numeric",
          }
        )
      : "";
    let eventType = activity.title || "Event";
    let message = activity.description || "";
    if (activity.type === "new_customer") {
      eventType = "New Customer";
      if (activity.customerName) {
        message = `${activity.customerName} was added.`;
      } else if (activity.description) {
        let desc = activity.description;
        if (desc.startsWith("Customer ")) {
          desc = desc.substring("Customer ".length);
        }
        const idx = desc.indexOf(" with email");
        if (idx !== -1) {
          desc = desc.substring(0, idx);
        }
        message = `${desc.trim()} was added.`;
      }
    }
    return { dateStr, eventType, message };
  };

  const projects = []; // No projects needed for this page

  return (
    <Layout
      pageTitle="Customers"
      activities={recentActivities}
      formatActivity={formatActivity}
      onAddProject={() => setShowProjectModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
        <h1 className="mb-4">Customers</h1>
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
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={handleSaveCustomer}
        handleEditCustomer={handleEditCustomer}
      />
    </Layout>
  );
};

export default Customers;
