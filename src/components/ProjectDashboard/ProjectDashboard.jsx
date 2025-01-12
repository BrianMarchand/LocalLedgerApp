import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../Navbar";
import TransactionsTable from "./TransactionsTable";
import FinancialSummary from "./FinancialSummary";
import PaymentBreakdown from "./PaymentBreakdown";
import ErrorState from "./ErrorState";
import LoadingSpinner from "./LoadingSpinner";
import NotesModal from "../Notes/NotesModal";
import ErrorBoundary from "/src/components/ErrorBoundary";
import ProjectDetailsCard from "../ProjectDetailsCard";
import useFetchData from "../../hooks/useFetchData";
import { formatCurrency } from "../../utils/formatUtils";

function ProjectDashboard() {
  const { id: projectId } = useParams();
  const { project, transactions, loading, error, refetch } =
    useFetchData(projectId);

  const [metrics, setMetrics] = useState(null);
  const [showNotes, setShowNotes] = useState(false);

  const calculateMetrics = () => {
    console.log("Starting metrics calculation...");

    if (!transactions || !Array.isArray(transactions)) return {};

    const parseAmount = (amount) => {
      const parsed = parseFloat(amount);
      return isNaN(parsed) ? 0 : parsed;
    };

    // **Income**
    const incomeTransactions = transactions.filter(
      (t) => t?.category === "Client Payment",
    );
    const cashReceived = incomeTransactions
      .filter((t) => t?.type === "Cash")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);

    const eTransferIncome = incomeTransactions
      .filter((t) => t?.type === "E-Transfer")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + parseAmount(t.amount),
      0,
    );

    // **Expenses**
    const expenseTransactions = transactions.filter(
      (t) => t?.category !== "Client Payment",
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

    const eTransferExpenses = expenseTransactions
      .filter((t) => t?.type === "E-Transfer")
      .reduce((sum, t) => sum + parseAmount(t.amount), 0);

    const totalExpenses = expenseTransactions.reduce(
      (sum, t) => sum + parseAmount(t.amount),
      0,
    );

    // **Budget Calculations**
    const remainingBudget = Math.max(0, (project?.budget || 0) - totalExpenses);
    const remainingClientPayment = Math.max(
      0,
      (project?.budget || 0) - totalIncome,
    );

    // **Profit and Percentages**
    const profit = totalIncome - totalExpenses;
    const budgetSpentPercent = (
      (totalExpenses / (project?.budget || 1)) *
      100
    ).toFixed(2);

    const paidPercentage = (
      (totalIncome / (project?.budget || 1)) *
      100
    ).toFixed(2);

    const availableFunds = profit;

    // **Miscellaneous Metrics**
    const largestPayment = transactions.reduce(
      (max, t) => Math.max(max, parseAmount(t.amount)),
      0,
    );

    const totalTransactions = transactions.length;

    const daysInProgress = project?.statusDate
      ? Math.max(
          1, // Ensure at least 1 day is displayed
          Math.ceil(
            (Date.now() - project.statusDate.toMillis()) /
              (1000 * 60 * 60 * 24),
          ),
        )
      : 0; // Default to 0 if no statusDate is present

    console.log("Raw statusDate:", project.statusDate);
    console.log(
      "Converted statusDate:",
      project.statusDate?.toDate().getTime(),
    );
    console.log("Current time:", Date.now());
    console.log(
      "Difference in days:",
      (Date.now() - project.statusDate?.toDate().getTime()) /
        (1000 * 60 * 60 * 24),
    );

    // **Debugging Output**
    console.log("Metrics calculated:", {
      cashReceived,
      eTransferIncome,
      cashSpent,
      visaExpenses,
      debitExpenses,
      totalIncome,
      totalExpenses,
      remainingBudget,
      remainingClientPayment,
      profit,
      budgetSpentPercent,
      paidPercentage,
      largestPayment,
      totalTransactions,
      availableFunds,
      daysInProgress,
    });

    // **Return Metrics**
    return {
      cashReceived,
      eTransferIncome,
      cashSpent,
      visaExpenses,
      debitExpenses,
      totalIncome,
      totalExpenses,
      remainingBudget,
      remainingClientPayment,
      profit,
      budgetSpentPercent,
      paidPercentage,
      largestPayment,
      totalTransactions,
      availableFunds,
      daysInProgress,
    };
  };

  useEffect(() => {
    if (transactions.length && project) {
      const calculatedMetrics = calculateMetrics(transactions, project);
      console.log("Updated Metrics:", calculatedMetrics);
      setMetrics(calculatedMetrics);
    }
  }, [transactions, project]);

  if (loading) return <LoadingSpinner text="Loading project details..." />;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div>
      <Navbar page="Project Dashboard" />
      <div className="container mt-5">
        {/* Page Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h1>{project?.name || "Project Details"}</h1>
          <button
            className="btn btn-primary"
            onClick={() => setShowNotes(true)}
            aria-label="Add a note to this project"
          >
            Add Note
          </button>
        </div>

        {/* Project Details Card */}
        <div className="row mb-4">
          <div className="col-md-6">
            <ProjectDetailsCard
              project={project}
              transactions={transactions}
              metrics={metrics} // Pass calculated metrics
            />
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
        {metrics && (
          <div className="row">
            <div className="col-md-6 mb-4">
              <ErrorBoundary>
                <FinancialSummary
                  {...metrics}
                  formatCurrency={formatCurrency}
                />
              </ErrorBoundary>
            </div>
            <div className="col-md-6 mb-4">
              <ErrorBoundary>
                <PaymentBreakdown
                  {...metrics}
                  formatCurrency={formatCurrency}
                />
              </ErrorBoundary>
            </div>
          </div>
        )}
      </div>

      {/* Notes Modal */}
      <NotesModal
        showNotes={showNotes}
        setShowNotes={setShowNotes}
        projectId={projectId}
      />
    </div>
  );
}

export default ProjectDashboard;
