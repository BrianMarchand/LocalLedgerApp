// File: src/components/Dashboard/Dashboard.jsx
import React, { useEffect, useState, useMemo } from "react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDocs,
  query,
  orderBy,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { db } from "@config";
import { toastSuccess, toastError } from "../../utils/toastNotifications";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "../../styles/components/Dashboard.css";
import { Pie, Doughnut, Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
} from "chart.js";
import AddProjectModal from "../../components/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import CustomerModal from "../../components/CustomerModal";
import { useProjects } from "../../context/ProjectsContext";
import useTotalTransactions from "../../hooks/useTotalTransactions";
import { logActivity } from "../../utils/activityLogger";

// Import centralized customer API functions
import {
  saveNewCustomer,
  updateExistingCustomer,
} from "../../../firebase/customerAPI";

// Import the shared Layout component
import Layout from "../../components/Layout";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement
);

const Dashboard = () => {
  const { projects } = useProjects();

  // State for modals
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // State for recent activities
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, "activity"),
      orderBy("timestamp", "desc"),
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRecentActivities(activitiesList);
    });
    return () => unsubscribe();
  }, []);

  // State for customers (for computing total customers count)
  const [customers, setCustomers] = useState([]);
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

  useEffect(() => {
    const fetch = async () => {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
    };
    fetch();
  }, []);

  const [filteredProjects, setFilteredProjects] = useState([]);
  useEffect(() => {
    setFilteredProjects(projects);
  }, [projects]);

  // Expense Breakdown Chart Data
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
          backgroundColor: [
            "rgba(107,161,221,0.5)",
            "rgba(71,24,67,0.5)",
            "rgba(27,206,180,0.5)",
          ],
        },
      ],
    };
  }, [filteredProjects]);

  // Define monthlyExpenseData (example data)
  const monthlyExpenseData = useMemo(() => {
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
      datasets: [
        {
          label: "Monthly Expenses",
          data: [1200, 1900, 1700, 2200, 2100, 2500],
          fill: false,
          backgroundColor: "#007bff",
          borderColor: "#007bff",
        },
      ],
    };
  }, []);

  // Define budgetVsActualData based on projects
  const budgetVsActualData = useMemo(() => {
    const labels = projects.map((p) => p.name);
    const budgets = projects.map((p) => p.budget || 0);
    const actuals = projects.map((p) => {
      if (p.transactions && Array.isArray(p.transactions)) {
        return p.transactions.reduce(
          (sum, txn) => sum + parseFloat(txn.amount || 0),
          0
        );
      }
      return 0;
    });
    return {
      labels,
      datasets: [
        {
          label: "Budget",
          data: budgets,
          backgroundColor: "rgba(75,192,192,0.5)",
        },
        {
          label: "Actual Expenses",
          data: actuals,
          backgroundColor: "rgba(255,99,132,0.5)",
        },
      ],
    };
  }, [projects]);

  // Project Status Overview Data
  const projectStatusData = useMemo(() => {
    if (!projects.length) return {};
    const statusCounts = {};
    projects.forEach((project) => {
      const status = project.status || "Not Specified";
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });
    return {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          label: "Project Status",
          data: Object.values(statusCounts),
          backgroundColor: [
            "rgba(107,161,221,0.5)",
            "rgba(71,24,67,0.5)",
            "rgba(27,206,180,0.5)",
            "rgba(242,49,140,0.5)",
          ],
        },
      ],
    };
  }, [projects]);

  const totalProjects = useMemo(
    () => (projects ? projects.length : 0),
    [projects]
  );
  const totalTransactions = useTotalTransactions();
  const totalCustomers = useMemo(
    () => (customers ? customers.length : 0),
    [customers]
  );

  const projectStatusOptions = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
      },
    },
    plugins: {
      legend: {
        labels: {
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.datasets.length) {
              return data.labels.map((label, index) => ({
                text: label,
                fillStyle: data.datasets[0].backgroundColor[index],
                strokeStyle: data.datasets[0].borderColor
                  ? data.datasets[0].borderColor[index]
                  : undefined,
                hidden: false,
                index: index,
              }));
            }
            return [];
          },
        },
      },
    },
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
      const docRef = await addDoc(transactionsRef, {
        ...newTransaction,
        date: new Date(newTransaction.date),
        createdAt: serverTimestamp(),
      });
      toastSuccess("Transaction added successfully!");
      await logActivity("New Transaction", "A new transaction was added.", {
        projectId: newTransaction.projectId,
        transactionId: docRef.id,
      });
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

  return (
    <Layout
      pageTitle="dashboard"
      activities={recentActivities}
      formatActivity={formatActivity}
      onAddProject={() => setShowModal(true)}
      onAddTransaction={() => setShowTransactionModal(true)}
      onAddCustomer={() => setShowCustomerModal(true)}
    >
      <div className="container-fluid">
        <div className="dashboard-summary-cards">
          <div className="dashboard-card card-projects">
            <div className="card-header">
              <i className="bi bi-folder2-open"></i>
              <span>Total Projects</span>
            </div>
            <div className="dashboard-count">{totalProjects}</div>
            <hr className="card-divider" />
            <Link to="/projects" className="card-link">
              View All Projects
            </Link>
          </div>
          <div className="dashboard-card card-transactions">
            <div className="card-header">
              <i className="bi bi-receipt"></i>
              <span>Total Transactions</span>
            </div>
            <div className="dashboard-count">{totalTransactions}</div>
            <hr className="card-divider" />
            <Link to="/transaction-summary" className="card-link">
              View All Transactions
            </Link>
          </div>
          <div className="dashboard-card card-customers">
            <div className="card-header">
              <i className="bi bi-people"></i>
              <span>Total Customers</span>
            </div>
            <div className="dashboard-count">{totalCustomers}</div>
            <hr className="card-divider" />
            <Link to="/customers" className="card-link">
              Manage Customers
            </Link>
          </div>
          <div className="dashboard-card card-list">
            <div className="card-header">
              <i className="bi bi-card-checklist"></i>
              <span>Total Lists</span>
            </div>
            <div className="dashboard-count">{totalCustomers}</div>
            <hr className="card-divider" />
            <Link to="" className="card-link">
              Manage Lists
            </Link>
          </div>
          <div className="dashboard-card card-summary">
            <div className="card-header">
              <i className="bi bi-calculator"></i>
              <span>Total Summaries</span>
            </div>
            <div className="dashboard-count">{totalCustomers}</div>
            <hr className="card-divider" />
            <Link to="" className="card-link">
              Manage Summaries
            </Link>
          </div>
        </div>
        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">
              <i className="bi bi-bar-chart-fill"></i>
              <span>Expense Breakdown</span>
            </div>
            <div style={{ height: "300px" }}>
              {expenseChartData.labels ? (
                <Bar
                  data={expenseChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => "$" + value,
                        },
                      },
                    },
                    plugins: {
                      legend: {
                        display: false,
                      },
                    },
                  }}
                />
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
          <div className="dashboard-card">
            <div className="card-header">
              <i className="bi bi-graph-up"></i>
              <span>Monthly Expense Trend</span>
            </div>
            <Line data={monthlyExpenseData} />
          </div>
          <div className="dashboard-card">
            <div className="card-header">
              <i className="bi bi-bar-chart"></i>
              <span>Budget vs. Actual Expenses</span>
            </div>
            <Bar data={budgetVsActualData} />
          </div>
          <div className="dashboard-card">
            <div className="card-header">
              <i className="bi bi-bar-chart-steps"></i>
              <span>Project Status Overview</span>
            </div>
            <div style={{ height: "300px" }}>
              {projectStatusData.labels ? (
                <Bar data={projectStatusData} options={projectStatusOptions} />
              ) : (
                <p>No data available</p>
              )}
            </div>
          </div>
        </div>
      </div>
      <AddProjectModal
        show={showModal}
        handleClose={() => setShowModal(false)}
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
        handleSave={saveNewCustomer}
        handleEditCustomer={updateExistingCustomer}
      />
    </Layout>
  );
};

export default Dashboard;
