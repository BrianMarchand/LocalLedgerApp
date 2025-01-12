import React, { useEffect, useState } from "react";
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
import StatCard from "./StatCard";
import ChartCard from "./ChartCard";
import LoadingSpinner from "../../components/LoadingSpinner";
import { useProjects } from "../../context/ProjectsContext";

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
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState({});
  const [monthlyTrendsData, setMonthlyTrendsData] = useState({});
  const [budgetUtilization, setBudgetUtilization] = useState(0);

  useEffect(() => {
    // Filter projects based on status
    const filtered =
      filterStatus === "all"
        ? projects
        : projects.filter((proj) => proj.status === filterStatus);
    setFilteredProjects(filtered);
  }, [projects, filterStatus]);

  useEffect(() => {
    if (!filteredProjects.length) {
      setExpenseChartData({});
      setMonthlyTrendsData({});
      setBudgetUtilization(0);
      return;
    }

    // Initialize data
    const categoryTotals = { Labor: 0, Materials: 0, Miscellaneous: 0 };
    const monthlyTotals = {};
    let totalBudget = 0;
    let totalSpent = 0;

    // Iterate over filtered projects
    filteredProjects.forEach((proj) => {
      console.log("Processing project:", proj);
      totalBudget += proj.budget || 0; // Add project budget

      proj.transactions?.forEach((txn) => {
        console.log("Processing transaction:", txn);

        // Parse the transaction amount as a number, defaulting to 0 if invalid
        const parsedAmount = parseFloat(txn.amount) || 0;

        // Categorize expenses
        const category = txn.category || "Miscellaneous";
        categoryTotals[category] =
          (categoryTotals[category] || 0) + parsedAmount;

        // Monthly aggregation
        const month = txn.date?.toDate().toISOString().substring(0, 7); // Ensure valid date
        if (month) {
          monthlyTotals[month] = (monthlyTotals[month] || 0) + parsedAmount;
        }

        // Add expenses to total spent (ignore "Client Payment" category)
        if (txn.category !== "Client Payment") {
          totalSpent += parsedAmount;
        }
      });
    });

    // Debugging logs
    console.log("Category Totals:", categoryTotals);
    console.log("Monthly Totals:", monthlyTotals);
    console.log("Total Budget:", totalBudget);
    console.log("Total Spent:", totalSpent);

    // Update Expense Breakdown Chart
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

    // Update Monthly Trends Chart
    setMonthlyTrendsData({
      labels: Object.keys(monthlyTotals).sort(),
      datasets: [
        {
          label: "Monthly Expenses",
          data: Object.values(monthlyTotals),
          borderColor: "#007bff",
          backgroundColor: "rgba(0, 123, 255, 0.2)",
          fill: true,
        },
      ],
    });

    // Calculate Budget Utilization
    let utilization = 0;
    if (totalBudget > 0) {
      utilization = ((totalSpent / totalBudget) * 100).toFixed(1);
    } else {
      console.warn("Total budget is zero. Cannot calculate utilization.");
    }

    console.log("Calculated Budget Utilization:", utilization);
    setBudgetUtilization(utilization);
  }, [filteredProjects]);

  const handleFilterChange = (e) => setFilterStatus(e.target.value);
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  if (loading) {
    return <LoadingSpinner text="Loading dashboard..." />;
  }

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
            {expenseChartData.labels ? (
              <Pie data={expenseChartData} />
            ) : (
              <p>No data available</p>
            )}
          </ChartCard>
          <ChartCard title="Monthly Trends">
            {monthlyTrendsData.labels ? (
              <Line data={monthlyTrendsData} />
            ) : (
              <p>No data available</p>
            )}
          </ChartCard>
        </div>
      </div>

      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </div>
  );
};

export default Dashboard;
