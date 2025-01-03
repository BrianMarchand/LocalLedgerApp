import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../../firebaseConfig";
import { collection, getDocs } from "firebase/firestore";
import Navbar from "../../components/Navbar";
import AddProjectModal from "../../components/AddProjectModal";
import { Button, Spinner, Card } from "react-bootstrap";
import "./Dashboard.css";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { ProgressBar } from "react-bootstrap";
import {
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler, // Register Filler plugin
} from "chart.js";

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler);

const Dashboard = () => {
  const navigate = useNavigate();

  // States
  const [projects, setProjects] = useState([]);
  const [projectsCount, setProjectsCount] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [availableFunds, setAvailableFunds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [budgetUtilization, setBudgetUtilization] = useState(0);
  const [filterStatus, setFilterStatus] = useState("all");
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expenseData, setExpenseData] = useState([0, 0, 0]);
  const [monthlyTotals, setMonthlyTotals] = useState({});
  const chartColors = ["#007bff", "#ffc107", "#28a745"];
  const [expenseChartData, setExpenseChartData] = useState({
    labels: ["Labor", "Materials", "Overhead"], // Set labels initially
    datasets: [
      {
        label: "Expenses",
        data: [0, 0, 0], // Start with empty data
        backgroundColor: ["#007bff", "#ffc107", "#28a745"],
        hoverOffset: 10,
      },
    ],
  });

  const [monthlyTrendsData, setMonthlyTrendsData] = useState({
    labels: [],
    datasets: [],
  });

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

  const handleFilterChange = (e) => {
    setFilterStatus(e.target.value); // Update the filter status
  };

  useEffect(() => {
    console.log(`Filter changed to: ${filterStatus}`);
  }, [filterStatus]); // Runs when filter changes

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
      // Update only when data is valid
      const updatedChartData = {
        labels: ["Labor", "Materials", "Overhead"], // Ensure labels are set
        datasets: [
          {
            label: "Expenses",
            data: expenseData, // Use the latest expense data
            backgroundColor: ["#007bff", "#ffc107", "#28a745"],
            hoverOffset: 10,
          },
        ],
      };
      setExpenseChartData(updatedChartData);
      console.log("Chart Updated - Expense Chart Data:", updatedChartData); // Debugging log
      console.log("Rendering Pie Chart with:", expenseChartData);
    }
  }, [expenseData]); // Depend only on valid data

  const progressVariant =
    budgetUtilization > 80
      ? "danger"
      : budgetUtilization > 50
        ? "warning"
        : "success";

  // Apply filters when projects or filter status changes
  useEffect(() => {
    applyFilters(); // Safe call
  }, [projects, filterStatus]); // ✅ Correct dependencies

  useEffect(() => {
    fetchStats(); // Fetch immediately on page load
  }, []); // Empty dependency array means it runs only once

  // Fetch stats from Firestore
  console.log("Starting fetchStats...");

  const fetchStats = async () => {
    try {
      console.log("Fetching projects...");

      // Fetch projects
      const querySnapshot = await getDocs(collection(db, "projects"));
      const projects = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched Projects:", projects);

      // Filter projects based on the selected status
      const filteredProjects =
        filterStatus === "all"
          ? projects
          : projects.filter((proj) => proj.status === filterStatus);

      console.log("Filtered Projects:", filteredProjects);

      // Initialize totals
      const categoryTotals = { Labour: 0, Materials: 0, Overhead: 0 };
      const updatedMonthlyTotals = {}; // Local variable for monthly totals

      let totalBudget = 0;
      let actualExpenses = 0;

      for (const proj of filteredProjects) {
        totalBudget += proj.budget || 0;

        // Fetch transactions for the project
        const transactionsSnapshot = await getDocs(
          collection(db, `projects/${proj.id}/transactions`),
        );
        const transactions =
          transactionsSnapshot.docs.map((doc) => doc.data()) || [];

        // Process transactions
        transactions.forEach((txn) => {
          const date = new Date(txn.date);
          const monthYear = `${date.getFullYear()}-${date.getMonth() + 1}`;

          if (!updatedMonthlyTotals[monthYear]) {
            updatedMonthlyTotals[monthYear] = 0; // Initialize missing month
          }

          // Determine if it's an expense
          const isExpense =
            txn.type === "VISA" ||
            txn.type === "Debit" ||
            (txn.type === "Cash" && txn.category !== "Client Payment");

          if (isExpense) {
            updatedMonthlyTotals[monthYear] += Number(txn.amount); // Update local totals
            actualExpenses += Number(txn.amount); // Increment total expenses
          }

          // **Category totals** for the pie chart
          if (txn.category === "Labour")
            categoryTotals.Labour += Number(txn.amount);
          if (txn.category === "Materials")
            categoryTotals.Materials += Number(txn.amount);
          if (txn.category === "Misc Expense")
            categoryTotals.Overhead += Number(txn.amount);
        });
      }

      // Update state for chart data
      setExpenseData([
        categoryTotals.Labour,
        categoryTotals.Materials,
        categoryTotals.Overhead,
      ]);

      // **LOG the updated expense data**
      console.log("Expense Data Updated:", [
        categoryTotals.Labour,
        categoryTotals.Materials,
        categoryTotals.Overhead,
      ]);

      // Update React state after processing
      setProjects(filteredProjects); // Update projects
      setProjectsCount(filteredProjects.length);
      setTotalExpenses(actualExpenses);
      setAvailableFunds(totalBudget - actualExpenses);

      setBudgetUtilization(
        totalBudget > 0 ? ((actualExpenses / totalBudget) * 100).toFixed(2) : 0,
      );

      // Update monthly totals for trends chart
      setMonthlyTotals(updatedMonthlyTotals); // Sync React state

      console.log("Finished processing data.");
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  // --- Monthly Trends ---
  const trendsData = useMemo(() => {
    const labels = Object.keys(monthlyTotals).sort();
    const data = labels.map((key) => monthlyTotals[key] || 0);

    return {
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
    };
  }, [monthlyTotals]); // Only recalculate if monthlyTotals changes

  // Tooltip Configuration
  const expenseChartOptions = {
    plugins: {
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            const value = tooltipItem.raw || 0; // Use 'raw' for Chart.js 3+
            const total = expenseData.reduce((sum, val) => sum + val, 0);
            const percentage =
              total > 0 ? ((value / total) * 100).toFixed(2) : 0;
            return `$${value.toLocaleString()} (${percentage}%)`;
          },
        },
      },
    },
  };

  // Modal Handlers
  const handleModalOpen = () => setShowModal(true);
  const handleModalClose = () => setShowModal(false);

  return (
    <div>
      <Navbar page="dashboard" />
      <div className="container py-4">
        {/* Header Row with Filter Dropdown */}
        <Card className="shadow-sm p-4 mb-4 border-0">
          <Card.Body>
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3">
              {/* Dashboard Title */}
              <h2 className="mb-0 text-primary fw-bold">Dashboard</h2>

              {/* Filter and Actions */}
              <div className="d-flex flex-wrap gap-3 align-items-center">
                {/* Filter Dropdown */}
                <select
                  className="form-select w-auto shadow-sm"
                  value={filterStatus}
                  onChange={handleFilterChange}
                >
                  <option value="all">All</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                {/* Buttons */}
                <Button
                  variant="outline-primary"
                  className="shadow-sm"
                  onClick={() => navigate("/projects")}
                >
                  View Projects
                </Button>
                <Button
                  variant="primary"
                  className="shadow-sm"
                  onClick={handleModalOpen}
                >
                  Add New Project
                </Button>
              </div>
            </div>
          </Card.Body>
        </Card>

        {/* Loading Spinner */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <p>Loading stats...</p>
          </div>
        ) : error ? (
          <div className="alert alert-danger text-center py-5">{error}</div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center my-4">
            <p className="text-muted">No projects found for this filter.</p>
          </div>
        ) : (
          <div>
            {/* Cards Section */}
            <div className="row g-4 mt-4">
              {/* Total Projects */}
              <div className="col-md-4">
                <Card className="shadow-sm text-center p-4 border-0">
                  <Card.Body>
                    <Card.Title className="fw-semibold">Projects</Card.Title>
                    <Card.Text className="display-6">{projectsCount}</Card.Text>
                    <small className="text-muted">View all projects</small>
                  </Card.Body>
                </Card>
              </div>
              {/* Total Expenses */}
              <div className="col-md-4">
                <Card className="shadow-sm text-center p-4 border-0">
                  <Card.Body>
                    <Card.Title className="fw-semibold">
                      Total Expenses
                    </Card.Title>
                    <Card.Text className="display-6">
                      ${totalExpenses}
                    </Card.Text>
                    <small className="text-muted">
                      Check expense breakdown
                    </small>
                  </Card.Body>
                </Card>
              </div>
              {/* Available Funds */}
              <div className="col-md-4">
                <Card className="shadow-sm text-center p-4 border-0">
                  <Card.Body>
                    <Card.Title className="fw-semibold">
                      Available Funds
                    </Card.Title>
                    <Card.Text className="display-6">
                      ${availableFunds}
                    </Card.Text>
                    <small className="text-muted">Review budgets</small>
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Budget Utilization */}
            <div className="row mt-5">
              <div className="col-md-12">
                <Card className="shadow-sm p-4 text-center border-0">
                  <Card.Body>
                    <Card.Title className="fw-semibold mb-3">
                      Budget Utilization
                    </Card.Title>

                    {/* Progress Percentage */}
                    <h2 className="display-6 mb-3">{budgetUtilization}%</h2>

                    {/* Progress Bar */}
                    <ProgressBar
                      now={budgetUtilization}
                      label={`${budgetUtilization}%`}
                      variant={progressVariant}
                      className="progress-bar-container progress-bar-text"
                      style={{ height: "25px", fontSize: "1rem" }}
                    />
                  </Card.Body>
                </Card>
              </div>
            </div>

            {/* Charts Section */}
            <div className="row mt-5 g-4">
              {/* Expense Breakdown Chart */}
              <div className="col-md-6">
                <Card className="shadow-sm p-3 border-0">
                  <Card.Body>
                    <Card.Title className="text-center fw-semibold mb-3">
                      Expense Breakdown
                    </Card.Title>
                    <div
                      className="chart-container"
                      style={{
                        width: "100%", // Adjust to fit inside column
                        height: "400px",
                        margin: "0 auto",
                      }}
                    >
                      {expenseChartData.datasets[0].data.some(
                        (val) => val > 0,
                      ) ? (
                        <Pie
                          data={expenseChartData}
                          options={expenseChartOptions}
                        />
                      ) : (
                        <p className="text-center">Loading chart data...</p>
                      )}
                    </div>
                  </Card.Body>
                </Card>
              </div>

              {/* Monthly Expense Trends */}
              <div className="col-md-6">
                <Card className="shadow-sm p-3 border-0">
                  <Card.Body>
                    <Card.Title className="text-center fw-semibold mb-3">
                      Monthly Expense Trends
                    </Card.Title>
                    <div
                      className="chart-container"
                      style={{
                        width: "100%",
                        height: "400px",
                        margin: "0 auto",
                      }}
                    >
                      <Line data={monthlyTrendsData} />
                    </div>
                  </Card.Body>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
      <AddProjectModal show={showModal} handleClose={handleModalClose} />
    </div>
  );
};

export default Dashboard;
