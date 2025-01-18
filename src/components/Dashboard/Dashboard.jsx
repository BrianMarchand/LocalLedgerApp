import React, { useEffect, useState } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
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
import QuickActions from "./QuickActions";
import FinancialInsights from "./FinancialInsights";
import NotificationsPanel from "./NotificationsPanel";
import BestProjects from "./BestProjects";
import ChartCard from "./ChartCard";
import CalendarWidget from "./CalendarWidget";
import TransactionModal from "../../components/TransactionModal";
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
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [expenseChartData, setExpenseChartData] = useState({});
  const [yearlyPerformanceData, setYearlyPerformanceData] = useState({});
  const [alerts, setAlerts] = useState([]);
  const [bestProjects, setBestProjects] = useState([]);

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

      proj.transactions?.forEach((txn) => {
        const amount = parseFloat(txn.amount) || 0;
        if (txn.category === "Client Payment") {
          totalRevenue += amount;
        } else {
          totalSpent += amount;
        }
      });

      if (totalSpent > proj.budget) {
        newAlerts.push({
          type: "budget",
          message: `⚠️ ${proj.name} exceeded budget!`,
        });
      }
      if (totalRevenue < proj.budget * 0.5) {
        newAlerts.push({
          type: "revenue",
          message: `📉 ${proj.name} received less than 50% of budget.`,
        });
      }
      if (totalRevenue === 0 && proj.transactions.length > 0) {
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

      proj.transactions?.forEach((txn) => {
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
      <div className="container-fluid dashboard-container">
        {/* 🔹 Dashboard Header */}
        <div className="dashboard-header">
          <h1 className="dashboard-title">📊 Project Dashboard</h1>
          <div className="quick-actions-wrapper">
            <QuickActions
              onAddProject={() => setShowModal(true)}
              onAddTransaction={() => setShowTransactionModal(true)}
            />
          </div>
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
