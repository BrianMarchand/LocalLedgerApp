// File: src/pages/ProjectDashboard.jsx

import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../Navbar";
import TransactionsTable from "./TransactionsTable";
import FinancialSummary from "./FinancialSummary";
import PaymentBreakdown from "./PaymentBreakdown";
import ErrorState from "./ErrorState";
import LoadingSpinner from "./LoadingSpinner";
import ProjectCalendar from "./ProjectCalendar";
import NotesModal from "../Notes/NotesModal";
import ErrorBoundary from "../../components/ErrorBoundary";
import ProjectDetailsCard from "../ProjectDetailsCard";
import useFetchData from "../../hooks/useFetchData";
import { formatCurrency } from "../../utils/formatUtils";
import QuickActions from "../../components/QuickActions";
import { useProjects } from "../../context/ProjectsContext";
import Swal from "sweetalert2";

const DEBUG = false;

function ProjectDashboard() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const { project, transactions, loading, error, refetch } = useFetchData(projectId);
  const { updateProject } = useProjects();

  const [metrics, setMetrics] = useState(null);
  const [showNotes, setShowNotes] = useState(false);
  const [reversionHandled, setReversionHandled] = useState(false);
  const prevTransactionsRef = useRef(transactions);

  const parseAmount = (amount) => {
    const parsed = parseFloat(amount);
    return isNaN(parsed) ? 0 : parsed;
  };

  const calculateIncomeMetrics = (transactions) => {
    const incomeTransactions = transactions.filter(
      (t) => t?.category === "Client Payment"
    );
    const cashReceived = incomeTransactions
      .filter((t) => t?.type === "Cash")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const eTransferIncome = incomeTransactions
      .filter((t) => t?.type === "E-Transfer")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + parseAmount(t.amount),
      0
    );
    return { cashReceived, eTransferIncome, totalIncome };
  };

  const calculateExpenseMetrics = (transactions) => {
    const expenseTransactions = transactions.filter(
      (t) => t?.category !== "Client Payment"
    );
    const cashSpent = expenseTransactions
      .filter((t) => t?.type === "Cash")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const visaExpenses = expenseTransactions
      .filter((t) => t?.type === "VISA")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const debitExpenses = expenseTransactions
      .filter((t) => t?.type === "Debit")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);
    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + parseAmount(t.amount),
      0
    );
    return { cashSpent, visaExpenses, debitExpenses, totalExpenses };
  };

  const calculateBudgetMetrics = (project, incomeMetrics, expenseMetrics) => {
    const budget = project?.budget || 0;
    const remainingBudget = Math.max(0, budget - expenseMetrics.totalExpenses);
    const remainingClientPayment = Math.max(0, budget - incomeMetrics.totalIncome);
    const profit = incomeMetrics.totalIncome - expenseMetrics.totalExpenses;
    const budgetSpentPercent = ((expenseMetrics.totalExpenses / (budget || 1)) * 100).toFixed(2);
    const paidPercentage = ((incomeMetrics.totalIncome / (budget || 1)) * 100).toFixed(2);
    const availableFunds = profit;
    return { remainingBudget, remainingClientPayment, profit, budgetSpentPercent, paidPercentage, availableFunds };
  };

  const calculateMetrics = () => {
    if (!transactions || !Array.isArray(transactions)) return {};

    const incomeMetrics = calculateIncomeMetrics(transactions);
    const expenseMetrics = calculateExpenseMetrics(transactions);
    const budgetMetrics = calculateBudgetMetrics(project, incomeMetrics, expenseMetrics);
    const largestPayment = transactions.reduce(
      (max, t) => Math.max(max, parseAmount(t.amount)),
      0
    );
    const totalTransactions = transactions.length;
    const daysInProgress = project?.statusDate
      ? Math.max(
          1,
          Math.ceil(
            (Date.now() - project.statusDate.toMillis()) / (1000 * 60 * 60 * 24)
          )
        )
      : 0;

    const calculated = {
      ...incomeMetrics,
      ...expenseMetrics,
      ...budgetMetrics,
      largestPayment,
      totalTransactions,
      daysInProgress,
    };

    if (DEBUG) {
      console.log("Calculated Metrics:", calculated);
    }
    return calculated;
  };

  useEffect(() => {
    if (transactions.length && project) {
      const calculatedMetrics = calculateMetrics();
      setMetrics(calculatedMetrics);
    }
  }, [transactions, project]);

  const handleRefresh = () => {
    refetch();
  };

  // Manual status change handler (used if needed in a project card)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    if (newStatus === project.status) return;

    if (newStatus === "on-hold" || newStatus === "cancelled") {
      const result = await Swal.fire({
        title: `Change status to "${newStatus}"?`,
        input: "textarea",
        inputLabel: "Status Note",
        inputPlaceholder: "Enter a note explaining the change...",
        showCancelButton: true,
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
      });
      if (result.isConfirmed) {
        const note = result.value || "";
        await updateProject({
          id: project.id,
          status: newStatus,
          statusNote: note,
          statusDate: new Date(),
          silent: true,
        });
        await Swal.fire({
          icon: "success",
          title: `Project status updated to "${newStatus}"`,
        });
      }
    } else if (newStatus === "in-progress") {
      const hasDeposit = transactions.some(
        (t) =>
          t.category.toLowerCase() === "client payment" &&
          t.description?.toLowerCase().includes("deposit")
      );
      if (!hasDeposit) {
        await Swal.fire({
          icon: "error",
          title: "Deposit Missing",
          text: "A deposit transaction is required to mark the project as In Progress.",
        });
        return;
      }
      await updateProject({
        id: project.id,
        status: newStatus,
        statusDate: new Date(),
        silent: true,
      });
      await Swal.fire({
        icon: "success",
        title: `Project status updated to "${newStatus}"`,
      });
    } else if (newStatus === "completed") {
      if (metrics && Number(metrics.paidPercentage) < 100) {
        await Swal.fire({
          icon: "error",
          title: "Budget Incomplete",
          text: "The project cannot be marked as Completed until the full budget is paid.",
        });
        return;
      }
      await updateProject({
        id: project.id,
        status: newStatus,
        statusDate: new Date(),
        silent: true,
      });
      await Swal.fire({
        icon: "success",
        title: `Project status updated to "${newStatus}"`,
      });
    } else {
      await updateProject({
        id: project.id,
        status: newStatus,
        statusDate: new Date(),
        silent: true,
      });
      await Swal.fire({
        icon: "success",
        title: `Project status updated to "${newStatus}"`,
      });
    }
  };

  // Auto-update: When project is "new" and a deposit is added, update to "in-progress".
  useEffect(() => {
    const hasDeposit = transactions.some(
      (t) =>
        t.category.toLowerCase() === "client payment" &&
        t.description?.toLowerCase().includes("deposit")
    );
    if (project && project.status === "new" && hasDeposit) {
      Swal.fire({
        title: "Deposit Added",
        text: "A deposit transaction has been added. The project status will now change to In Progress.",
        icon: "info",
      }).then(async () => {
        await updateProject({
          id: project.id,
          status: "in-progress",
          statusDate: new Date(),
          silent: true,
        });
        refetch();
      });
    }
  }, [transactions, project, updateProject, refetch]);

  // Auto-revert: When project is "in-progress" and a deposit is removed.
  useEffect(() => {
    const hasDepositNow = transactions.some(
      (t) =>
        t.category.toLowerCase() === "client payment" &&
        t.description?.toLowerCase().includes("deposit")
    );
    const hadDepositBefore =
      prevTransactionsRef.current &&
      prevTransactionsRef.current.some(
        (t) =>
          t.category.toLowerCase() === "client payment" &&
          t.description?.toLowerCase().includes("deposit")
      );
    if (project && project.status === "in-progress" && hadDepositBefore && !hasDepositNow && !reversionHandled) {
      Swal.fire({
        title: "Deposit Deleted",
        text: "The deposit transaction was deleted. The project status will now revert to New.",
        icon: "info",
      }).then(async () => {
        await updateProject({
          id: project.id,
          status: "new",
          statusDate: new Date(),
          silent: true,
        });
        refetch();
      });
      setReversionHandled(true);
    }
    prevTransactionsRef.current = transactions;
  }, [transactions, project, updateProject, reversionHandled, refetch]);

  // Reset the reversion flag when project status is "in-progress"
  useEffect(() => {
    if (project && project.status === "in-progress") {
      setReversionHandled(false);
    }
  }, [project?.status]);

  if (loading) return <LoadingSpinner text="Loading project details..." />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <Navbar page="Project Dashboard" />
      <div className="container mt-5">
        {/* Dashboard Header with Refresh Button */}
        <div className="dashboard-header mb-4 d-flex justify-content-between align-items-center">
          <div>
            <h1 className="dashboard-title">{project?.name || "Project Details"}</h1>
            <button className="btn btn-link" onClick={handleRefresh}>
              <i className="bi bi-arrow-clockwise"></i> Refresh
            </button>
          </div>
          <div className="quick-actions-wrapper">
            <button
              className="btn btn-primary"
              onClick={() => setShowNotes(true)}
              aria-label="Add a note to this project"
            >
              <i className="bi bi-sticky"></i> Add Note
            </button>
            <QuickActions onAddProject={() => {}} onAddTransaction={() => {}} />
          </div>
        </div>

        <div className="row">
          {/* Project Details Card */}
          <div className="col-md-6 mb-4">
            <ProjectDetailsCard
              project={project}
              transactions={transactions}
              metrics={metrics}
            />
          </div>
          {/* Calendar Widget */}
          <div className="col-md-6 mb-4">
            <ProjectCalendar projectId={projectId} />
          </div>
        </div>

        {/* Transactions Table */}
        <div className="row mb-4">
          <div className="col-12">
            <ErrorBoundary>
              <TransactionsTable
                transactions={transactions}
                projectId={projectId}
                fetchTransactions={refetch}
                formatCurrency={formatCurrency}
              />
            </ErrorBoundary>
          </div>
        </div>

        {/* Financial Summary and Payment Breakdown */}
        <div className="row">
          <div className="col-md-6 mb-4">
            <ErrorBoundary>
              {transactions.length > 0 ? (
                <FinancialSummary {...metrics} formatCurrency={formatCurrency} />
              ) : (
                <FinancialSummary
                  formatCurrency={formatCurrency}
                  cashReceived={0}
                  cashSpent={0}
                  remainingBudget={0}
                  availableFunds={0}
                  remainingClientPayment={0}
                  profit={0}
                  budgetSpentPercent={0}
                  totalTransactions={0}
                  daysInProgress={0}
                />
              )}
            </ErrorBoundary>
          </div>
          <div className="col-md-6 mb-4">
            <ErrorBoundary>
              {transactions.length > 0 ? (
                <PaymentBreakdown {...metrics} formatCurrency={formatCurrency} />
              ) : (
                <PaymentBreakdown
                  formatCurrency={formatCurrency}
                  cashReceived={0}
                  cashSpent={0}
                  visaExpenses={0}
                  debitExpenses={0}
                  eTransferIncome={0}
                  eTransferExpenses={0}
                  remainingClientPayment={0}
                  paidPercentage={0}
                  largestPayment={0}
                />
              )}
            </ErrorBoundary>
          </div>
        </div>
      </div>

      {/* Notes Modal */}
      <NotesModal showNotes={showNotes} setShowNotes={setShowNotes} projectId={projectId} />
    </div>
  );
}

export default ProjectDashboard;