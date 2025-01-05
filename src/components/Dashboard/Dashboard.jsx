// 1. Bootstrap - Always Load First
import "bootstrap/dist/css/bootstrap.min.css"; // Core Bootstrap CSS
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // Bootstrap JS (if needed)

// 2. Third-Party Libraries (Charts, Libraries, etc.)
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ProgressBar } from "react-bootstrap";

// 3. Global Styles - Apply Globals Before Component-Specific Styles
import "../../styles/global.css";
import "../../styles/theme.css";
import "../../styles/utilities.css";

// 4. Component-Specific Styles - Load Last
import "./Dashboard.css"; // Dashboard Specific Styles

// 5. React Components and App Logic
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProjects } from "../../context/ProjectsContext";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AddProjectModal from "../../components/AddProjectModal";
import { Button, Spinner, Card } from "react-bootstrap";

// 6. Chart.js Config (After Components)
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

const Dashboard = () => {
  const navigate = useNavigate();

  // States
  const [projectsCount, setProjectsCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [budgetUtilization, setBudgetUtilization] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expenseData, setExpenseData] = useState([0, 0, 0]);
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const chartColors = ["#007bff", "#ffc107", "#28a745"];
  const { projects, loading, error } = useProjects();

  const [expenseChartData, setExpenseChartData] = useState({
    labels: ["Labor", "Materials", "Overhead"],
    datasets: [
      {
        label: "Expenses",
        data: [0, 0, 0],
        backgroundColor: chartColors,
        hoverOffset: 10,
      },
    ],
  });

  const [monthlyTrendsData, setMonthlyTrendsData] = useState({
    labels: [],
    datasets: [],
  });

  // Apply Filters
  const applyFilters = () => {
    let filtered = projects;

    if (filterStatus !== "all") {
      filtered = projects.filter((proj) => proj.status === filterStatus);
    }

    const categoryTotals = { Labour: 0, Materials: 0, Overhead: 0 };

    filtered.forEach((proj) => {
      proj.transactions?.forEach((txn) => {
        if (txn.category === "Labour")
          categoryTotals.Labour += Number(txn.amount);
        if (txn.category === "Materials")
          categoryTotals.Materials += Number(txn.amount);
        if (txn.category === "Misc Expense")
          categoryTotals.Overhead += Number(txn.amount);
      });
    });

    setExpenseData([
      categoryTotals.Labour,
      categoryTotals.Materials,
      categoryTotals.Overhead,
    ]);

    setFilteredProjects(filtered);
  };

  const handleFilterChange = (e) => setFilterStatus(e.target.value);

  useEffect(() => {
    const labels = Object.keys(monthlyTotals).sort();
    const data = labels.map((key) => monthlyTotals[key] || 0);

    setMonthlyTrendsData({
      labels,
      datasets: [
        {
          label: "Expenses",
          data,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          fill: true,
        },
      ],
    });
  }, [monthlyTotals]);

  useEffect(() => {
    if (expenseData.some((val) => val > 0)) {
      const updatedChartData = {
        labels: ["Labor", "Materials", "Overhead"],
        datasets: [
          {
            label: "Expenses",
            data: expenseData,
            backgroundColor: chartColors,
            hoverOffset: 10,
          },
        ],
      };
      setExpenseChartData(updatedChartData);
    }
  }, [expenseData]);

  const progressVariant =
    budgetUtilization > 80
      ? "danger"
      : budgetUtilization > 50
        ? "warning"
        : "success";

  useEffect(() => {
    applyFilters();
  }, [projects, filterStatus]);

  // Modal Handlers
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  return (
    <div className="dashboard-container">
      <Navbar page="dashboard" />

      {/* Dashboard Header */}
      <div className="dashboard-header shadow-sm p-4 mb-4">
        <h2 className="dashboard-title">Dashboard</h2>

        {/* Filter and Actions */}
        <div className="dashboard-actions d-flex flex-wrap gap-3 align-items-center">
          <select
            className="dashboard-select"
            value={filterStatus}
            onChange={handleFilterChange}
          >
            <option value="all">All</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Dashboard Content */}
      {loading ? (
        <div className="text-center py-5">
          <Spinner animation="border" />
          <p>Loading stats...</p>
        </div>
      ) : error ? (
        <div className="alert alert-danger text-center py-5">{error}</div>
      ) : (
        <div className="dashboard-content">
          {/* Stats Section */}
          <div className="row g-4 mt-4">
            <div className="col-md-4">
              <div className="dashboard-card shadow-sm text-center p-4">
                <h3 className="dashboard-card-title">Projects</h3>
                <p className="dashboard-stat">{projectsCount}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="dashboard-card shadow-sm text-center p-4">
                <h3 className="dashboard-card-title">Total Expenses</h3>
                <p className="dashboard-stat">${totalExpenses}</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="dashboard-card shadow-sm text-center p-4">
                <h3 className="dashboard-card-title">Available Funds</h3>
                <p className="dashboard-stat">${availableFunds}</p>
              </div>
            </div>
          </div>

          {/* Budget Utilization */}
          <div className="row mt-5">
            <div className="col-12">
              <div className="dashboard-progress-container shadow-sm p-4 text-center">
                <h3 className="dashboard-card-title">Budget Utilization</h3>
                <h2 className="dashboard-percentage">{budgetUtilization}%</h2>
                <ProgressBar
                  now={budgetUtilization}
                  label={`${budgetUtilization}%`}
                  variant={progressVariant}
                  className="dashboard-progress"
                />
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="row mt-5 g-4">
            <div className="col-md-6">
              <div className="dashboard-chart-card shadow-sm p-3">
                <h4 className="chart-title">Expense Breakdown</h4>
                <Pie data={expenseChartData} />
              </div>
            </div>
            <div className="col-md-6">
              <div className="dashboard-chart-card shadow-sm p-3">
                <h4 className="chart-title">Monthly Trends</h4>
                <Line data={monthlyTrendsData} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </div>
  );
};

export default Dashboard;
