// File: src/pages/Dashboard.jsx

import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
} from "firebase/firestore";
import { db } from "@config";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import { useNavigate, Link } from "react-router-dom"; // Import Link for navigation
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "./Dashboard.css";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import Navbar from "../../components/Navbar";
import AddProjectModal from "../../components/AddProject/AddProjectModal";
import QuickActions from "../../components/QuickActions";
import TransactionModal from "../../components/TransactionModal";
import { useProjects } from "../../context/ProjectsContext";

// Removed CustomersCard import since the detailed customer card is no longer needed
// import CustomersCard from "../Customers/CustomersCard";

// Register Chart.js components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { projects } = useProjects();

  // State for modals (project and transaction)
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);

  // Retain customers state solely for computing total customers count
  const [customers, setCustomers] = useState([]);

  // --- Helper Function: Fetch Customers ---
  const fetchCustomers = async () => {
    try {
      const customersCollection = collection(db, "customers");
      const customerSnapshot = await getDocs(customersCollection);
      return customerSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error("Error fetching customers:", error);
      return [];
    }
  };

  // --- Fetch Customers on Component Mount ---
  useEffect(() => {
    const fetch = async () => {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
      console.log("Customers fetched on Dashboard load:", customerList);
    };
    fetch();
  }, []);

  // --- Update Filtered Projects When Projects Change ---
  const [filteredProjects, setFilteredProjects] = useState([]);
  useEffect(() => {
    // Currently, we simply mirror the projects.
    setFilteredProjects(projects);
  }, [projects]);

  // --- Compute Expense Chart Data Using useMemo ---
  const expenseChartData = useMemo(() => {
    if (!filteredProjects.length) return {};
    let categoryTotals = { Labour: 0, Materials: 0, Miscellaneous: 0 };

    filteredProjects.forEach((proj) => {
      if (proj.transactions && Array.isArray(proj.transactions)) {
        proj.transactions.forEach((txn) => {
          const parsedAmount = parseFloat(txn.amount) || 0;
          const category = txn.category || "Miscellaneous";
          categoryTotals[category] =
            (categoryTotals[category] || 0) + parsedAmount;
        });
      }
    });

    return {
      labels: Object.keys(categoryTotals),
      datasets: [
        {
          label: "Expenses",
          data: Object.values(categoryTotals),
          backgroundColor: ["#007bff", "#ffc107", "#28a745"],
        },
      ],
    };
  }, [filteredProjects]);

  // --- Compute Summary Totals Using useMemo ---
  const totalProjects = useMemo(() => {
    return projects ? projects.length : 0;
  }, [projects]);

  const totalTransactions = useMemo(() => {
    let count = 0;
    if (projects && projects.length > 0) {
      projects.forEach((proj) => {
        if (proj.transactions && Array.isArray(proj.transactions)) {
          count += proj.transactions.length;
        }
      });
    }
    return count;
  }, [projects]);

  const totalCustomers = useMemo(() => {
    return customers ? customers.length : 0;
  }, [customers]);

  // --- Transaction Save Handler ---
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
        {/* Dashboard Header */}
        <div className="dashboard-header mb-4">
          <h1 className="dashboard-title">Project Dashboard</h1>
          <div className="quick-actions-wrapper">
            <QuickActions
              onAddProject={() => setShowModal(true)}
              onAddTransaction={() => setShowTransactionModal(true)}
            />
          </div>
        </div>

        {/* Summary Cards Section */}
        <div className="dashboard-summary-grid mb-4">
          <div className="dashboard-card">
            <h3>Total Projects</h3>
            <p className="dashboard-count">{totalProjects}</p>
            <Link to="/projects" className="card-link">
              View All Projects
            </Link>
          </div>
          <div className="dashboard-card">
            <h3>Total Transactions</h3>
            <p className="dashboard-count">{totalTransactions}</p>
            <Link to="/transaction-summary" className="card-link">
              View All Transactions
            </Link>
          </div>
          <div className="dashboard-card">
            <h3>Total Customers</h3>
            <p className="dashboard-count">{totalCustomers}</p>
            <Link to="/customers" className="card-link">
              Manage Customers
            </Link>
          </div>
        </div>

        {/* Removed Detailed Customers Card */}

        {/* Dashboard Grid */}
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Expense Breakdown</h3>
            {expenseChartData.labels ? (
              <Pie data={expenseChartData} />
            ) : (
              <p>No data available</p>
            )}
          </div>
        </div>

        {/* Modals */}
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