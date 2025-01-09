import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Bootstrap & Styles
import "bootstrap/dist/css/bootstrap.min.css";
import "../../styles/global.css";
import "./Dashboard.css";

// Charts & Config
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

// Components
import Navbar from "../../components/Navbar";
import AddProjectModal from "../../components/AddProject/AddProjectModal";
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import LoadingSpinner from "../../components/LoadingSpinner"; // Reusable Loader

// Contexts
import { useProjects } from "../../context/ProjectsContext";

// Register ChartJS
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
  // --- Hooks ---
  const navigate = useNavigate();
  const { projects, loading, error } = useProjects();

  // --- State Management ---
  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const [fakeLoading, setFakeLoading] = useState(true); // Fake Delay

  // --- Chart Data ---
  const [expenseChartData, setExpenseChartData] = useState({
    labels: ["Labor", "Materials", "Miscellaneous"],
    datasets: [
      {
        label: "Expenses",
        data: [0, 0, 0],
        backgroundColor: ["#007bff", "#ffc107", "#28a745"],
        hoverOffset: 10,
      },
    ],
  });

  const [monthlyTrendsData, setMonthlyTrendsData] = useState({
    labels: [],
    datasets: [
      {
        label: "Expenses",
        data: [],
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        fill: true,
      },
    ],
  });

  const [budgetUtilization, setBudgetUtilization] = useState(0);

  // --- Fake Loading Delay ---
  useEffect(() => {
    const timer = setTimeout(() => setFakeLoading(false), 1500); // Fake Delay: 1.5 seconds
    return () => clearTimeout(timer);
  }, [loading]); // Sync with Firebase loading

  // --- Filter Projects ---
  useEffect(() => {
    const filtered =
      filterStatus === "all"
        ? projects
        : projects.filter((proj) => proj.status === filterStatus);

    setFilteredProjects(filtered);

    // If no projects, stop chart loading immediately
    if (!filtered.length) {
      setChartLoading(false);
    }
  }, [projects, filterStatus]);

  // --- Process Charts ---
  useEffect(() => {
    if (chartLoading && filteredProjects.length === 0) {
      console.warn("No projects available!");
      setChartLoading(false); // Stop chart loading if no projects
      return;
    }

    const categoryTotals = { Labor: 0, Materials: 0, Miscellaneous: 0 };
    const monthlyTotals = {};
    const chartColors = ["#007bff", "#ffc107", "#28a745"];

    filteredProjects.forEach((proj) => {
      proj.transactions?.forEach((txn) => {
        const category = txn.category || "Miscellaneous";
        categoryTotals[category] =
          (categoryTotals[category] || 0) + Number(txn.amount);

        const month = txn.date.toDate().toISOString().substring(0, 7);
        monthlyTotals[month] = (monthlyTotals[month] || 0) + Number(txn.amount);
      });
    });

    // Expense Chart
    setExpenseChartData({
      labels: ["Labor", "Materials", "Miscellaneous"],
      datasets: [
        {
          label: "Expenses",
          data: [
            categoryTotals.Labor || 0,
            categoryTotals.Materials || 0,
            categoryTotals.Miscellaneous || 0,
          ],
          backgroundColor: chartColors,
          hoverOffset: 10,
        },
      ],
    });

    // Monthly Trends Chart
    const labels = Object.keys(monthlyTotals).sort();
    const trendsData = labels.map((key) => monthlyTotals[key] || 0);

    setMonthlyTrendsData({
      labels,
      datasets: [
        {
          label: "Expenses",
          data: trendsData,
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          fill: true,
        },
      ],
    });

    // Budget Utilization
    const totalSpent = Object.values(categoryTotals).reduce((a, b) => a + b, 0);
    const budget = 100000; // Example budget
    setBudgetUtilization(((totalSpent / budget) * 100).toFixed(1));

    setChartLoading(false); // Chart processing complete
  }, [filteredProjects, chartLoading]);

  // --- Handlers ---
  const handleFilterChange = (e) => setFilterStatus(e.target.value);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  const progressVariant =
    budgetUtilization > 80
      ? "danger"
      : budgetUtilization > 50
        ? "warning"
        : "success";

  // --- Unified Loading State ---
  const isLoading = fakeLoading || loading || chartLoading;

  // --- Show Spinner if Loading ---
  if (isLoading) {
    return <LoadingSpinner text="Crunching the numbers..." />;
  }

  // --- Render Dashboard ---
  return (
    <div className="dashboard-container">
      <Navbar page="dashboard" />
      <div className="dashboard-header shadow-sm p-4 mb-4">
        <h2 className="dashboard-title">Dashboard</h2>
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

      <div>
        <div className="row g-4 mt-4">
          <StatCard title="Projects" value={filteredProjects.length} />
          <StatCard
            title="Budget Utilization"
            value={`${budgetUtilization}%`}
          />
        </div>

        <div className="row g-4 mt-4">
          <ChartCard title="Expense Breakdown">
            <Pie data={expenseChartData} />
          </ChartCard>
          <ChartCard title="Monthly Trends">
            <Line data={monthlyTrendsData} />
          </ChartCard>
        </div>
      </div>

      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </div>
  );
};

export default Dashboard;
