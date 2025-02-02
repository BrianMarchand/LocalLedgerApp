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
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "../../styles/components/Dashboard.css";
import { Pie, Line, Bar } from "react-chartjs-2";
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
import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";
import AddProjectModal from "../../components/AddProject/AddProjectModal";
import TransactionModal from "../../components/TransactionModal";
import CustomerModal from "../../components/CustomerModal";
import { useProjects } from "../../context/ProjectsContext";
import useTotalTransactions from "../../hooks/useTotalTransactions";

// Register Chart.js components
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
  const navigate = useNavigate();
  const { projects } = useProjects();

  // State for modals
  const [showModal, setShowModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);

  // State for recent activities
  const [recentActivities, setRecentActivities] = useState([]);

  useEffect(() => {
    // Query the "activity" collection for the 3 most recent events
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

  useEffect(() => {
    const fetch = async () => {
      const customerList = await fetchCustomers();
      setCustomers(customerList);
      console.log("Customers fetched on Dashboard load:", customerList);
    };
    fetch();
  }, []);

  const [filteredProjects, setFilteredProjects] = useState([]);
  useEffect(() => {
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
          // Updated to use your custom brand colors:
          // Blueprint for Labour, Foundation for Materials, Limestone for Miscellaneous
          backgroundColor: ["#6BA1DD", "#471843", "#1BCEB4"],
        },
      ],
    };
  }, [filteredProjects]);

  // --- Compute Summary Totals Using useMemo ---
  const totalProjects = useMemo(
    () => (projects ? projects.length : 0),
    [projects]
  );
  // Replace old calculation with our new hook for total transactions:
  const totalTransactions = useTotalTransactions();
  const totalCustomers = useMemo(
    () => (customers ? customers.length : 0),
    [customers]
  );

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

  // --- Additional Dynamic Chart Data (Example) ---
  // Monthly Expense Trend (placeholder data)
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

  // Helper function to format activity entries
  const formatActivity = (activity) => {
    // Format the timestamp as "Day Month Year"
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

    // Customize formatting for new customer activities
    if (activity.type === "new_customer") {
      eventType = "New Customer";
      // Use customerName if available; otherwise, process the description.
      if (activity.customerName) {
        message = `${activity.customerName} was added.`;
      } else if (activity.description) {
        let desc = activity.description;
        // Remove the "Customer " prefix if present
        if (desc.startsWith("Customer ")) {
          desc = desc.substring("Customer ".length);
        }
        // If there's " with email", remove that part
        const idx = desc.indexOf(" with email");
        if (idx !== -1) {
          desc = desc.substring(0, idx);
        }
        message = `${desc.trim()} was added.`;
      }
    }

    return { dateStr, eventType, message };
  };

  // Budget vs Actual Expenses (placeholder data)
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

  return (
    <div>
      <Navbar page="dashboard" />
      <div className="dashboard-main-container">
        <Sidebar
          onAddProject={() => setShowModal(true)}
          onAddTransaction={() => setShowTransactionModal(true)}
          onAddCustomer={() => setShowCustomerModal(true)}
        />
        <div className="dashboard-content-container">
          <div className="dashboard-content">
            <div className="dashboard-left">
              <div className="dashboard-summary-cards">
                <div className="dashboard-card card-projects">
                  <h3>Total Projects</h3>
                  <p className="dashboard-count">{totalProjects}</p>
                  <Link to="/projects" className="card-link">
                    View All Projects
                  </Link>
                </div>
                <div className="dashboard-card card-transactions">
                  <h3>Total Transactions</h3>
                  <p className="dashboard-count">{totalTransactions}</p>
                  <Link to="/transaction-summary" className="card-link">
                    View All Transactions
                  </Link>
                </div>
                <div className="dashboard-card card-customers">
                  <h3>Total Customers</h3>
                  <p className="dashboard-count">{totalCustomers}</p>
                  <Link to="/customers" className="card-link">
                    Manage Customers
                  </Link>
                </div>
                <div className="dashboard-card card-activity">
                  <h3>Recent Activity</h3>
                  <div className="recent-activity-list">
                    {recentActivities.length > 0 ? (
                      <ul>
                        {recentActivities.map((activity) => {
                          const { dateStr, eventType, message } =
                            formatActivity(activity);
                          return (
                            <li key={activity.id}>
                              <span className="activity-date">{dateStr}</span>
                              <span className="activity-type">{eventType}</span>
                              <span className="activity-message">
                                {message}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <p>No recent activity available.</p>
                    )}
                  </div>
                  <Link to="/activity" className="card-link">
                    View Activity Log
                  </Link>
                </div>
              </div>
              <div className="dashboard-grid">
                <div className="dashboard-card">
                  <h3>Expense Breakdown</h3>
                  {expenseChartData.labels ? (
                    <Pie data={expenseChartData} />
                  ) : (
                    <p>No data available</p>
                  )}
                </div>
                <div className="dashboard-card">
                  <h3>Monthly Expense Trend</h3>
                  <Line data={monthlyExpenseData} />
                </div>
                <div className="dashboard-card">
                  <h3>Budget vs. Actual Expenses</h3>
                  <Bar data={budgetVsActualData} />
                </div>
              </div>
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
        projects={projects}
      />
      <CustomerModal
        show={showCustomerModal}
        handleClose={() => setShowCustomerModal(false)}
        handleSave={(customerData) => {
          console.log("Save new customer:", customerData);
        }}
        handleEditCustomer={(customerData) => {
          console.log("Edit customer:", customerData);
        }}
      />
    </div>
  );
};

export default Dashboard;
