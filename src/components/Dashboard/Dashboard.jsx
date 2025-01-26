// --- Page: Dashboard.jsx ---
import React, { useEffect, useState } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
} from "firebase/firestore"; // Import getDocs
import { db } from "@config";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "./Dashboard.css";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import Navbar from "../../components/Navbar";
import AddProjectModal from "../../components/AddProject/AddProjectModal";
import QuickActions from "../../components/QuickActions";
import FinancialInsights from "./FinancialInsights";
import NotificationsPanel from "./NotificationsPanel";
import BestProjects from "./BestProjects";
import ChartCard from "./ChartCard";
import CalendarWidget from "./CalendarWidget";
import TransactionModal from "../../components/TransactionModal";
import { useProjects } from "../../context/ProjectsContext";
import CustomersCard from "../Customers/CustomersCard";
import { setDoc } from "firebase/firestore";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects, loading } = useProjects();
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState({});
  const [yearlyPerformanceData, setYearlyPerformanceData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [bestProjects, setBestProjects] = useState([]);
  // State for customer modal
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customers, setCustomers] = useState([]);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const customersCollection = collection(db, "customers");
        const customerSnapshot = await getDocs(customersCollection);
        const customerList = customerSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setCustomers(customerList);
        console.log("Customers fetched on Dashboard load:", customerList);
      } catch (error) {
        console.error("Error fetching customers in Dashboard:", error);
      }
    };

    fetchCustomers();
  }, []);

  // 🔄 Filter Projects
  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // 🔔 Generate Alerts
  useEffect(() => {
    if (!filteredProjects.length) {
      setAlerts([]);
      return;
    }

    let newAlerts = [];

    filteredProjects.forEach((proj) => {
      let totalSpent = 0;
      let totalRevenue = 0;

      if (proj.transactions && Array.isArray(proj.transactions)) {
        proj.transactions.forEach((txn) => {
          const amount = parseFloat(txn.amount) || 0;
          if (txn.category === "Client Payment") {
            totalRevenue += amount;
          } else {
            totalSpent += amount;
          }
        });
      }

      if (totalRevenue === 0 && (proj.transactions?.length || 0) > 0) {
        // ✅ Now Safe
        newAlerts.push({
          type: "payment",
          message: `❌ ${proj.name} has expenses but no payments.`,
        });
      }
    });

    setAlerts(newAlerts);
  }, [filteredProjects]);

  // 📊 Generate Charts & Budget Utilization
  useEffect(() => {
    if (!filteredProjects.length) {
      setExpenseChartData({});
      setYearlyPerformanceData({});
      setBestProjects([]);
      return;
    }

    let categoryTotals = { Labour: 0, Materials: 0, Miscellaneous: 0 };
    let yearlyData = {};
    let projectRevenues = [];

    filteredProjects.forEach((proj) => {
      let totalSpent = 0;
      let totalRevenue = 0;

      if (proj.transactions && Array.isArray(proj.transactions)) {
        // ✅ Ensure transactions exist
        proj.transactions.forEach((txn) => {
          const parsedAmount = parseFloat(txn.amount) || 0;
          const category = txn.category || "Miscellaneous";
          categoryTotals[category] =
            (categoryTotals[category] || 0) + parsedAmount;

          const year = txn.date?.toDate().toISOString().substring(0, 4);
          if (year) {
            yearlyData[year] = (yearlyData[year] || 0) + parsedAmount;
          }

          if (txn.category === "Client Payment") {
            totalRevenue += parsedAmount;
          } else {
            totalSpent += parsedAmount;
          }
        });
      }

      projectRevenues.push({ name: proj.name, revenue: totalRevenue });
    });

    setBestProjects(
      projectRevenues.sort((a, b) => b.revenue - a.revenue).slice(0, 3),
    );

    setExpenseChartData({
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: "Expenses",
          data: Object.values(categoryTotals),
          backgroundColor: ["#007bff", "#ffc107", "#28a745"],
        },
      ],
    });

    setYearlyPerformanceData({
      labels: Object.keys(yearlyData).sort(),
      datasets: [
        {
          label: "Yearly Revenue",
          data: Object.values(yearlyData),
          borderColor: "#28a745",
          backgroundColor: "rgba(40, 167, 69, 0.2)",
          fill: true,
        },
      ],
    });
  }, [filteredProjects]);

  // ✅ Save New Customer
  const handleSaveCustomer = async (customerData) => {
    try {
      console.log("customer data to save", customerData);
      const customersRef = collection(db, "customers");
      await addDoc(customersRef, customerData);

      // Re-fetch customers
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setCustomers(customerList);

      toastSuccess("Customer added successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error adding customer:", error);
      toastError("Failed to add customer.");
    }
  };

  // ✅ Save Edited Customer
  const handleEditCustomer = async (customerData) => {
    try {
      console.log("customer data to edit", customerData);
      const customerRef = doc(db, "customers", customerData.id);
      await setDoc(customerRef, customerData);

      // Re-fetch customers
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCustomers(customerList);

      toastSuccess("Customer updated successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error editing customer:", error);
      toastError("Failed to edit customer.");
    }
  };
  // ✅ Delete a Customer
  const handleDeleteCustomer = async (customerId) => {
    try {
      console.log("customer data to delete", customerId);
      const customerRef = doc(db, "customers", customerId);
      await deleteDoc(customerRef);

      // Re-fetch customers
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      const customerList = customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setCustomers(customerList);
      toastSuccess("Customer deleted successfully!");
      setShowCustomerModal(false);
    } catch (error) {
      console.error("Error deleting customer", error);
      toastError("Failed to delete customer.");
    }
  };

  // ✅ Save New Transaction
  const handleTransactionSave = async (newTransaction) => {
    if (!newTransaction.projectId) {
      toastError("Please select a project first.");
      return;
    }

    try {
      const transactionsRef = collection(
        db,
        `projects/${newTransaction.projectId}/transactions`,
      );

      await addDoc(transactionsRef, {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: serverTimestamp(),
      });

      toastSuccess("Transaction added successfully!");
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      toastError("Failed to add transaction.");
    }
  };

  return (
    <div>
      <Navbar page="dashboard" />
      <div className="container mt-5">
        {/* 🔹 Dashboard Header */}
        <div className="dashboard-header mb-4">
          <h1 className="dashboard-title">📊 Project Dashboard</h1>
          <div className="quick-actions-wrapper">
            <QuickActions
              onAddProject={() => setShowModal(true)}
              onAddTransaction={() => setShowTransactionModal(true)}
            />
          </div>
        </div>
        {/* Customers */}
        <div className="dashboard-card mb-4">
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
        {/* 🔹 Dashboard Grid */}
        <div className="dashboard-grid">
          {/* 🔹 Financial Insights */}
          <div className="dashboard-card">
            <FinancialInsights projects={filteredProjects} />
          </div>

          {/* 🔹 Notifications */}
          <div className="dashboard-card">
            <NotificationsPanel alerts={alerts} />
          </div>

          {/* 🔹 Best Performing Projects */}
          <div className="dashboard-card">
            <BestProjects bestProjects={bestProjects} />
          </div>

          {/* 🔹 Placeholder for Additional Features */}
          <div className="dashboard-card">
            <h3>🏆 Coming Soon: More Features</h3>
          </div>

          {/* 🔹 Expense Breakdown */}
          <div className="dashboard-card">
            <h3>Expense Breakdown</h3>
            {expenseChartData.labels ? (
              <Pie data={expenseChartData} />
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* 🔹 Yearly Performance */}
          <div className="dashboard-card">
            <h3>Yearly Performance</h3>
            {yearlyPerformanceData.labels ? (
              <Line data={yearlyPerformanceData} />
            ) : (
              <p>No data available</p>
            )}
          </div>

          {/* 🔹 Calendar Widget (Full Width) */}
          <div className="dashboard-card dashboard-calendar">
            <CalendarWidget />
          </div>
        </div>

        {/* 🔹 Modals */}
        <AddProjectModal
          show={showModal}
          handleClose={() => setShowModal(false)}
        />
        <TransactionModal
          show={showTransactionModal}
          handleClose={() => setShowTransactionModal(false)}
          projects={projects}
        />
      </div>
    </div>
  );
};

export default Dashboard;
