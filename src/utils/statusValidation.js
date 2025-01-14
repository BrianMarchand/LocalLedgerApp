/**
 * Validate the transition to a new project status.
 * @param {string} status - The target status (e.g., 'completed', 'in-progress').
 * @param {Array} transactions - List of project transactions.
 * @param {Object} progressData - Progress data including percentage and other metrics.
 * @returns {Object} - Validation result { valid: boolean, reason: string }.
 */
export const validateStatusTransition = (
  status,
  transactions = [],
  progressData = {},
) => {
  console.log("Validating status transition:", {
    status,
    transactions,
    progressData,
  });

  // Example validation logic
  const hasDeposit = transactions.some(
    (t) =>
      t.category?.toLowerCase() === "client payment" &&
      t.description?.toLowerCase().includes("deposit"),
  );

  if (status === "in-progress" && !hasDeposit) {
    return {
      valid: false,
      reason:
        "A deposit transaction is required to mark the project as 'In Progress'.",
    };
  }

  if (status === "completed" && (progressData.percentage || 0) < 100) {
    return {
      valid: false,
      reason:
        "The project cannot be marked as 'Completed' until the budget is fully met.",
    };
  }

  return { valid: true };
};
